/**
 * React Query hooks for Commercial Module
 * Unified hooks for all commercial operations
 */

// Re-export all commercial hooks
export {
  useContacts,
  useInfiniteContacts,
  useContact,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  useDeleteAllContacts,
  contactsAPI,
  contactKeys,
} from './contacts';

export {
  useCompanies,
  useInfiniteCompanies,
  useCompany,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
  companiesAPI,
  companyKeys,
} from './companies';

export {
  useOpportunities,
  useInfiniteOpportunities,
  useOpportunity,
  useCreateOpportunity,
  useUpdateOpportunity,
  useDeleteOpportunity,
  opportunitiesAPI,
  opportunityKeys,
} from './opportunities';

export {
  useQuotes,
  useInfiniteQuotes,
  useQuote,
  useCreateQuote,
  useUpdateQuote,
  useDeleteQuote,
  quotesAPI,
  quoteKeys,
} from './quotes';

export {
  useSubmissions,
  useInfiniteSubmissions,
  useSubmission,
  useCreateSubmission,
  useUpdateSubmission,
  useDeleteSubmission,
  submissionsAPI,
  submissionKeys,
} from './submissions';

// Re-export commercial API
export { commercialAPI } from '../api/commercial';

// Unified query keys for commercial module
export const commercialKeys = {
  all: ['commercial'] as const,
  contacts: () => [...commercialKeys.all, 'contacts'] as const,
  companies: () => [...commercialKeys.all, 'companies'] as const,
  opportunities: () => [...commercialKeys.all, 'opportunities'] as const,
  quotes: () => [...commercialKeys.all, 'quotes'] as const,
  submissions: () => [...commercialKeys.all, 'submissions'] as const,
};
