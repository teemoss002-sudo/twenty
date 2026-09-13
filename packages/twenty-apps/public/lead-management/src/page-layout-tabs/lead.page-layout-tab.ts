import {
  definePageLayoutTab,
  PageLayoutTabLayoutMode,
  type PageLayoutWidgetVerticalListPosition,
} from 'twenty-sdk/define';

import {
  ESTIMATED_VALUE_FIELD_UNIVERSAL_IDENTIFIER,
  LEAD_OWNER_NOTES_FIELD_UNIVERSAL_IDENTIFIER,
  LEAD_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
  LEAD_SCORE_FIELD_UNIVERSAL_IDENTIFIER,
  LEAD_SOURCE_FIELD_UNIVERSAL_IDENTIFIER,
  LEAD_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
  LEAD_TAB_WIDGET_ESTIMATED_VALUE_UNIVERSAL_IDENTIFIER,
  LEAD_TAB_WIDGET_NEXT_FOLLOW_UP_UNIVERSAL_IDENTIFIER,
  LEAD_TAB_WIDGET_OWNER_NOTES_UNIVERSAL_IDENTIFIER,
  LEAD_TAB_WIDGET_SCORE_UNIVERSAL_IDENTIFIER,
  LEAD_TAB_WIDGET_SOURCE_UNIVERSAL_IDENTIFIER,
  LEAD_TAB_WIDGET_STAGE_UNIVERSAL_IDENTIFIER,
  LEAD_TAB_WIDGET_TEMPERATURE_UNIVERSAL_IDENTIFIER,
  LEAD_TEMPERATURE_FIELD_UNIVERSAL_IDENTIFIER,
  NEXT_FOLLOW_UP_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { LEAD_RECORD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER } from 'src/page-layouts/lead.page-layout';

const buildFieldWidget = (
  universalIdentifier: string,
  title: string,
  fieldMetadataId: string,
  index: number,
) => ({
  universalIdentifier,
  title,
  type: 'FIELD' as const,
  // `satisfies` pins the enum to its VERTICAL_LIST member — without a contextual
  // type (helper fn, not an inline literal), TS widens the member to the full
  // enum union, which the 2.39 discriminated position type rejects.
  position: {
    layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
    index,
  } satisfies PageLayoutWidgetVerticalListPosition,
  configuration: {
    configurationType: 'FIELD' as const,
    fieldMetadataId,
    fieldDisplayMode: 'FIELD' as const,
  },
});

// "Lead Details" tab on the standard Opportunity record page: every JobFlow-owned
// field in pipeline order. Position 50 keeps it behind Twenty's built-in tabs.
export default definePageLayoutTab({
  universalIdentifier: LEAD_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
  pageLayoutUniversalIdentifier: LEAD_RECORD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  title: 'Lead Details',
  position: 50,
  icon: 'IconTargetArrow',
  layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
  widgets: [
    buildFieldWidget(
      LEAD_TAB_WIDGET_STAGE_UNIVERSAL_IDENTIFIER,
      'Stage',
      LEAD_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
      0,
    ),
    buildFieldWidget(
      LEAD_TAB_WIDGET_TEMPERATURE_UNIVERSAL_IDENTIFIER,
      'Temperature',
      LEAD_TEMPERATURE_FIELD_UNIVERSAL_IDENTIFIER,
      1,
    ),
    buildFieldWidget(
      LEAD_TAB_WIDGET_SCORE_UNIVERSAL_IDENTIFIER,
      'Lead Score',
      LEAD_SCORE_FIELD_UNIVERSAL_IDENTIFIER,
      2,
    ),
    buildFieldWidget(
      LEAD_TAB_WIDGET_SOURCE_UNIVERSAL_IDENTIFIER,
      'Lead Source',
      LEAD_SOURCE_FIELD_UNIVERSAL_IDENTIFIER,
      3,
    ),
    buildFieldWidget(
      LEAD_TAB_WIDGET_ESTIMATED_VALUE_UNIVERSAL_IDENTIFIER,
      'Estimated Value',
      ESTIMATED_VALUE_FIELD_UNIVERSAL_IDENTIFIER,
      4,
    ),
    buildFieldWidget(
      LEAD_TAB_WIDGET_NEXT_FOLLOW_UP_UNIVERSAL_IDENTIFIER,
      'Next Follow-up',
      NEXT_FOLLOW_UP_FIELD_UNIVERSAL_IDENTIFIER,
      5,
    ),
    buildFieldWidget(
      LEAD_TAB_WIDGET_OWNER_NOTES_UNIVERSAL_IDENTIFIER,
      'Owner Notes',
      LEAD_OWNER_NOTES_FIELD_UNIVERSAL_IDENTIFIER,
      6,
    ),
  ],
});
