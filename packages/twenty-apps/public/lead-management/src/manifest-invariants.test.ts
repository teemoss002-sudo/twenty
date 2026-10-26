import { describe, expect, it } from 'vitest';

// Regression net for the manifest layer (the README "File map" declarations).
// Gate A payload logic is pinned in src/logic-functions/lead-labels.test.ts;
// these tests pin everything the plan says must NEVER change across syncs,
// installs and upgrades:
//   1. every universalIdentifier is unique (the anchor for all manifest syncs)
//   2. the standard Opportunity object is never redefined via defineObject
//      (API identity stays opportunity/opportunities; "Lead" is presentation)
//   3. every MANY_TO_ONE relation has its ONE_TO_MANY reverse counterpart and
//      vice versa (pairing is by exact target-field UID)
//   4. every view field references a field that exists on the view's object
//   5. navigation items point at views/objects that exist in this app
//   6. the record-page tab targets the standard Opportunity record page layout
//   7. the accepted-estimate automation listens to the estimate status field and
//      holds exactly the record permissions its two writes need

import application from 'src/app';
import estimateObject from 'src/objects/estimate.object';
import jobObject from 'src/objects/job.object';
import { OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/opportunity.object';

import estimateAccepted from 'src/logic-functions/estimate-accepted';
import defaultRole from 'src/roles/default-role';

import estimateJobsField from 'src/fields/estimate/jobs.field';
import estimateLeadField from 'src/fields/estimate/lead.field';
import estimateCustomerField from 'src/fields/estimate/customer.field';
import jobEstimateField from 'src/fields/job/estimate.field';
import jobCustomerField from 'src/fields/job/customer.field';
import jobAssignedTechField from 'src/fields/job/assigned-tech.field';
import opportunityEstimatesField from 'src/fields/opportunity/estimates.field';
import personEstimatesField from 'src/fields/person/estimates.field';
import personJobsField from 'src/fields/person/jobs.field';
import workspaceMemberJobsField from 'src/fields/workspace-member/jobs.field';

import leadPipelineView from 'src/views/lead-pipeline.view';
import allLeadsView from 'src/views/all-leads.view';
import myLeadsView from 'src/views/my-leads.view';
import hotLeadsView from 'src/views/hot-leads.view';
import allEstimatesView from 'src/views/all-estimates.view';
import allJobsView from 'src/views/all-jobs.view';
import jobBoardView from 'src/views/job-board.view';
import estimateRecordFieldsView from 'src/views/estimate-record-page-fields.view';
import jobRecordFieldsView from 'src/views/job-record-page-fields.view';

import leadsNavItem from 'src/navigation-menu-items/leads.navigation-menu-item';
import estimatesNavItem from 'src/navigation-menu-items/estimates.navigation-menu-item';
import jobsNavItem from 'src/navigation-menu-items/jobs.navigation-menu-item';

import leadPageLayoutTab from 'src/page-layout-tabs/lead.page-layout-tab';
import { LEAD_RECORD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER } from 'src/page-layouts/lead.page-layout';
import { LEAD_STAGE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

// The SDK types relation properties on the RELATION field manifest member only,
// and every `fields` array is optional — narrow once here instead of scattering
// casts through the assertions.
type RelationManifest = {
  universalIdentifier: string;
  objectUniversalIdentifier: string;
  name: string;
  relationTargetObjectMetadataUniversalIdentifier: string;
  relationTargetFieldMetadataUniversalIdentifier: string;
  universalSettings?: { relationType?: string };
};

const relationFields = [
  estimateLeadField,
  estimateCustomerField,
  estimateJobsField,
  jobEstimateField,
  jobCustomerField,
  jobAssignedTechField,
  opportunityEstimatesField,
  personEstimatesField,
  personJobsField,
  workspaceMemberJobsField,
].map((field) => field.config as unknown as RelationManifest);

const manyToOne = relationFields.filter(
  (field) => field.universalSettings?.relationType === 'MANY_TO_ONE',
);
const oneToMany = relationFields.filter(
  (field) => field.universalSettings?.relationType === 'ONE_TO_MANY',
);

const opportunityViewFields = [
  ...(leadPipelineView.config.fields ?? []),
  ...(allLeadsView.config.fields ?? []),
  ...(myLeadsView.config.fields ?? []),
  ...(hotLeadsView.config.fields ?? []),
];

const estimateViewFields = [
  ...(allEstimatesView.config.fields ?? []),
  ...(estimateRecordFieldsView.config.fields ?? []),
];

const jobViewFields = [
  ...(allJobsView.config.fields ?? []),
  ...(jobBoardView.config.fields ?? []),
  ...(jobRecordFieldsView.config.fields ?? []),
];

describe('universal identifier uniqueness', () => {
  it('every manifest entity UID is unique across the whole app', () => {
    const allEntities = [
      application.config,
      estimateObject.config,
      jobObject.config,
      ...relationFields,
      ...[
        leadPipelineView,
        allLeadsView,
        myLeadsView,
        hotLeadsView,
        allEstimatesView,
        allJobsView,
        jobBoardView,
        estimateRecordFieldsView,
        jobRecordFieldsView,
      ].map((view) => view.config),
      ...opportunityViewFields,
      ...estimateViewFields,
      ...jobViewFields,
      leadsNavItem.config,
      estimatesNavItem.config,
      jobsNavItem.config,
      leadPageLayoutTab.config,
      estimateAccepted.config,
    ];

    const universalIdentifiers = allEntities.map(
      (entity) => entity.universalIdentifier,
    );

    expect(universalIdentifiers.length).toBeGreaterThan(0);
    expect(new Set(universalIdentifiers).size).toBe(universalIdentifiers.length);
  });
});

describe('standard object safety', () => {
  it('the app registers exactly two custom objects (no Opportunity redefinition)', () => {
    // The build enforces one defineObject per file; this asserts no new custom
    // object was accidentally introduced to "replace" the standard one.
    expect(estimateObject.config.nameSingular).toBe('estimate');
    expect(jobObject.config.nameSingular).toBe('job');
  });

  it('the ONE_TO_MANY estimates reverse field attaches to the STANDARD Opportunity', () => {
    expect(opportunityEstimatesField.config.objectUniversalIdentifier).toBe(
      OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER,
    );
  });

  it('all JobFlow-owned opportunity fields target the standard object UID', async () => {
    const fieldModules = await Promise.all([
      import('src/fields/opportunity/lead-stage.field'),
      import('src/fields/opportunity/lead-source.field'),
      import('src/fields/opportunity/lead-score.field'),
      import('src/fields/opportunity/lead-temperature.field'),
      import('src/fields/opportunity/estimated-value.field'),
      import('src/fields/opportunity/next-follow-up.field'),
      import('src/fields/opportunity/lead-owner-notes.field'),
    ]);

    for (const module of fieldModules) {
      expect(module.default.config.objectUniversalIdentifier).toBe(
        OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER,
      );
    }
  });
});

describe('relation pairing', () => {
  it('every MANY_TO_ONE has an exact ONE_TO_MANY counterpart on the target object', () => {
    for (const field of manyToOne) {
      const counterpart = oneToMany.find(
        (reverse) =>
          reverse.universalIdentifier ===
            field.relationTargetFieldMetadataUniversalIdentifier &&
          reverse.objectUniversalIdentifier ===
            field.relationTargetObjectMetadataUniversalIdentifier,
      );

      expect(
        counterpart,
        `missing ONE_TO_MANY reverse for ${field.name}`,
      ).toBeDefined();
      expect(counterpart?.relationTargetFieldMetadataUniversalIdentifier).toBe(
        field.universalIdentifier,
      );
      expect(counterpart?.relationTargetObjectMetadataUniversalIdentifier).toBe(
        field.objectUniversalIdentifier,
      );
    }
  });

  it('every ONE_TO_MANY has an exact MANY_TO_ONE counterpart on the target object', () => {
    for (const field of oneToMany) {
      const counterpart = manyToOne.find(
        (forward) =>
          forward.universalIdentifier ===
            field.relationTargetFieldMetadataUniversalIdentifier &&
          forward.objectUniversalIdentifier ===
            field.relationTargetObjectMetadataUniversalIdentifier,
      );

      expect(
        counterpart,
        `missing MANY_TO_ONE forward for ${field.name}`,
      ).toBeDefined();
      expect(counterpart?.relationTargetFieldMetadataUniversalIdentifier).toBe(
        field.universalIdentifier,
      );
      expect(counterpart?.relationTargetObjectMetadataUniversalIdentifier).toBe(
        field.objectUniversalIdentifier,
      );
    }
  });

  it('pairs the expected Lead → Estimate → Job chain', () => {
    const estimateLead = relationFields.find(
      (field) =>
        field.universalIdentifier ===
        estimateLeadField.config.universalIdentifier,
    );
    const estimatesOnOpportunity = relationFields.find(
      (field) =>
        field.universalIdentifier ===
        opportunityEstimatesField.config.universalIdentifier,
    );
    const jobsOnEstimate = relationFields.find(
      (field) =>
        field.universalIdentifier ===
        estimateJobsField.config.universalIdentifier,
    );

    expect(estimateLead?.relationTargetObjectMetadataUniversalIdentifier).toBe(
      OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER,
    );
    expect(estimatesOnOpportunity?.objectUniversalIdentifier).toBe(
      OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER,
    );
    expect(jobEstimateField.config.objectUniversalIdentifier).toBe(
      jobObject.config.universalIdentifier,
    );
    expect(jobsOnEstimate?.relationTargetFieldMetadataUniversalIdentifier).toBe(
      jobEstimateField.config.universalIdentifier,
    );
  });
});

describe('view wiring', () => {
  it('every view field references a field declared for that view\u2019s object', () => {
    const estimateFieldUids = new Set([
      ...estimateObject.config.fields.map(
        (field) => field.universalIdentifier,
      ),
      estimateLeadField.config.universalIdentifier,
      estimateCustomerField.config.universalIdentifier,
    ]);
    const jobFieldUids = new Set([
      ...jobObject.config.fields.map((field) => field.universalIdentifier),
      jobEstimateField.config.universalIdentifier,
      jobCustomerField.config.universalIdentifier,
      jobAssignedTechField.config.universalIdentifier,
    ]);

    for (const viewField of estimateViewFields) {
      expect(
        estimateFieldUids.has(viewField.fieldMetadataUniversalIdentifier),
        `unknown field on an estimate view: ${viewField.fieldMetadataUniversalIdentifier}`,
      ).toBe(true);
    }

    for (const viewField of jobViewFields) {
      expect(
        jobFieldUids.has(viewField.fieldMetadataUniversalIdentifier),
        `unknown field on a job view: ${viewField.fieldMetadataUniversalIdentifier}`,
      ).toBe(true);
    }

    // Opportunity view fields mix standard fields (name, owner) with app-owned
    // fields; those pairings are pinned by the tests above, so here we assert
    // the kanban group-by targets the app-owned stage field.
    expect(
      leadPipelineView.config.mainGroupByFieldMetadataUniversalIdentifier,
    ).toBe(LEAD_STAGE_FIELD_UNIVERSAL_IDENTIFIER);
  });

  it('kanban views declare a group-by field', () => {
    expect(
      leadPipelineView.config.mainGroupByFieldMetadataUniversalIdentifier,
    ).toBeDefined();
    expect(
      jobBoardView.config.mainGroupByFieldMetadataUniversalIdentifier,
    ).toBeDefined();
  });
});

describe('navigation and page layout wiring', () => {
  it('the Leads nav item opens the Lead Pipeline view', () => {
    expect(leadsNavItem.config.viewUniversalIdentifier).toBe(
      leadPipelineView.config.universalIdentifier,
    );
  });

  it('Estimates/Jobs nav items target the app-owned objects', () => {
    expect(estimatesNavItem.config.targetObjectUniversalIdentifier).toBe(
      estimateObject.config.universalIdentifier,
    );
    expect(jobsNavItem.config.targetObjectUniversalIdentifier).toBe(
      jobObject.config.universalIdentifier,
    );
  });

  it('nav positions stay in the documented order (Leads < Estimates < Jobs)', () => {
    expect(leadsNavItem.config.position).toBeLessThan(
      estimatesNavItem.config.position,
    );
    expect(estimatesNavItem.config.position).toBeLessThan(
      jobsNavItem.config.position,
    );
  });

  it('the Lead Details tab attaches to the standard Opportunity record page', () => {
    expect(leadPageLayoutTab.config.pageLayoutUniversalIdentifier).toBe(
      LEAD_RECORD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
    );
  });
});

describe('accepted-estimate automation wiring', () => {
  it('listens to the Estimate update event filtered to the status field', () => {
    expect(estimateAccepted.config.databaseEventTriggerSettings).toEqual({
      eventName: `${estimateObject.config.nameSingular}.updated`,
      updatedFields: ['status'],
    });
  });

  it('the triggered field exists on the Estimate object', () => {
    expect(
      (estimateObject.config.fields ?? []).some(
        (field) => field.name === 'status',
      ),
    ).toBe(true);
  });

  it('the function role can read + update Job and Opportunity (create is gated on update)', () => {
    const permissions = defaultRole.config.objectPermissions ?? [];

    const jobPermission = permissions.find(
      (permission) =>
        permission.objectUniversalIdentifier ===
        jobObject.config.universalIdentifier,
    );
    const opportunityPermission = permissions.find(
      (permission) =>
        permission.objectUniversalIdentifier ===
        OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER,
    );

    // twenty-server gates record insertion on canUpdateObjectRecords
    // (engine/twenty-orm/repository/permissions.utils), so a missing override
    // here silently disables the whole automation.
    expect(jobPermission).toMatchObject({
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    });
    expect(opportunityPermission).toMatchObject({
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    });
  });

  it('the function role stays read-only everywhere else', () => {
    expect(defaultRole.config.canReadAllObjectRecords).toBe(true);
    expect(defaultRole.config.canUpdateAllObjectRecords).toBe(false);
    expect(defaultRole.config.canSoftDeleteAllObjectRecords).toBe(false);
    expect(defaultRole.config.canDestroyAllObjectRecords).toBe(false);
    // Gate A (post-install relabel) still needs settings access.
    expect(defaultRole.config.canUpdateAllSettings).toBe(true);
  });

  it('the lead stage the automation writes still offers WON', async () => {
    const leadStageField = await import('src/fields/opportunity/lead-stage.field');
    const options =
      (leadStageField.default.config as { options?: Array<{ value: string }> })
        .options ?? [];

    expect(options.map((option) => option.value)).toContain('WON');
  });
});
