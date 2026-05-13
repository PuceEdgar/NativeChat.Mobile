import { httpClient } from '../utils/httpClient';
import { secureStorage } from '../utils/secureStorage';

/**
 * Service handling Authentication API interactions.
 */
export const authService = {
  async register(username: string, password: string): Promise<void> {
    await httpClient.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async login(username: string, password: string): Promise<string> {
    const data = await httpClient.request<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    await secureStorage.setItem('jwt', data.token);
    return data.token;
  },

  async logout(): Promise<void> {
    await secureStorage.removeItem('jwt');
  },
};
