import { defineView, ViewType } from 'twenty-sdk/define';

import {
  LEAD_PIPELINE_GROUP_ESTIMATE_SENT_UNIVERSAL_IDENTIFIER,
  LEAD_PIPELINE_GROUP_FOLLOW_UP_UNIVERSAL_IDENTIFIER,
  LEAD_PIPELINE_GROUP_LOST_UNIVERSAL_IDENTIFIER,
  LEAD_PIPELINE_GROUP_NEW_UNIVERSAL_IDENTIFIER,
  LEAD_PIPELINE_GROUP_QUALIFIED_UNIVERSAL_IDENTIFIER,
  LEAD_PIPELINE_GROUP_WON_UNIVERSAL_IDENTIFIER,
  LEAD_PIPELINE_VIEW_UNIVERSAL_IDENTIFIER,
  LEAD_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/opportunity.object';
import { LEAD_PIPELINE_VIEW_FIELDS } from 'src/view-fields/lead-pipeline.view-fields';

// Kanban grouped by the JobFlow lead pipeline stage (New → … → Won / Lost).
export default defineView({
  universalIdentifier: LEAD_PIPELINE_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Lead Pipeline',
  objectUniversalIdentifier: OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.KANBAN,
  icon: 'IconLayoutKanban',
  position: 0,
  mainGroupByFieldMetadataUniversalIdentifier:
    LEAD_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
  shouldHideEmptyGroups: true,
  fields: LEAD_PIPELINE_VIEW_FIELDS,
  // One group per leadStage option — without these the board renders no
  // columns at all (groups are not derived from the field's options).
  groups: [
    {
      universalIdentifier: LEAD_PIPELINE_GROUP_NEW_UNIVERSAL_IDENTIFIER,
      fieldValue: 'NEW',
      position: 0,
      isVisible: true,
    },
    {
      universalIdentifier: LEAD_PIPELINE_GROUP_QUALIFIED_UNIVERSAL_IDENTIFIER,
      fieldValue: 'QUALIFIED',
      position: 1,
      isVisible: true,
    },
    {
      universalIdentifier:
        LEAD_PIPELINE_GROUP_ESTIMATE_SENT_UNIVERSAL_IDENTIFIER,
      fieldValue: 'ESTIMATE_SENT',
      position: 2,
      isVisible: true,
    },
    {
      universalIdentifier: LEAD_PIPELINE_GROUP_FOLLOW_UP_UNIVERSAL_IDENTIFIER,
      fieldValue: 'FOLLOW_UP',
      position: 3,
      isVisible: true,
    },
    {
      universalIdentifier: LEAD_PIPELINE_GROUP_WON_UNIVERSAL_IDENTIFIER,
      fieldValue: 'WON',
      position: 4,
      isVisible: true,
    },
    {
      universalIdentifier: LEAD_PIPELINE_GROUP_LOST_UNIVERSAL_IDENTIFIER,
      fieldValue: 'LOST',
      position: 5,
      isVisible: true,
    },
  ],
});
