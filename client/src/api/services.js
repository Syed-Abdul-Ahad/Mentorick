import ApiService from './ApiService';
import apiClient from './axiosConfig';

class AuthService extends ApiService {
  constructor() {
    super('/auth');
  }

  // Login
  async login(credentials) {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { user } = response.data.data;
      console.log('Login successful:', user);
      
      // Token is now set as httpOnly cookie by the server
      return { user };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Register
  async register(userData) {
    try {
      const response = await apiClient.post('/auth/register', userData);
      const { user } = response.data.data;
      
      // Token is now set as httpOnly cookie by the server
      return { user };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Logout
  async logout() {
    try {
      await apiClient.post('/auth/logout');
      // Cookie will be cleared by the server
      return { success: true };
    } catch (error) {
      // Even if logout fails on server, we can still redirect
      throw this.handleError(error);
    }
  }

  // Get current user profile
  async getMe() {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data.data.user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update password
  async updatePassword(passwordData) {
    try {
      const response = await apiClient.put('/auth/password', passwordData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Reset password
  async resetPassword(resetData) {
    try {
      const response = await apiClient.post('/auth/reset-password', resetData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

class UserService extends ApiService {
  constructor() {
    super('/users');
  }

  // Get user profile
  async getProfile(userId) {
    try {
      const response = await apiClient.get(`/users/${userId}/profile`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update user profile
  async updateProfile(userId, profileData) {
    try {
      const response = await apiClient.put(`/users/${userId}/profile`, profileData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

class MentorService extends ApiService {
  constructor() {
    super('/mentor-profiles');
  }

  // Get all mentor profiles
  async getAllMentors() {
    try {
      const response = await apiClient.get('/mentor/profiles');
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get mentor profile by ID
  async getMentorById(mentorId) {
    try {
      const response = await apiClient.get(`/mentor/profile/${mentorId}`);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get my mentor profile (authenticated)
  async getMyProfile() {
    try {
      const response = await apiClient.get('/mentor/my-profile');
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create or update mentor profile
  async createOrUpdateProfile(profileData) {
    try {
      const response = await apiClient.post('/mentor/profile', profileData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

// Export service instances
export const authService = new AuthService();
export const userService = new UserService();
export const mentorService = new MentorService();
