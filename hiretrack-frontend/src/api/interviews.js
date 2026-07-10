import client from './client';

/**
 * Fetch all interviews nested under a specific application.
 */
export const getInterviewsByApplication = async (applicationId) => {
  const response = await client.get(`/applications/${applicationId}/interviews`);
  return response.data;
};

/**
 * Fetch details of a single interview round by ID.
 */
export const getInterview = async (interviewId) => {
  const response = await client.get(`/interviews/${interviewId}`);
  return response.data;
};

/**
 * Create a new interview round nested under a specific application.
 */
export const createInterview = async (applicationId, payload) => {
  const response = await client.post(`/applications/${applicationId}/interviews`, payload);
  return response.data;
};

/**
 * Update an existing interview round (partial update).
 */
export const updateInterview = async (interviewId, payload) => {
  const response = await client.patch(`/interviews/${interviewId}`, payload);
  return response.data;
};

/**
 * Delete an interview round (returns HTTP 204).
 */
export const deleteInterview = async (interviewId) => {
  await client.delete(`/interviews/${interviewId}`);
};
