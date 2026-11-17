/**
 * Tech double-booking check: constants, conflict rules and API payload
 * builders, split out of on-job-schedule-changed.ts so every piece the app
 * owns is unit-tested (job-schedule.test.ts) without network I/O.
 *
 * Twenty apps react to saves (database events); they cannot block one. So the
 * check FLAGS instead of preventing: `scheduleConflict` + `conflictDetails` on
 * each affected Job, surfaced in the Schedule Conflicts view.
 *
 * Rather than patching flags incrementally, every run recomputes the whole
 * active schedule of each tech the event touches (before and after a
 * reassignment). That makes the check idempotent (safe under the server's 3
 * retries) and self-healing: moving, reassigning, completing, cancelling or
 * deleting a job clears the flags it caused on other jobs too.
 *
 * Server-verified (twenty-server source):
 *  - `serviceJob.*` matches every job event (`<object>.*` in the trigger matcher);
 *    `updatedFields` filters only `updated` events, so created / deleted /
 *    destroyed / restored events always run the check.
 *  - `properties.updatedFields` are the changed keys of the flat record
 *    (object-record-changed-properties.util.ts), i.e. join columns such as
 *    `assignedTechId`. The flag fields this check writes are deliberately NOT
 *    trigger fields, so its own updates never re-trigger it.
 *  - SELECT filters take enum literals (`status: { in: [SCHEDULED, …] }`),
 *    filters combine with `and`, and findMany pages with `first` / `after`.
 *
 * RUNTIME CONSTRAINT: no runtime imports from twenty-sdk (SDK constants are
 * stubbed in built bundles); literals are pinned to the manifests by
 * job-schedule.test.ts.
 */

export const JOB_ALL_EVENTS_NAME = 'serviceJob.*';

// Changes that can create or clear a double-booking. `assignedTech` is listed
// alongside its join column in case a server reports the relation name.
export const SCHEDULE_TRIGGER_FIELDS = [
  'scheduledStart',
  'scheduledEnd',
  'assignedTechId',
  'assignedTech',
  'status',
];

// Jobs still on a tech's calendar (pinned to the Job status options by
// job-schedule.test.ts: every option except COMPLETED and CANCELLED).
export const ACTIVE_JOB_STATUSES = ['SCHEDULED', 'EN_ROUTE', 'IN_PROGRESS'];

export const ENDS_BEFORE_START_DETAIL = 'Ends before it starts';
export const UNTITLED_JOB_NAME = 'an untitled job';
export const MAX_NAMES_IN_DETAILS = 3;
export const JOBS_PAGE_SIZE = 100;
export const MAX_JOB_PAGES = 20;

export type ScheduledJob = {
  id: string;
  name?: string | null;
  status?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  scheduleConflict?: boolean | null;
  conflictDetails?: string | null;
};

export type JobScheduleSnapshot = Partial<ScheduledJob> & {
  assignedTechId?: string | null;
  deletedAt?: string | null;
};

export type JobScheduleEvent = {
  name?: string | null;
  recordId?: string | null;
  properties?: {
    before?: JobScheduleSnapshot | null;
    after?: JobScheduleSnapshot | null;
  } | null;
};

export type ConflictState = {
  scheduleConflict: boolean;
  conflictDetails: string;
};

export const NO_CONFLICT: ConflictState = {
  scheduleConflict: false,
  conflictDetails: '',
};

const parseTime = (value?: string | null): number | null => {
  if (!value) {
    return null;
  }

  const time = Date.parse(value);

  return Number.isNaN(time) ? null : time;
};

export const isActiveJob = (job: Pick<ScheduledJob, 'status'>): boolean =>
  ACTIVE_JOB_STATUSES.includes(job.status ?? '');

const displayName = (job: ScheduledJob): string =>
  job.name?.trim() || UNTITLED_JOB_NAME;

export const formatOverlapDetail = (names: string[]): string => {
  const shown = names.slice(0, MAX_NAMES_IN_DETAILS);
  const hidden = names.length - shown.length;

  return `Overlaps ${shown.join(', ')}${hidden > 0 ? ` and ${hidden} more` : ''}`;
};

const toConflictState = (problems: string[]): ConflictState =>
  problems.length > 0
    ? { scheduleConflict: true, conflictDetails: problems.join('; ') }
    : NO_CONFLICT;

/**
 * Desired flags for every job in ONE tech's active schedule. Two jobs overlap
 * when each starts before the other ends; back-to-back jobs (one ends exactly
 * when the next starts) do not. Jobs missing a start or end are not checked.
 */
