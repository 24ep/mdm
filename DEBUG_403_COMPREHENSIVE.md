# 🔍 Comprehensive 403 Error Debugging Guide

## Current Status
The 403 Forbidden error persists in the users table. I've implemented comprehensive debugging to identify the root cause.

## Debugging Steps Implemented

### 1. **Fixed Entities Page Error** ✅
- **Issue**: `attribute.type.toLowerCase()` was failing because `attribute.type` was undefined
- **Fix**: Added null checks for `attribute.type` and `attribute` object
- **Files**: `src/app/data/entities/page.tsx`

### 2. **Enhanced API Debugging** ✅
- **Added**: `/api/debug/users-test` endpoint for comprehensive testing
- **Added**: Enhanced logging in users API and RBAC functions
- **Added**: Better error messages with debug information

### 3. **Improved Error Handling** ✅
- **RBAC Function**: Added detailed logging and error messages
- **Users API**: Added permission check logging
- **Session Debugging**: Enhanced session validation

## Debug Endpoints Available

### 1. **Basic API Test**
```
GET /api/debug/test
```
Tests basic API functionality (no auth required)

### 2. **User Session Test**
```
GET /api/debug/user-info
```
Shows current user session and database users

### 3. **Users API Test**
```
GET /api/debug/users-test
```
Tests users API with detailed debugging

### 4. **Session Authentication Test**
```
GET /api/debug/session-test
```
Tests session authentication specifically

## How to Debug

### Step 1: Check Basic API
Visit `http://localhost:3000/api/debug/test` in your browser
- Should return: `{"message":"API is working","timestamp":"...","url":"..."}`

### Step 2: Check User Session
Visit `http://localhost:3000/api/debug/user-info` in your browser
- Should show your current session and role
- Check if `userRole` is `MANAGER` or higher

### Step 3: Test Users API
Visit `http://localhost:3000/api/debug/users-test` in your browser
- Should show detailed debugging information
- Check console logs for permission details

### Step 4: Check Browser Console
Open browser developer tools and check:
1. **Console tab** for JavaScript errors
2. **Network tab** for failed API requests
3. **Application tab** for session storage

## Common Issues and Solutions

### Issue 1: No Session Found
**Symptoms**: `userRole: 'No role'` in debug endpoint
**Solution**: 
1. Go to `/auth/signin`
2. Login with `manager@example.com` / `manager123`
3. Try accessing users section again

### Issue 2: Wrong Role
**Symptoms**: `userRole: 'USER'` in debug endpoint
**Solution**: 
1. Run `npm run upgrade-user` to upgrade your role
2. Or login with `manager@example.com` / `manager123`

### Issue 3: Database Connection Issues
**Symptoms**: Database errors in console
**Solution**: 
1. Ensure Docker services are running: `docker-compose up -d supabase-db supabase-rest minio`
2. Check database connection: `npm run check-db`

### Issue 4: Session Not Persisting
**Symptoms**: Session works in debug but fails in users API
**Solution**: 
1. Check if `NEXTAUTH_SECRET` is set in environment
2. Clear browser cookies and try again
3. Check browser console for session errors

## Quick Fix Commands

```bash
# 1. Start database services
docker-compose up -d supabase-db supabase-rest minio

# 2. Check database and users
npm run check-db

# 3. Upgrade user role
npm run upgrade-user

# 4. Create manager user (alternative)
npm run create-manager

# 5. Start development server
npm run dev
```

## Debug Information to Check

### 1. **Session Information**
- Is session present?
- Does user have an ID?
- What is the user's role?

### 2. **Permission Check**
- Is the role check passing?
- Are the role priorities correct?
- Is the session being passed correctly?

### 3. **Database Connection**
- Is the database accessible?
- Are there users in the database?
- Are the user roles correct?

## Expected Debug Output

### Successful Session:
```json
{
  "success": true,
  "session": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "MANAGER"
    }
  },
  "userRole": "MANAGER",
  "dbUsers": [...]
}
```

### Failed Session:
```json
{
  "error": "No session found",
  "debug": {
    "hasAuthOptions": true,
    "requestUrl": "...",
    "headers": {...}
  }
}
```

## Next Steps
1. **Test the debug endpoints** to identify the specific issue
2. **Check the browser console** for any JavaScript errors
3. **Verify your login status** and role
4. **Check the server console** for detailed logging

The enhanced debugging should now provide clear information about what's causing the 403 error!
