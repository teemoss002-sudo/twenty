import { definePageLayout, PageLayoutTabLayoutMode } from 'twenty-sdk/define';

import {
  INVOICE_LAYOUT_FIELDS_WIDGET_UNIVERSAL_IDENTIFIER,
  INVOICE_LAYOUT_HOME_TAB_UNIVERSAL_IDENTIFIER,
  INVOICE_LAYOUT_TIMELINE_TAB_UNIVERSAL_IDENTIFIER,
  INVOICE_LAYOUT_TIMELINE_WIDGET_UNIVERSAL_IDENTIFIER,
  INVOICE_OBJECT_UNIVERSAL_IDENTIFIER,
  INVOICE_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIER,
  INVOICE_RECORD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Invoice record page: Home tab (all Invoice fields via a FIELDS widget view)
// plus the standard Timeline tab, same as the Estimate and Job pages.
export default definePageLayout({
  universalIdentifier: INVOICE_RECORD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Invoice Record Page',
  type: 'RECORD_PAGE',
  objectUniversalIdentifier: INVOICE_OBJECT_UNIVERSAL_IDENTIFIER,
  tabs: [
    {
      universalIdentifier: INVOICE_LAYOUT_HOME_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Home',
      position: 10,
      icon: 'IconHome',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: INVOICE_LAYOUT_FIELDS_WIDGET_UNIVERSAL_IDENTIFIER,
          title: 'Fields',
          type: 'FIELDS',
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier:
              INVOICE_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
    {
      universalIdentifier: INVOICE_LAYOUT_TIMELINE_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Timeline',
      position: 20,
      icon: 'IconTimelineEvent',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier:
            INVOICE_LAYOUT_TIMELINE_WIDGET_UNIVERSAL_IDENTIFIER,
          title: 'Timeline',
          type: 'TIMELINE',
          configuration: { configurationType: 'TIMELINE' },
        },
      ],
    },
  ],
});