export const evaluateTechSchedule = (
  jobs: ScheduledJob[],
): Map<string, ConflictState> => {
  const timed = jobs.map((job) => ({
    job,
    start: parseTime(job.scheduledStart),
    end: parseTime(job.scheduledEnd),
  }));

  const overlapNames = new Map<string, string[]>(
    jobs.map((job) => [job.id, []]),
  );

  const valid = timed
    .filter(
      (entry): entry is { job: ScheduledJob; start: number; end: number } =>
        entry.start !== null && entry.end !== null && entry.end > entry.start,
    )
    .sort((left, right) => left.start - right.start);

  for (let index = 0; index < valid.length; index++) {
    const current = valid[index];

    for (let next = index + 1; next < valid.length; next++) {
      const other = valid[next];

      // Sorted by start: nothing later can overlap once one starts after we end.
      if (other.start >= current.end) {
        break;
      }

      overlapNames.get(current.job.id)?.push(displayName(other.job));
      overlapNames.get(other.job.id)?.push(displayName(current.job));
    }
  }

  return new Map(
    timed.map(({ job, start, end }) => {
      const problems: string[] = [];

      if (start !== null && end !== null && end <= start) {
        problems.push(ENDS_BEFORE_START_DETAIL);
      }

      const names = overlapNames.get(job.id) ?? [];

      if (names.length > 0) {
        problems.push(formatOverlapDetail(names));
      }

      return [job.id, toConflictState(problems)];
    }),
  );
};

/**
 * Desired flags for a job outside any tech schedule (no tech, or no longer
 * active): it can only be wrong on its own, by ending before it starts.
 */
export const evaluateStandaloneJob = (job: ScheduledJob): ConflictState => {
  if (!isActiveJob(job)) {
    return NO_CONFLICT;
  }

  const start = parseTime(job.scheduledStart);
  const end = parseTime(job.scheduledEnd);

  return start !== null && end !== null && end <= start
    ? toConflictState([ENDS_BEFORE_START_DETAIL])
    : NO_CONFLICT;
};

export const needsConflictUpdate = (
  job: ScheduledJob,
  desired: ConflictState,
): boolean =>
  (job.scheduleConflict ?? false) !== desired.scheduleConflict ||
  (job.conflictDetails ?? '') !== desired.conflictDetails;

export type ScheduleCheckPlan = {
  techIds: string[];
  // The job the event is about, when it still exists (not deleted/destroyed).
  triggerJob: (ScheduledJob & { assignedTechId: string | null }) | null;
};

export const planScheduleCheck = (event: JobScheduleEvent): ScheduleCheckPlan => {
  const before = event.properties?.before ?? null;
  const after = event.properties?.after ?? null;

  const techIds = [
    ...new Set(
      [after?.assignedTechId, before?.assignedTechId].filter(
        (techId): techId is string => Boolean(techId),
      ),
    ),
  ];

  const eventName = event.name ?? '';
  const isGone =
    eventName.endsWith('.deleted') ||
    eventName.endsWith('.destroyed') ||
    Boolean(after?.deletedAt) ||
    !after;
  const serviceJobId = event.recordId ?? after?.id ?? null;

  return {
    techIds,
    triggerJob:
      isGone || !serviceJobId || !after
        ? null
        : {
            id: serviceJobId,
            name: after.name ?? null,
            status: after.status ?? null,
            scheduledStart: after.scheduledStart ?? null,
            scheduledEnd: after.scheduledEnd ?? null,
            scheduleConflict: after.scheduleConflict ?? false,
            conflictDetails: after.conflictDetails ?? '',
            assignedTechId: after.assignedTechId ?? null,
          },
  };
};

// -----------------------------------------------------------------------------
// Workspace GraphQL documents (POST {TWENTY_API_URL}/graphql).
// -----------------------------------------------------------------------------

export const FIND_ACTIVE_JOBS_FOR_TECH_QUERY = `query JobFlowFindActiveJobsForTech($techId: UUID!, $after: String) {
  serviceJobs(
    filter: { and: [{ assignedTechId: { eq: $techId } }, { status: { in: [${ACTIVE_JOB_STATUSES.join(', ')}] } }] }
    first: ${JOBS_PAGE_SIZE}
    after: $after
  ) {
    edges { node { id name status scheduledStart scheduledEnd scheduleConflict conflictDetails } }
    pageInfo { hasNextPage endCursor }
  }
}`;

export const UPDATE_JOB_CONFLICT_MUTATION = `mutation JobFlowSetJobConflict($id: UUID!, $data: ServiceJobUpdateInput!) {
  updateServiceJob(id: $id, data: $data) { id scheduleConflict conflictDetails }
}`;

export const buildFindActiveJobsVariables = (
  techId: string,
  after: string | null,
) => ({ techId, after });

export const buildUpdateJobConflictVariables = (
  serviceJobId: string,
  desired: ConflictState,
) => ({
  id: serviceJobId,
  data: {
    scheduleConflict: desired.scheduleConflict,
    conflictDetails: desired.conflictDetails,
  },
});
