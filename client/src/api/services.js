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

class AvailabilityService extends ApiService {
  constructor() {
    super('/availability');
  }

  // Get mentor availability (public)
  async getMentorAvailability(mentorId, timezone = null) {
    try {
      const params = timezone ? { timezone } : {};
      const response = await apiClient.get(`/availability/${mentorId}`, { params });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get available time slots for booking (public)
  async getAvailableSlots(mentorId, date, timezone = null, duration = 60) {
    try {
      const params = { date, duration };
      if (timezone) params.timezone = timezone;
      
      const response = await apiClient.get(`/availability/${mentorId}/slots`, { params });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get my availability (mentor only)
  async getMyAvailability() {
    try {
      const response = await apiClient.get('/availability/my/availability');
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create availability (mentor only)
  async createAvailability(availabilityData) {
    try {
      const response = await apiClient.post('/availability', availabilityData);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update availability (mentor only)
  async updateAvailability(availabilityId, availabilityData) {
    try {
      const response = await apiClient.put(`/availability/${availabilityId}`, availabilityData);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete availability (mentor only)
  async deleteAvailability(availabilityId) {
    try {
      const response = await apiClient.delete(`/availability/${availabilityId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

class BookingService extends ApiService {
  constructor() {
    super('/bookings');
  }

  // Create a new booking
  async createBooking(bookingData) {
    try {
      const response = await apiClient.post('/bookings', bookingData);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get my bookings
  async getMyBookings(params = {}) {
    try {
      const response = await apiClient.get('/bookings/my-bookings', { params });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get mentor's upcoming sessions
  async getMentorUpcomingSessions() {
    try {
      const response = await apiClient.get('/bookings/mentor/upcoming');
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get specific booking
  async getBooking(bookingId) {
    try {
      const response = await apiClient.get(`/bookings/${bookingId}`);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Cancel booking
  async cancelBooking(bookingId, reason = '') {
    try {
      const response = await apiClient.put(`/bookings/${bookingId}/cancel`, { reason });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update booking status (mentor only)
  async updateBookingStatus(bookingId, statusData) {
    try {
      const response = await apiClient.put(`/bookings/${bookingId}/status`, statusData);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

// Mega Session Service
class MegaSessionService extends ApiService {
  constructor() {
    super('/mega-sessions');
  }

  // Get all mega sessions (public)
  async getAllMegaSessions(params = {}) {
    try {
      const response = await apiClient.get('/mega-sessions', { params });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get mega session by ID (public)
  async getMegaSession(id) {
    try {
      const response = await apiClient.get(`/mega-sessions/${id}`);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create mega session (admin only)
  async createMegaSession(sessionData) {
    try {
      const response = await apiClient.post('/mega-sessions', sessionData);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Join mega session
  async joinMegaSession(sessionId) {
    try {
      const response = await apiClient.put(`/mega-sessions/${sessionId}/join`);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Leave mega session
  async leaveMegaSession(sessionId) {
    try {
      const response = await apiClient.put(`/mega-sessions/${sessionId}/leave`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update mega session status (admin only)
  async updateMegaSessionStatus(sessionId, statusData) {
    try {
      const response = await apiClient.put(`/mega-sessions/${sessionId}/status`, statusData);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get mentor's mega sessions
  async getMentorMegaSessions() {
    try {
      const response = await apiClient.get('/mega-sessions/mentor/my-sessions');
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
export const availabilityService = new AvailabilityService();
export const bookingService = new BookingService();
export const megaSessionService = new MegaSessionService();
