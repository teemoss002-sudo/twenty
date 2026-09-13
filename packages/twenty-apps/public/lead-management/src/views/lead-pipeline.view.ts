import { defineView, ViewType } from 'twenty-sdk/define';

import {
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
});
