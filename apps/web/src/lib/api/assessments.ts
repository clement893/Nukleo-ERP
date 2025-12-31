/**
 * Assessments API
 * API client for assessments endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface StartAssessmentResponse {
  assessment_id: number;
  message: string;
  [key: string]: unknown;
}

export interface Assessment {
  id: number;
  [key: string]: unknown;
}

/**
 * Assessments API client
 */
export const assessmentsAPI = {
  /**
   * Start an assessment
   */
  start: async (): Promise<Assessment> => {
    const response = await apiClient.post<StartAssessmentResponse>('/v1/assessments/start');
    const data = extractApiData<StartAssessmentResponse>(response);
    
    // Properly transform StartAssessmentResponse to Assessment
    // Create a new object with the correct shape instead of mutating and casting
    const { assessment_id, message, ...rest } = data;
    return {
      ...rest,
      id: assessment_id,
    } as Assessment;
  },
};
