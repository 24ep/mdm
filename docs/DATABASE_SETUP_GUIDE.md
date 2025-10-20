# 🚨 **DATABASE SETUP GUIDE - FIX 500 ERRORS**

## **PROBLEM IDENTIFIED** ❌

The 500 Internal Server Errors are caused by:
1. **PostgreSQL is not running** on port 5432
2. **Database connection is failing** (ECONNREFUSED)
3. **Required database tables don't exist**

## **SOLUTION STEPS** 🔧

### **Step 1: Install and Start PostgreSQL**

#### **Option A: Using Docker (Recommended)**
```bash
# Start PostgreSQL with Docker
docker run --name postgres-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=customer_data_management -p 5432:5432 -d postgres:15

# Check if it's running
docker ps
```

#### **Option B: Install PostgreSQL Locally**
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Set password to `postgres` (or update .env.local)
4. Make sure it's running on port 5432

### **Step 2: Create Database**
```sql
-- Connect to PostgreSQL
psql -U postgres -h localhost -p 5432

-- Create database
CREATE DATABASE customer_data_management;

-- Exit
\q
```

### **Step 3: Apply Database Migrations**
```bash
# Apply basic schema
psql -h localhost -p 5432 -U postgres -d customer_data_management -f sql/attachment_storage_setup.sql

# Apply advanced features
psql -h localhost -p 5432 -U postgres -d customer_data_management -f sql/advanced_file_features.sql
```

### **Step 4: Test Database Connection**
```bash
# Test connection
node scripts/test-database-connection.js
```

### **Step 5: Restart Application**
```bash
# Stop current processes
taskkill /f /im node.exe

# Start fresh
npm run dev
```

## **QUICK FIX WITH DOCKER** 🐳

If you have Docker installed, run this command:

```bash
docker run --name postgres-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=customer_data_management -p 5432:5432 -d postgres:15
```

Then test the connection:
```bash
node scripts/test-database-connection.js
```

## **ALTERNATIVE: USE EXISTING DATABASE** 🔄

If you already have PostgreSQL running on a different port or with different credentials, update your `.env.local`:

```env
DATABASE_URL=postgres://your_user:your_password@localhost:your_port/your_database
```

## **TROUBLESHOOTING** 🔍

### **If Docker command fails:**
- Make sure Docker is installed and running
- Check if port 5432 is already in use
- Try a different port: `-p 5433:5432`

### **If psql command not found:**
- Install PostgreSQL client tools
- Or use Docker: `docker exec -it postgres-db psql -U postgres`

### **If database connection still fails:**
1. Check if PostgreSQL is running: `docker ps` or `netstat -an | findstr 5432`
2. Verify credentials in `.env.local`
3. Check firewall settings
4. Try connecting with a database client (pgAdmin, DBeaver, etc.)

## **EXPECTED RESULT** ✅

After completing these steps:
- ✅ Database connection successful
- ✅ No more 500 errors
- ✅ Application loads without errors
- ✅ All API endpoints working

## **NEXT STEPS** 🚀

Once the database is running:
1. Test the application at http://localhost:3001
2. Check that all API endpoints respond correctly
3. Set up the attachment storage (MinIO) if needed
4. Test the advanced file management features

---

**🎯 QUICK START:**
1. Run: `docker run --name postgres-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=customer_data_management -p 5432:5432 -d postgres:15`
2. Test: `node scripts/test-database-connection.js`
3. Start: `npm run dev`
