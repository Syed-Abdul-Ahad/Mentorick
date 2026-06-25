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
      if(response.data.status !== 'success'){
        throw new Error(response.data.message || 'Login failed');
      }
      const { user } = response.data.data;
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
      const response = await apiClient.post('/auth/forgotpassword', { email });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Reset password
  async resetPassword(token, password) {
    try {
      const response = await apiClient.put(`/auth/resetpassword/${token}`, { password });
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
    super('/mentor/availability');
  }

  // Get my own availability (mentor only)
  async getMyAvailability() {
    try {
      const response = await apiClient.get('/mentor/availability/my-availability');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Set weekly availability (repeat ON/OFF)
  async setWeeklyAvailability(dayOfWeek, slots, isActive = true) {
    try {
      const response = await apiClient.post('/mentor/availability/weekly', {
        dayOfWeek,
        slots: slots.map(hour => ({ hour })),
        isActive
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Set date-specific availability (repeat OFF)
  async setDateAvailability(date, slots) {
    try {
      const response = await apiClient.post('/mentor/availability/date', {
        date,
        slots: slots.map(hour => ({ hour }))
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Set unavailability period
  async setUnavailability(from, to, reason = '') {
    try {
      const response = await apiClient.post('/mentor/availability/unavailable', {
        from,
        to,
        reason
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get mentor availability for mentee (public)
  async getMentorAvailability(mentorId, timezone = null) {
    try {
      const params = timezone ? { timezone } : {};
      const response = await apiClient.get(`/mentor/availability/${mentorId}`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

class BookingService extends ApiService {
  constructor() {
    super('/booking');
  }

  // Create a new booking
  async createBooking(bookingData) {
    try {
      const response = await apiClient.post('/booking/create', bookingData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get my bookings
  async getMyBookings(params = {}) {
    try {
      const response = await apiClient.get('/booking/my-bookings', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get booking analytics
  async getBookingAnalytics() {
    try {
      const response = await apiClient.get('/booking/analytics');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

class PaymentService extends ApiService {
  constructor() {
    super('/payments');
  }

  async createOrder(payload) {
    try {
      const response = await apiClient.post('/payments/orders', payload);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async captureOrder(payload) {
    try {
      const response = await apiClient.post('/payments/orders/capture', payload);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

class MegaSessionService extends ApiService {
  constructor() {
    super('/mega-sessions');
  }

  // Create a new mega session (Admin only)
  async createMegaSession(sessionData) {
    try {
      const response = await apiClient.post('/mega-sessions/create', sessionData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get all mega sessions
  async getMegaSessions(params = {}) {
    try {
      const response = await apiClient.get('/mega-sessions/list', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get pending mega sessions awaiting mentor approval
  async getPendingMegaSessions() {
    try {
      const response = await apiClient.get('/mega-sessions/pending');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Accept a pending mega session (Mentor)
  async acceptMegaSession(megaSessionId) {
    try {
      const response = await apiClient.post(`/mega-sessions/${megaSessionId}/accept`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Reject a pending mega session (Mentor)
  async rejectMegaSession(megaSessionId) {
    try {
      const response = await apiClient.post(`/mega-sessions/${megaSessionId}/reject`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Join a mega session
  async joinMegaSession(megaSessionId, joinData = {}) {
    try {
      const response = await apiClient.post(`/mega-sessions/${megaSessionId}/join`, joinData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

class MenteeService extends ApiService {
  constructor() {
    super('/mentee');
  }

  // Get my mentee profile (authenticated)
  async getMyProfile() {
    try {
      const response = await apiClient.get('/mentee/my-profile');
      console.log('Mentee profile response:', response);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create or update mentee profile
  async createOrUpdateProfile(profileData) {
    try {
      const response = await apiClient.post('/mentee/profile', profileData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get mentee profile by ID (public)
  async getMenteeById(menteeId) {
    try {
      const response = await apiClient.get(`/mentee/profile/${menteeId}`);
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
export const menteeService = new MenteeService();
export const availabilityService = new AvailabilityService();
export const bookingService = new BookingService();
export const paymentService = new PaymentService();
export const megaSessionService = new MegaSessionService();
