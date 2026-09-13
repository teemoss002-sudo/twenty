import { definePageLayout, PageLayoutTabLayoutMode } from 'twenty-sdk/define';

import {
  JOB_LAYOUT_FIELDS_WIDGET_UNIVERSAL_IDENTIFIER,
  JOB_LAYOUT_HOME_TAB_UNIVERSAL_IDENTIFIER,
  JOB_LAYOUT_TIMELINE_TAB_UNIVERSAL_IDENTIFIER,
  JOB_LAYOUT_TIMELINE_WIDGET_UNIVERSAL_IDENTIFIER,
  JOB_OBJECT_UNIVERSAL_IDENTIFIER,
  JOB_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIER,
  JOB_RECORD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Job record page: Home tab (all Job fields via a FIELDS widget view) plus the
// standard Timeline tab. Tasks, notes and attachments on the record surface
// through the timeline automatically.
export default definePageLayout({
  universalIdentifier: JOB_RECORD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Job Record Page',
  type: 'RECORD_PAGE',
  objectUniversalIdentifier: JOB_OBJECT_UNIVERSAL_IDENTIFIER,
  tabs: [
    {
      universalIdentifier: JOB_LAYOUT_HOME_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Home',
      position: 10,
      icon: 'IconHome',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: JOB_LAYOUT_FIELDS_WIDGET_UNIVERSAL_IDENTIFIER,
          title: 'Fields',
          type: 'FIELDS',
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier:
              JOB_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
    {
      universalIdentifier: JOB_LAYOUT_TIMELINE_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Timeline',
      position: 20,
      icon: 'IconTimelineEvent',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier:
            JOB_LAYOUT_TIMELINE_WIDGET_UNIVERSAL_IDENTIFIER,
          title: 'Timeline',
          type: 'TIMELINE',
          configuration: { configurationType: 'TIMELINE' },
        },
      ],
    },
  ],
});
