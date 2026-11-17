import { defineLogicFunction } from 'twenty-sdk/define';

// NOTE: runtime literals live in ./job-schedule.ts — SDK constants are stubbed
// inside built function bundles, so this handler must not import runtime
// values from twenty-sdk.

import { JOB_SCHEDULE_CHECK_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

import { type ApiAccess, resolveApiAccess } from './api-access';
import {
  buildFindActiveJobsVariables,
  buildUpdateJobConflictVariables,
  type ConflictState,
  evaluateStandaloneJob,
  evaluateTechSchedule,
  FIND_ACTIVE_JOBS_FOR_TECH_QUERY,
  JOB_ALL_EVENTS_NAME,
  type JobScheduleEvent,
  MAX_JOB_PAGES,
  needsConflictUpdate,
  planScheduleCheck,
  SCHEDULE_TRIGGER_FIELDS,
  type ScheduledJob,
  UPDATE_JOB_CONFLICT_MUTATION,
} from './job-schedule';
import { requestWorkspaceApi } from './workspace-api';

/**
 * Tech double-booking check (see ./job-schedule.ts for the rationale).
 * Recomputes each affected tech's active schedule and writes only the flags
 * that changed, so repeated or retried runs converge on the same result.
 */

type JobsPage = {
  edges?: Array<{ node?: ScheduledJob }>;
  pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
};

const fetchActiveJobsForTech = async (
  access: ApiAccess,
  techId: string,
): Promise<ScheduledJob[]> => {
  const jobs: ScheduledJob[] = [];
  let after: string | null = null;

  for (let page = 0; page < MAX_JOB_PAGES; page++) {
    const data = await requestWorkspaceApi(
      access,
      FIND_ACTIVE_JOBS_FOR_TECH_QUERY,
      buildFindActiveJobsVariables(techId, after),
    );
    const connection = data.serviceJobs as JobsPage | undefined;

    for (const edge of connection?.edges ?? []) {
      if (edge.node?.id) {
        jobs.push(edge.node);
      }
    }

    if (!connection?.pageInfo?.hasNextPage || !connection.pageInfo.endCursor) {
      return jobs;
    }

    after = connection.pageInfo.endCursor;
  }

  console.log(
    `[JobFlow] tech ${techId} has more than ${jobs.length} active jobs; checked the first ${jobs.length}`,
  );

  return jobs;
};

export const handler = async (event: JobScheduleEvent): Promise<string> => {
  const plan = planScheduleCheck(event);

  const triggerNeedsOwnCheck =
    plan.triggerJob !== null &&
    needsConflictUpdate(plan.triggerJob, evaluateStandaloneJob(plan.triggerJob));

  if (plan.techIds.length === 0 && !triggerNeedsOwnCheck) {
    return '[JobFlow] schedule check skipped: no tech schedule affected';
  }

  const access = resolveApiAccess(process.env);
  const updates = new Map<string, ConflictState>();
  const checkedJobIds = new Set<string>();

  for (const techId of plan.techIds) {
    const jobs = await fetchActiveJobsForTech(access, techId);
    const desiredByJob = evaluateTechSchedule(jobs);

    for (const job of jobs) {
      checkedJobIds.add(job.id);

      const desired = desiredByJob.get(job.id);

      if (desired && needsConflictUpdate(job, desired)) {
        updates.set(job.id, desired);
      }
    }
  }

  // The job itself may sit outside every schedule checked above (no tech, or
  // completed/cancelled): it still must not keep a stale flag.
  if (plan.triggerJob && !checkedJobIds.has(plan.triggerJob.id)) {
    const desired = evaluateStandaloneJob(plan.triggerJob);

    if (needsConflictUpdate(plan.triggerJob, desired)) {
      updates.set(plan.triggerJob.id, desired);
    }
  }

  for (const [serviceJobId, desired] of updates) {
    await requestWorkspaceApi(
      access,
      UPDATE_JOB_CONFLICT_MUTATION,
      buildUpdateJobConflictVariables(serviceJobId, desired),
    );
  }

  const flagged = [...updates.values()].filter(
    (desired) => desired.scheduleConflict,
  ).length;
  const summary = `[JobFlow] schedule check: ${checkedJobIds.size} active job(s) across ${plan.techIds.length} tech(s); ${flagged} flagged, ${updates.size - flagged} cleared`;

  console.log(summary);

  return summary;
};

export default defineLogicFunction({
  universalIdentifier: JOB_SCHEDULE_CHECK_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'job-schedule-check',
  description:
    'Flags jobs that double-book a tech (overlapping times) or end before they start, and clears the flags once the schedule is fixed. Runs whenever a job is created, deleted, restored, rescheduled, reassigned or changes status.',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: JOB_ALL_EVENTS_NAME,
    updatedFields: SCHEDULE_TRIGGER_FIELDS,
  },
  handler,
});
