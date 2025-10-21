# Enhanced User Management Feature

## Overview

The Enhanced User Management feature provides comprehensive user administration capabilities across all spaces in the system. It allows administrators to view, manage, and configure user accounts and their space associations from a centralized interface.

## Features

### 🔍 **Comprehensive User View**
- View all users from all spaces in a single interface
- See user details including name, email, role, and status
- Display space associations for each user
- Show default space assignments

### 🏢 **Space Association Management**
- View which spaces each user belongs to
- See user roles within each space (owner, admin, member)
- Manage space memberships directly from user profiles
- Add/remove users from spaces
- Change user roles within spaces

### 🔍 **Advanced Filtering & Search**
- Search users by name or email
- Filter by user role (SUPER_ADMIN, ADMIN, MANAGER, USER)
- Filter by active/inactive status
- Filter by specific space membership
- Pagination for large user lists

### ⚙️ **User Management Actions**
- Edit user information (name, email, role)
- Activate/deactivate user accounts
- Set default spaces for users
- Manage space associations
- View detailed user profiles

## API Endpoints

### GET `/api/users/all-with-spaces`
Fetches all users with their space associations.

**Query Parameters:**
- `page` (number): Page number for pagination
- `limit` (number): Number of users per page
- `search` (string): Search by name or email
- `role` (string): Filter by user role
- `is_active` (boolean): Filter by active status
- `space_id` (string): Filter by space membership

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "USER",
      "is_active": true,
      "avatar": "avatar-url",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "default_space_id": "space-id",
      "default_space_name": "Default Space",
      "spaces": [
        {
          "id": "membership-id",
          "space_id": "space-id",
          "role": "member",
          "created_at": "2024-01-01T00:00:00Z",
          "space_name": "Space Name",
          "space_description": "Space Description",
          "space_is_default": false,
          "space_is_active": true
        }
      ]
    }
  ],
  "spaces": [
    {
      "id": "space-id",
      "name": "Space Name",
      "description": "Space Description",
      "is_default": false,
      "is_active": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### GET `/api/users/[id]/space-associations`
Fetches space associations for a specific user.

**Response:**
```json
{
  "spaces": [
    {
      "id": "membership-id",
      "space_id": "space-id",
      "role": "member",
      "created_at": "2024-01-01T00:00:00Z",
      "space_name": "Space Name",
      "space_description": "Space Description",
      "space_is_default": false,
      "space_is_active": true
    }
  ]
}
```

### PUT `/api/users/[id]/space-associations`
Updates space associations for a specific user.

**Request Body:**
```json
{
  "spaces": [
    {
      "space_id": "space-id",
      "role": "member"
    }
  ]
}
```

**Response:**
```json
{
  "spaces": [
    {
      "id": "membership-id",
      "space_id": "space-id",
      "role": "member",
      "created_at": "2024-01-01T00:00:00Z",
      "space_name": "Space Name",
      "space_description": "Space Description",
      "space_is_default": false,
      "space_is_active": true
    }
  ]
}
```

## User Interface Components

### EnhancedUserManagement Component
Located at `src/app/settings/components/EnhancedUserManagement.tsx`

**Features:**
- User list with space associations
- Advanced filtering and search
- User detail dialogs
- Edit user functionality
- Space association management

**Key Props:**
- None (self-contained component)

**Key State:**
- `users`: Array of user objects with space associations
- `spaces`: Array of available spaces
- `loading`: Loading state for API calls
- `error`: Error state for failed operations
- `search`: Search query string
- `roleFilter`: Role filter value
- `activeFilter`: Active status filter
- `spaceFilter`: Space membership filter

## Database Schema

### Users Table
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  role user_role DEFAULT 'USER',
  is_active BOOLEAN DEFAULT true,
  avatar TEXT,
  default_space_id UUID REFERENCES spaces(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

### Space Members Table
```sql
CREATE TABLE public.space_members (
  id UUID PRIMARY KEY,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(space_id, user_id)
);
```

### Spaces Table
```sql
CREATE TABLE public.spaces (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

## Usage

### Accessing User Management
1. Navigate to System Settings
2. Click on the "Users" tab
3. View the enhanced user management interface

### Managing Users
1. **View Users**: See all users with their space associations
2. **Search Users**: Use the search bar to find specific users
3. **Filter Users**: Use filters to narrow down the user list
4. **Edit Users**: Click the edit button to modify user information
5. **Manage Space Associations**: Add/remove users from spaces and change roles

### Space Association Management
1. **View Associations**: See which spaces each user belongs to
2. **Add Associations**: Add users to new spaces with specific roles
3. **Remove Associations**: Remove users from spaces
4. **Change Roles**: Update user roles within spaces

## Security

### Role-Based Access Control
- Only users with MANAGER+ roles can access user management
- Role hierarchy: SUPER_ADMIN > ADMIN > MANAGER > USER
- Space-specific permissions are respected

### Data Protection
- User passwords are not exposed in the interface
- Sensitive information is properly filtered
- Audit logging for user management actions

## Testing

### Manual Testing
1. Access the user management interface
2. Test search and filtering functionality
3. Edit user information and space associations
4. Verify changes are saved correctly

### Automated Testing
Run the test script:
```bash
node scripts/test-user-management.js
```

## Future Enhancements

### Planned Features
- Bulk user operations (activate/deactivate multiple users)
- User import/export functionality
- Advanced user analytics and reporting
- User activity tracking
- Custom user fields and attributes
- User group management
- Advanced permission management

### Integration Opportunities
- Single Sign-On (SSO) integration
- LDAP/Active Directory synchronization
- User provisioning workflows
- Advanced audit logging
- User onboarding automation

## Troubleshooting

### Common Issues

**Users not loading:**
- Check database connection
- Verify user permissions
- Check API endpoint availability

**Space associations not updating:**
- Verify space exists and is active
- Check user permissions for space management
- Ensure proper role values (owner, admin, member)

**Search not working:**
- Check search query format
- Verify database indexes
- Test API endpoint directly

### Debug Steps
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Test database queries directly
4. Check user permissions and roles
5. Verify space and user data integrity

## Support

For issues or questions regarding the Enhanced User Management feature:
1. Check the troubleshooting section above
2. Review API endpoint documentation
3. Test with the provided test script
4. Contact the development team for advanced issues
