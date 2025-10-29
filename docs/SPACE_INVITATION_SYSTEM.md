# Space Member Invitation System

This document describes the new space member invitation system that allows users to invite both existing and new users to spaces via email.

## Features

### 1. Smart User Search & Invitation
- **Free text input** with real-time autocomplete
- **Dropdown suggestions** showing existing users as you type
- **Email validation** for new user invitations
- **Role selection** (Member, Admin, Owner)

### 2. Email Invitations
- **SMTP integration** for sending invitation emails
- **Beautiful HTML email templates** with invitation links
- **Token-based security** with 7-day expiration
- **Automatic account creation** for new users

### 3. Invitation Management
- **Database tracking** of all invitations
- **Status monitoring** (pending, accepted, expired)
- **Bulk invitation support**
- **Resend capability**

## Components

### UserInviteInput Component
Located at `src/components/ui/user-invite-input.tsx`

**Features:**
- Real-time user search with debouncing
- Visual indicators for selected users vs new emails
- Loading states and error handling
- Keyboard navigation support

**Usage:**
```tsx
<UserInviteInput
  spaceId={spaceId}
  onInvite={handleInviteUser}
  disabled={!canManageMembers}
/>
```

### API Endpoints

#### 1. User Search
`GET /api/users/search?q={query}&spaceId={spaceId}`

Returns matching users not already in the space.

#### 2. Send Invitation
`POST /api/spaces/{spaceId}/invite`

**Body:**
```json
{
  "email": "user@example.com",
  "role": "member"
}
```

#### 3. Invitation Details
`GET /api/invitations/{token}`

Returns invitation details for the acceptance page.

#### 4. Accept Invitation
`POST /api/invitations/{token}/accept`

Accepts the invitation and adds user to space.

## Database Schema

### space_invitations Table
```sql
CREATE TABLE space_invitations (
  id SERIAL PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES spaces(id),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  token VARCHAR(255) NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES users(id),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Configuration

### Environment Variables
Add these to your `.env` file:

```env
# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="your-email@gmail.com"
```

### Gmail Setup
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in `SMTP_PASSWORD`

## User Flow

### For Existing Users
1. Admin types user name/email in invitation input
2. System shows matching users in dropdown
3. Admin selects user and role
4. User is immediately added to space
5. User receives notification (if configured)

### For New Users
1. Admin types email address
2. System detects it's a new email
3. Admin selects role and sends invitation
4. System sends email with invitation link
5. New user clicks link and creates account
6. User is automatically added to space

## Email Template

The invitation email includes:
- Space name and inviter information
- Clear call-to-action button
- Expiration date
- Fallback text link
- Professional styling

## Security Features

- **Token-based invitations** with secure random generation
- **7-day expiration** for all invitations
- **Email verification** required for new accounts
- **Role-based permissions** for sending invitations
- **Rate limiting** (can be added)

## Installation

1. Run the database migration:
```bash
# The migration is already included in postgrest/migrations/
# It will be applied automatically when you start the system
```

2. Install dependencies:
```bash
npm install nodemailer @types/nodemailer
```

3. Configure SMTP settings in your environment

4. The system is ready to use!

## Troubleshooting

### Common Issues

1. **SMTP Connection Failed**
   - Check SMTP credentials
   - Verify Gmail App Password
   - Check firewall settings

2. **Invitation Not Received**
   - Check spam folder
   - Verify email address
   - Check SMTP logs

3. **Token Expired**
   - Invitations expire after 7 days
   - Send a new invitation

4. **User Already Exists**
   - System will add existing users directly
   - No email will be sent

## Future Enhancements

- [ ] Bulk invitation via CSV upload
- [ ] Custom email templates per space
- [ ] Invitation analytics and tracking
- [ ] Integration with external user directories
- [ ] Mobile-optimized invitation pages
- [ ] Multi-language support
