# Fix Database Connection Issues

## 🚨 **PROBLEM IDENTIFIED**

The 500 Internal Server Errors are caused by database connection issues. The application is trying to connect to a Supabase database (`localhost:54322`) but you're using a regular PostgreSQL database.

## 🔧 **SOLUTION STEPS**

### **Step 1: Create Environment Configuration**

Create a `.env.local` file in your project root with the following content:

```env
# Database Configuration
DATABASE_URL=postgres://postgres:postgres@localhost:5432/customer_data_management

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Attachment Storage Configuration
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=attachments
MINIO_REGION=us-east-1
```

### **Step 2: Update Database Configuration**

The current database configuration in `src/lib/db.ts` is set to connect to Supabase port 54322. You need to either:

**Option A: Update the DATABASE_URL in .env.local**
```env
DATABASE_URL=postgres://your_user:your_password@localhost:5432/your_database_name
```

**Option B: Update the default connection in src/lib/db.ts**
```typescript
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/customer_data_management'
```

### **Step 3: Verify Database Connection**

Make sure your PostgreSQL database is running and accessible:

```bash
# Test connection
psql -h localhost -p 5432 -U postgres -d customer_data_management -c "SELECT version();"
```

### **Step 4: Apply Database Migrations**

Run the database migrations to create the required tables:

```bash
# Basic attachment tables
psql -h localhost -p 5432 -U postgres -d customer_data_management -f sql/attachment_storage_setup.sql

# Advanced file features
psql -h localhost -p 5432 -U postgres -d customer_data_management -f sql/advanced_file_features.sql
```

### **Step 5: Start the Application**

```bash
npm run dev
```

## 🔍 **TROUBLESHOOTING**

### **If you still get 500 errors:**

1. **Check database connection:**
   ```bash
   psql -h localhost -p 5432 -U postgres -d customer_data_management
   ```

2. **Check if tables exist:**
   ```sql
   \dt
   ```

3. **Check application logs:**
   Look at the terminal output for specific error messages

4. **Verify environment variables:**
   Make sure `.env.local` is in the project root and contains the correct DATABASE_URL

### **Common Issues:**

- **Port mismatch**: Make sure you're using port 5432 (PostgreSQL) not 54322 (Supabase)
- **Database doesn't exist**: Create the database first
- **User permissions**: Make sure the database user has proper permissions
- **Missing tables**: Run the SQL migrations

## 📋 **QUICK FIX CHECKLIST**

- [ ] Create `.env.local` with correct DATABASE_URL
- [ ] Verify PostgreSQL is running on port 5432
- [ ] Test database connection manually
- [ ] Run database migrations
- [ ] Restart the application
- [ ] Check for any remaining errors

## 🎯 **EXPECTED RESULT**

After fixing the database connection, you should see:
- ✅ No more 500 errors in the console
- ✅ API endpoints responding correctly
- ✅ Application loading without errors
- ✅ All file management features working

## 🚀 **NEXT STEPS**

Once the database connection is fixed:
1. Test the basic functionality
2. Set up the attachment storage (MinIO)
3. Test the advanced file management features
4. Configure your preferred storage provider
