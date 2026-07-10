import client from './client';

/**
 * Authentication and User Profile API services connecting to backend routes.
 */

export const register = async (name, email, password) => {
  const response = await client.post('/auth/register', { name, email, password });
  return response.data;
};

export const login = async (email, password) => {
  const response = await client.post('/auth/login', { email, password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await client.get('/users/me');
  return response.data;
};

export const updateCurrentUser = async (payload) => {
  const response = await client.patch('/users/me', payload);
  return response.data;
};

export const deleteCurrentUser = async () => {
  await client.delete('/users/me');
};
