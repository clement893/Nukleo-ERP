/**
 * Commercial Module API
 * Unified API client for commercial operations
 * 
 * This module provides a unified interface for all commercial operations:
 * - Contacts
 * - Companies
 * - Opportunities
 * - Quotes
 * - Submissions
 */

// Re-export all commercial API clients
export { contactsAPI, type Contact, type ContactCreate, type ContactUpdate } from './contacts';
export { companiesAPI, type Company, type CompanyCreate, type CompanyUpdate } from './companies';
export { opportunitiesAPI, type Opportunity, type OpportunityCreate, type OpportunityUpdate } from './opportunities';
export { quotesAPI, type Quote, type QuoteCreate, type QuoteUpdate, type QuoteLineItem } from './quotes';
export { submissionsAPI, type Submission, type SubmissionCreate, type SubmissionUpdate } from './submissions';

/**
 * Unified Commercial API
 * Provides access to all commercial operations through a single interface
 */
export const commercialAPI = {
  contacts: contactsAPI,
  companies: companiesAPI,
  opportunities: opportunitiesAPI,
  quotes: quotesAPI,
  submissions: submissionsAPI,
};

// Re-export for convenience
import { contactsAPI } from './contacts';
import { companiesAPI } from './companies';
import { opportunitiesAPI } from './opportunities';
import { quotesAPI } from './quotes';
import { submissionsAPI } from './submissions';
