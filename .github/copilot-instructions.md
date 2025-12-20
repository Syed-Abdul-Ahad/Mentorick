# Mentorick Copilot Instructions

This is a full-stack mentoring platform with React frontend and Express.js backend. Understand the authentication flow, component organization, and API patterns before making changes.

## Architecture Overview

**Monorepo structure**: `client/` (React + Vite + Redux) and `server/` (Express.js + MongoDB)
- **Authentication**: Cookie-based JWT (httpOnly cookies, no localStorage) 
- **State Management**: Redux Toolkit with simple slices, minimal async thunks
- **API Communication**: Axios with `withCredentials: true` for automatic cookie handling
- **Styling**: TailwindCSS with component-based architecture

## Key Development Patterns

### Client-side Structure
- **Components**: Organized by feature domains (`/booking`, `/admin`, `/shared`) not by component type
- **API Layer**: Generic `ApiService` base class extended for specific entities - see [client/src/api/ApiService.js](client/src/api/ApiService.js)
- **Redux**: Simple auth state only (`user` object + `isAuthenticated` boolean) - avoid complex state
- **Routing**: Nested authentication checks in [client/src/App.jsx](client/src/App.jsx) with loading states

### Server-side Conventions  
- **Controllers**: Follow Express.js controller pattern with consistent error handling
- **Middleware**: Auth middleware checks both `Authorization` header and cookies - see [server/middleware/auth.js](server/middleware/auth.js)
- **Models**: Mongoose with custom methods (e.g., `generateAuthToken`, `comparePassword`)
- **Validation**: express-validator in dedicated validator files, not inline

## Essential Development Commands

```bash
# Start development (run both simultaneously)
cd client && npm run dev          # Frontend: http://localhost:5173
cd server && npm run dev          # Backend: http://localhost:5000

# Production build
cd client && npm run build
cd server && npm start
```

## Authentication Flow (Critical to Understand)

1. **Login**: Client posts credentials → Server sets httpOnly cookie → Client Redux state updated
2. **Auth Check**: On app load, `GET /auth/me` with automatic cookie → Updates Redux
3. **API Calls**: All requests include cookies automatically via `withCredentials: true`
4. **Logout**: Clear cookie on server + clear Redux state on client

**Never** manually handle tokens - cookies are automatic. See [client/src/api/axiosConfig.js](client/src/api/axiosConfig.js).

## Component Patterns

- **Shared UI**: Use components from `/shared` (Button, FormInput, Card) for consistency
- **Layout**: Use [client/src/components/layout/MainLayout.jsx](client/src/components/layout/MainLayout.jsx) wrapper for pages
- **Forms**: Follow pattern in signup/login components with controlled inputs and validation
- **State Updates**: Direct Redux dispatch, avoid complex async thunks

## API Integration Patterns

- **Service Classes**: Extend `ApiService` for new entities, don't create from scratch
- **Error Handling**: Use try/catch in components, display errors with react-hot-toast
- **Endpoints**: Follow RESTful conventions: `/api/resource` for CRUD operations
- **File Uploads**: Use multer middleware, files stored in `server/uploads/`

## Database & Models

- **User Roles**: `role` field with `'user'` or `'mentor'` values
- **Relationships**: Populate patterns in controllers (avoid deep population)
- **Validation**: Server-side with express-validator + Mongoose validation
- **Indexes**: Consider compound indexes for queries on user + availability

## Environment Configuration

**Client**: `VITE_API_BASE_URL=http://localhost:5000/api`
**Server**: `JWT_SECRET`, `MONGODB_URI`, `CLIENT_URL=http://localhost:5173`

Both must run on specified ports for cookie domain matching.