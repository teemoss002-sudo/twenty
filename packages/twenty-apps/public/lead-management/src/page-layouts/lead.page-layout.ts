import { STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS } from 'twenty-sdk/define';

/**
 * Lead tab definition constants for the standard Opportunity record page.
 *
 * The Opportunity record-page layout is owned by Twenty
 * (STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage), so this
 * app does NOT claim the layout with definePageLayout() — per the Apps docs,
 * definePageLayout is for layouts of objects the app owns. Tabs are added to
 * the existing standard layout with definePageLayoutTab(); see
 * src/page-layout-tabs/lead.page-layout-tab.ts. This module holds the layout
 * reference the tab attaches to.
 */
export const LEAD_RECORD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER =
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage
    .universalIdentifier;
