import client from './client';

/**
 * Fetch all applications for the authenticated user.
 */
export const getApplications = async () => {
  const response = await client.get('/applications');
  return response.data;
};

/**
 * Fetch details of a single application by ID.
 */
export const getApplication = async (applicationId) => {
  const response = await client.get(`/applications/${applicationId}`);
  return response.data;
};

/**
 * Create a new job application.
 */
export const createApplication = async (payload) => {
  const response = await client.post('/applications', payload);
  return response.data;
};

/**
 * Update an existing job application (partial update).
 */
export const updateApplication = async (applicationId, payload) => {
  const response = await client.patch(`/applications/${applicationId}`, payload);
  return response.data;
};

/**
 * Delete a job application (returns HTTP 204).
 */
export const deleteApplication = async (applicationId) => {
  await client.delete(`/applications/${applicationId}`);
  // Return void since response is HTTP 204 with empty body
};
