// Export API client configuration
export { default as apiClient } from './axiosConfig';

// Export base API service class
export { default as ApiService } from './ApiService';

// Export specific services
export { 
  authService, 
  userService, 
  mentorService, 
  availabilityService, 
  bookingService, 
  megaSessionService 
} from './services';

// Export everything for convenience
export * from './services';
