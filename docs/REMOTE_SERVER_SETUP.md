# Remote Server Setup Guide

## Database Connection
```
postgresql://postgres:postgres@10.0.10.57:5432/postgres
```

## Quick Setup

Run this command on the remote server (or a machine that can access the database):

```bash
npm run setup:remote
```

Or directly:
```bash
node scripts/setup-remote-server.js
```

## What the Script Does

The setup script runs these steps in order:

1. ✅ **Generate Prisma Client** - Generates Prisma client from schema
2. ✅ **Run Database Migrations** - Applies database schema migrations
3. ⏭️ **Seed Database** - Runs seed script (if exists)
4. ✅ **Create Admin User** - Creates admin user (admin@example.com / admin123)
5. ✅ **Create Comprehensive Data Models** - Creates customer, product, order, user, user_group, saved_query models
6. ✅ **Create Customer Data Model** - Creates customer data model with attributes

## Prerequisites

1. **Database Server Access**
   - Ensure PostgreSQL is running on `10.0.10.57:5432`
   - Database `postgres` must exist
   - User `postgres` must have create/alter permissions

2. **Environment Variables**
   - `.env.local` file must contain `DATABASE_URL`
   - Already configured: `postgresql://postgres:postgres@10.0.10.57:5432/postgres`

3. **Dependencies**
   ```bash
   npm install
   ```

## Manual Steps (if script fails)

If the automated script fails, you can run steps manually:

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Run migrations
npx prisma migrate deploy
# OR for development:
npx prisma migrate dev
# OR fallback:
npx prisma db push

# 3. Create admin user
npm run create-admin

# 4. Create comprehensive data models
node scripts/create-comprehensive-data-models.js

# 5. Create customer data model
node scripts/create-customer-data-model.js
```

## Troubleshooting

### Connection Timeout
If you get `ETIMEDOUT` or `Can't reach database server`:
- Verify PostgreSQL is running: `psql -h 10.0.10.57 -p 5432 -U postgres -d postgres`
- Check firewall rules allow TCP port 5432
- Verify PostgreSQL `listen_addresses` includes the server IP
- Check `pg_hba.conf` allows connections from your IP

### Migration Errors
- Ensure you have the latest code with all migrations
- Check database user has CREATE, ALTER, DROP permissions
- Review Prisma migration files in `prisma/migrations/`

### Script Errors
- Ensure all dependencies are installed: `npm install`
- Check Node.js version (requires Node 18+)
- Review script logs for specific error messages

## Verification

After setup, verify everything works:

```bash
# Test database connection
node scripts/check-db-and-create-user.js

# Check admin user exists
psql -h 10.0.10.57 -p 5432 -U postgres -d postgres -c "SELECT email, role FROM users WHERE role = 'ADMIN';"

# Check data models exist
psql -h 10.0.10.57 -p 5432 -U postgres -d postgres -c "SELECT name, display_name FROM data_models;"
```

## Admin Credentials

After successful setup:
- **Email:** admin@example.com
- **Password:** admin123
- **Role:** ADMIN

⚠️ **Important:** Change the admin password after first login!

