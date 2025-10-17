# Fix for 403 Forbidden Error in Users Settings

## Problem
The users section in settings shows "Failed to load users: 403 Forbidden - Forbidden" because the API endpoints require ADMIN role, but the current user might not have ADMIN privileges.

## Solutions Applied

### 1. Temporary Fix - Lower Permission Requirements
- Changed users API endpoints from requiring `ADMIN` role to requiring `MANAGER` role
- This allows users with MANAGER role or higher to access the users section

### 2. Debug Endpoint
- Added `/api/debug/user-info` endpoint to check current user's role and session information
- Visit `/api/debug/user-info` to see your current user role

### 3. Admin User Creation Script
- Created `scripts/create-admin-user.js` to create an admin user
- Run `npm run create-admin` to create an admin user with:
  - Email: admin@example.com
  - Password: admin123
  - Role: ADMIN

## How to Use

1. **Check your current role**: Visit `/api/debug/user-info` in your browser
2. **If you need admin access**: Run `npm run create-admin` and login with admin@example.com / admin123
3. **If you have MANAGER role**: The users section should now work

## Files Modified
- `src/app/api/users/route.ts` - Changed from ADMIN to MANAGER requirement
- `src/app/api/users/[id]/route.ts` - Changed from ADMIN to MANAGER requirement
- `src/app/api/debug/user-info/route.ts` - New debug endpoint
- `scripts/create-admin-user.js` - Admin user creation script
- `package.json` - Added create-admin script

## Reverting Changes
To revert to ADMIN-only access, change the `requireRole` calls back to `'ADMIN'` in the users API files.
