# Debugging 403 Forbidden Error

## Current Status
The 403 Forbidden error persists even after implementing the fixes. Let's systematically debug this issue.

## Debugging Steps

### 1. Check Database and Users
```bash
npm run check-db
```
This will:
- Test database connection
- Check if users table exists
- List current users in database
- Create a test user if none exist

### 2. Test API Endpoints
Visit these URLs in your browser:
- `http://localhost:3000/api/debug/test` - Basic API test (no auth required)
- `http://localhost:3000/api/debug/user-info` - User session info (no auth required)
- `http://localhost:3000/api/debug/session-test` - Session authentication test

### 3. Check Authentication Flow
1. **Are you logged in?** Visit the debug endpoints to see session info
2. **What's your role?** Check the user-info endpoint for your current role
3. **Are there users in the database?** The check-db script will show this

### 4. Potential Issues and Solutions

#### Issue 1: No Users in Database
**Solution**: Run `npm run check-db` to create a test user
- Email: test@example.com
- Password: test123
- Role: MANAGER

#### Issue 2: Not Logged In
**Solution**: 
1. Go to `/auth/signin`
2. Login with test@example.com / test123
3. Try accessing users section again

#### Issue 3: Wrong Role
**Solution**: 
- Current user needs MANAGER role or higher
- Check your role in the debug endpoint
- If you have USER role, you'll get 403

#### Issue 4: Session Not Persisting
**Solution**: 
- Check if NEXTAUTH_SECRET is set in environment
- Clear browser cookies and try again
- Check browser console for errors

### 5. Environment Variables
Make sure these are set:
```env
NEXTAUTH_SECRET=your-secret-here
DATABASE_URL=your-database-url
```

### 6. Quick Fix Commands
```bash
# Check database and create user
npm run check-db

# Create admin user
npm run create-admin

# Start development server
npm run dev
```

## Debug Endpoints Created
- `/api/debug/test` - Basic API functionality
- `/api/debug/user-info` - Current user session and database users
- `/api/debug/session-test` - Session authentication test

## Next Steps
1. Run `npm run check-db` to ensure database has users
2. Check debug endpoints to see current session status
3. Login with appropriate credentials
4. Test the users section again

## Files Modified
- `src/middleware.ts` - Excluded debug routes from auth middleware
- `src/app/api/debug/user-info/route.ts` - Enhanced debug endpoint
- `src/app/api/debug/session-test/route.ts` - Session test endpoint
- `src/app/api/debug/test/route.ts` - Basic API test
- `scripts/check-db-and-create-user.js` - Database check script
