# User Account System Implementation

## Overview

The User Account System has been fully implemented with the following features:

- ✅ User registration and authentication
- ✅ JWT-based session management
- ✅ Cookie-based session persistence
- ✅ Local storage support for offline mode
- ✅ Role-based access control (RBAC)
- ✅ Admin and member user roles
- ✅ Secure password hashing
- ✅ Admin-only routes and user management

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/register`
Creates a new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "role": "member"
  }
}
```

#### POST `/api/auth/login`
Authenticates a user.

**Request Body:**
```json
{
  "username": "string", // Can be username or email
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "role": "string"
  }
}
```

#### GET `/api/auth/me`
Gets current logged-in user information.

**Headers:** `Authorization: Bearer <token>` or cookie-based

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "role": "string",
    "createdAt": "datetime"
  }
}
```

#### POST `/api/auth/logout`
Logs out the current user.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### Admin-Only Endpoints

#### GET `/api/auth/users`
Gets all users (admin only).

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "role": "string",
      "createdAt": "datetime"
    }
  ]
}
```

#### PATCH `/api/auth/users/:userId/role`
Updates user role (admin only).

**Request Body:**
```json
{
  "role": "admin" | "member"
}
```

**Response:**
```json
{
  "message": "User role updated successfully",
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "role": "string"
  }
}
```

### Admin Dashboard Endpoints

#### GET `/api/admin/dashboard`
Gets system statistics (admin only).

**Response:**
```json
{
  "statistics": {
    "totalUsers": 10,
    "totalProjects": 25,
    "totalExperiments": 50,
    "totalNotes": 100
  }
}
```

#### GET `/api/admin/system-health`
Gets system health metrics (admin only).

**Response:**
```json
{
  "status": "healthy",
  "database": {
    "size": 1024000,
    "connection": "active"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET `/api/admin/my-projects`
Gets user's own projects (member access).

**Response:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "status": "string",
      "createdAt": "datetime"
    }
  ]
}
```

#### GET `/api/admin/all-projects`
Gets all projects across all users (admin only).

**Response:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "status": "string",
      "createdAt": "datetime",
      "user": {
        "id": "uuid",
        "username": "string",
        "email": "string"
      }
    }
  ]
}
```

## Session Management

### Cookie-Based Authentication
- Secure HTTP-only cookies for web clients
- Automatic cookie setting on login/register
- Cookie clearing on logout
- SameSite strict policy for security

### Local Storage Support
- Token storage for offline mode
- User data caching
- Automatic token validation
- Fallback authentication method

### Dual Authentication Support
The system supports both cookie and header-based authentication:

1. **Cookie-based (preferred for web):** `authToken` cookie
2. **Header-based (for mobile/offline):** `Authorization: Bearer <token>`

## Role-Based Access Control

### User Roles
- **admin**: Full system access, user management
- **member**: Standard user access, own data only

### Middleware Functions
- `requireAdmin`: Admin-only route protection
- `requireRole(role)`: Specific role requirement
- `requireAnyRole(roles[])`: Multiple role support

### Usage Examples
```typescript
// Admin-only route
router.get('/admin-only', authenticateToken, requireAdmin, handler);

// Member-only route
router.get('/member-only', authenticateToken, requireRole('member'), handler);

// Multiple roles
router.get('/flexible', authenticateToken, requireAnyRole(['admin', 'moderator']), handler);
```

## Security Features

### Password Security
- bcrypt hashing with salt rounds
- Secure password comparison
- No plain text password storage

### JWT Security
- 24-hour token expiration
- Secure token generation
- Role information in token payload

### Cookie Security
- HTTP-only cookies (XSS protection)
- Secure flag in production
- SameSite strict policy (CSRF protection)

## Database Schema

### User Model
```prisma
model User {
  id                  String             @id @default(uuid())
  username            String             @unique
  email               String             @unique
  password            String
  role                String             @default("member") // "admin" or "member"
  createdAt           DateTime           @default(now())
  // ... other fields
}
```

## Frontend Integration

### Authentication Storage Utility
Located at `apps/frontend/src/utils/authStorage.ts`

**Key Functions:**
- `storeAuthData(authData)`: Store auth data in localStorage
- `getStoredToken()`: Retrieve token from localStorage
- `isAuthenticatedOffline()`: Check offline authentication status
- `getAuthHeader()`: Get Authorization header for API requests
- `validateStoredToken()`: Basic token validation
- `clearAuthData()`: Clear stored authentication data

### Usage Example
```typescript
import { storeAuthData, getAuthHeader, isAuthenticatedOffline } from '../utils/authStorage';

// Store auth data after login
storeAuthData({ token: 'jwt_token', user: userData });

// Check if user is authenticated offline
if (isAuthenticatedOffline()) {
  // User can access offline features
}

// Get auth header for API requests
const headers = getAuthHeader();
```

## Testing

### Test Users
The system includes seeded test users:

**Admin User:**
- Email: `admin@example.com`
- Password: `admin123`
- Role: `admin`

**Regular User:**
- Email: `user@example.com`
- Password: `user123`
- Role: `member`

### Running the Seed Script
```bash
cd apps/backend
pnpm run seed
```

## Environment Variables

### Required Environment Variables
```env
JWT_SECRET=your-secret-key-here
NODE_ENV=development|production
```

### Optional Environment Variables
```env
# Cookie settings (defaults provided)
COOKIE_SECURE=false  # Set to true in production
COOKIE_SAMESITE=strict
```

## Implementation Files

### Backend Files
- `apps/backend/src/routes/auth.ts` - Authentication routes
- `apps/backend/src/routes/admin.ts` - Admin-only routes
- `apps/backend/src/middleware/roleAuth.ts` - Role-based middleware
- `apps/backend/prisma/schema.prisma` - Database schema
- `apps/backend/prisma/seed.ts` - Database seeding

### Frontend Files
- `apps/frontend/src/utils/authStorage.ts` - Local storage utilities

### Configuration Files
- `apps/backend/src/app.ts` - Cookie parser setup
- `apps/backend/src/routes/index.ts` - Route mounting

## Migration History

The role field was added via migration:
- Migration: `20250805222308_add_user_roles`
- Added `role` field to User model with default value "member"

## Security Considerations

1. **JWT Secret**: Use a strong, unique secret in production
2. **HTTPS**: Always use HTTPS in production for secure cookies
3. **Token Expiration**: Tokens expire after 24 hours
4. **Role Validation**: Server-side role validation on all protected routes
5. **Input Validation**: All user inputs are validated
6. **Error Handling**: Secure error messages without sensitive information

## Future Enhancements

1. **Refresh Tokens**: Implement refresh token mechanism
2. **Password Reset**: Add password reset functionality
3. **Email Verification**: Add email verification for new accounts
4. **Two-Factor Authentication**: Add 2FA support
5. **Session Management**: Add session tracking and management
6. **Rate Limiting**: Add rate limiting for auth endpoints 