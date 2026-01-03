/**
 * API Module Exports
 * 
 * Central export point for all API modules and clients.
 * This file re-exports everything from api.ts and other API modules.
 */

// Re-export apiClient and getApiUrl from the main api.ts file
export { apiClient, getApiUrl, api } from '../api';

// Re-export all API modules from the main api.ts file
export {
  authAPI,
  usersAPI,
  resourcesAPI,
  aiAPI,
  emailAPI,
  subscriptionsAPI,
  invitationsAPI,
  integrationsAPI,
  apiSettingsAPI,
  supportTicketsAPI,
  seoAPI,
  surveysAPI,
} from '../api';


// Re-export ERP portal API
export { erpPortalAPI } from './erp-portal';

// Re-export ERP module API (unified)
export { erpAPI } from './erp';
export type {
  ERPDashboardStats as ERPDashboardStatsType,
  ERPInvoice as ERPInvoiceType,
  ERPOrder as ERPOrderType,
  ERPInventoryProduct as ERPInventoryProductType,
  ERPReport as ERPReportType,
} from './erp';

// Re-export theme API functions
export * from './theme';

// Re-export theme font API
export * from './theme-font';
export { checkFonts } from './theme-font';

// Re-export notifications API
export { notificationsAPI } from './notifications';

// Re-export settings API
export { settingsAPI } from './settings';

// Re-export API keys API
export { apiKeysAPI } from './api-keys';
export type { APIKeyCreate, APIKeyResponse, APIKeyListResponse, APIKeyRotateResponse } from './api-keys';

// Re-export admin API
export { adminAPI } from './admin';

// Re-export teams API (from separate file)
export { teamsAPI as teamsAPIModule } from './teams';

// Re-export invitations API (from separate file)
export { invitationsAPI as invitationsAPIModule } from './invitations';

// Re-export RBAC API
export { rbacAPI } from './rbac';

// Re-export pages API (from separate file)
export { pagesAPI as pagesAPIModule } from './pages';

// Re-export client
export { apiClient as client } from './client';

// Re-export theme errors utilities
export * from './theme-errors';

// Re-export contacts API
export { contactsAPI } from './contacts';
export type { Contact, ContactCreate, ContactUpdate } from './contacts';

// Re-export commercial module API (unified)
export { commercialAPI } from './commercial';
export type {
  Contact as CommercialContact,
  ContactCreate as CommercialContactCreate,
  ContactUpdate as CommercialContactUpdate,
  Company as CommercialCompany,
  CompanyCreate as CommercialCompanyCreate,
  CompanyUpdate as CommercialCompanyUpdate,
  Opportunity as CommercialOpportunity,
  OpportunityCreate as CommercialOpportunityCreate,
  OpportunityUpdate as CommercialOpportunityUpdate,
  Quote as CommercialQuote,
  QuoteCreate as CommercialQuoteCreate,
  QuoteUpdate as CommercialQuoteUpdate,
  Submission as CommercialSubmission,
  SubmissionCreate as CommercialSubmissionCreate,
  SubmissionUpdate as CommercialSubmissionUpdate,
} from './commercial';

// Re-export réseau contacts API
export { reseauContactsAPI } from './reseau-contacts';
export type { Contact as ReseauContact, ContactCreate as ReseauContactCreate, ContactUpdate as ReseauContactUpdate } from './reseau-contacts';

// Re-export project tasks API
export { projectTasksAPI } from './project-tasks';
export type { ProjectTask, ProjectTaskCreate, ProjectTaskUpdate, TaskStatus, TaskPriority } from './project-tasks';

// Re-export preferences API
export { preferencesAPI } from './preferences';
export type { UserPreferences, PreferenceResponse } from './preferences';

// Re-export finances module API (unified)
export { financesAPI } from './finances';
export { facturationsAPI } from './finances/facturations';
export type {
  FinanceInvoice,
  FinanceInvoiceCreate,
  FinanceInvoiceUpdate,
  Payment,
  PaymentCreate,
  InvoiceLineItem,
  ClientData,
} from './finances/facturations';

// Re-export projects module API (unified)
export { projectsAPI } from './projects';

// Re-export management module API (unified)
export { managementAPI, teamsAPI, employeesAPI } from './management';

// Re-export onboarding API
export { onboardingAPI } from './onboarding';
export type { OnboardingStep, OnboardingProgress, EmployeeOnboardingItem } from './onboarding';

// Re-export feedback API
export { feedbackAPI } from './feedback';
export type { Feedback, FeedbackCreate, FeedbackUpdate, FeedbackType, FeedbackStatus } from './feedback';

// Re-export agenda module API (unified)
export { agendaModuleAPI } from './agenda-unified';
export type {
  CalendarEvent as AgendaEventType,
  CalendarEventCreate as AgendaEventCreateType,
  CalendarEventUpdate as AgendaEventUpdateType,
} from './agenda-unified';

// Re-export content module API (unified)
export { contentAPI, pagesAPI, mediaAPI, formsAPI, menusAPI } from './content';

// Re-export themes module API (unified)
export { themesAPI } from './themes';
export * from './theme';

// Re-export analytics module API (unified)
export { analyticsModuleAPI, analyticsAPI, insightsAPI, reportsAPI } from './analytics-unified';


