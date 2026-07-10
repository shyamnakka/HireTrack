import client from './client';

/**
 * Fetch all reminders for the authenticated user.
 */
export const getReminders = async () => {
  const response = await client.get('/reminders');
  return response.data;
};

/**
 * Fetch details of a single reminder by ID.
 */
export const getReminder = async (reminderId) => {
  const response = await client.get(`/reminders/${reminderId}`);
  return response.data;
};

/**
 * Create a new reminder.
 */
export const createReminder = async (payload) => {
  const response = await client.post('/reminders', payload);
  return response.data;
};

/**
 * Update an existing reminder (partial update).
 */
export const updateReminder = async (reminderId, payload) => {
  const response = await client.patch(`/reminders/${reminderId}`, payload);
  return response.data;
};

/**
 * Delete a reminder (returns HTTP 204).
 */
export const deleteReminder = async (reminderId) => {
  await client.delete(`/reminders/${reminderId}`);
};
