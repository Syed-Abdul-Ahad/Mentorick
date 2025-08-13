# API Client Structure

This project includes a well-structured API client setup using Axios and Redux Toolkit.

## API Client Structure

### Core Files
- `src/api/axiosConfig.js` - Base Axios configuration with interceptors
- `src/api/ApiService.js` - Generic API service class with CRUD operations
- `src/api/services.js` - Specific service implementations (AuthService, UserService)
- `src/api/index.js` - Main export file for all API functionality

### Redux Store Structure
- `src/store/index.js` - Store configuration
- `src/store/slices/authSlice.js` - Authentication state management
- `src/store/slices/uiSlice.js` - UI state management
- `src/store/hooks.js` - Custom hooks for Redux usage

### Routing Structure
- `src/routes/index.js` - Router configuration
- `src/components/auth/ProtectedRoute.jsx` - Route protection component
- `src/components/layout/Layout.jsx` - Main layout component

## Usage Examples

### Using API Services
```javascript
import { authService, userService } from '../api';

// Login
const loginData = await authService.login({ email, password });

// Get user profile
const profile = await userService.getProfile(userId);
```

### Using Redux Hooks
```javascript
import { useAuth, useAppDispatch } from '../store/hooks';
import { loginUser } from '../store/slices/authSlice';

const dispatch = useAppDispatch();
const { user, isAuthenticated, loading } = useAuth();

// Dispatch login action
dispatch(loginUser({ email, password }));
```

### Creating New API Services
```javascript
import ApiService from './ApiService';

class PostService extends ApiService {
  constructor() {
    super('/posts'); // Base endpoint
  }

  // Custom methods
  async getPostsByUser(userId) {
    try {
      const response = await apiClient.get(`${this.baseEndpoint}/user/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

export const postService = new PostService();
```

## Environment Variables

Copy `.env.example` to `.env` and configure:
- `VITE_API_BASE_URL` - Your API base URL

## Features

- ✅ Axios interceptors for token management
- ✅ Generic CRUD operations
- ✅ Redux Toolkit with async thunks
- ✅ React Router v6 with protected routes
- ✅ Custom hooks for Redux state
- ✅ Error handling throughout the stack
- ✅ TypeScript-like development experience in JavaScript
