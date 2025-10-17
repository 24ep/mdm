# Customer Data Management - Deployment Guide

This guide covers deployment options for the Customer Data Management system using Supabase as the primary backend.

## 🚀 **Quick Start (Recommended)**

### **Production Deployment with Supabase**

1. **Set up Supabase Project:**
   ```bash
   # Create a new Supabase project at https://supabase.com
   # Note down your project URL and anon key
   ```

2. **Configure Environment Variables:**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Deploy with Docker:**
   ```bash
   docker-compose up -d
   ```

### **Local Development with One Docker Compose (App + Supabase)**

Run the whole stack with one command:

1. **Configure Environment Variables:**
   ```bash
   cp env.example .env.local
   # Ensure NEXT_PUBLIC_SUPABASE_URL is http://localhost:54321
   # and set ANON/SERVICE keys (placeholders provided)
   ```

2. **Start All Services:**
   ```bash
   docker-compose up -d --build
   ```

3. **Access Local Tools:**
   - App: http://localhost:3000
   - Supabase Gateway: http://localhost:54321
   - Supabase Studio: http://localhost:54323

4. **Seed Data (optional):**
   ```bash
   npm run db:seed
   ```

## 📋 **Prerequisites**

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Supabase account (for production)
- Supabase CLI (for local development)

## 🔧 **Environment Configuration**

### **Required Environment Variables:**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# For local development with Supabase CLI:
# NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
# NEXT_PUBLIC_SUPABASE_ANON_KEY="your-local-anon-key"
# SUPABASE_SERVICE_ROLE_KEY="your-local-service-role-key"

# Application Settings
NEXT_PUBLIC_APP_NAME="Customer Data Management"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_PUBLIC_PRIMARY_COLOR="#1e40af"
NEXT_PUBLIC_SECONDARY_COLOR="#64748b"
```

## 🐳 **Docker Deployment**

### **Production Deployment:**

```bash
# 1. Clone the repository
git clone <repository-url>
cd customer-data-management

# 2. Configure environment variables
cp env.example .env.local
# Edit .env.local with your production values

# 3. Deploy with Docker Compose
docker-compose up -d

# 4. Check logs
docker-compose logs -f app
```

## 🗄️ **Database Setup**

### **With Supabase (Production):**

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down the project URL and API keys

2. **Run Database Migrations:**
   ```bash
   # Apply the initial schema
   supabase db push
   ```

3. **Seed Initial Data:**
   ```bash
   npm run db:seed
   ```

### **With Local Supabase (Docker Compose):**

1. **Start Local Stack:**
   ```bash
   docker-compose up -d --build
   ```

2. **Access Supabase Studio:**
   - Open http://localhost:54323
   - Use anon/service keys from `.env.local`

3. **Run Migrations:**
   - Apply SQL in `supabase/migrations/001_initial_schema.sql` via Studio SQL editor, or
   - Use your preferred migration tool to execute the SQL

4. **Seed Data:**
   ```bash
   npm run db:seed
   ```

## 🔐 **Authentication Setup**

### **Supabase Auth Configuration:**

1. **Enable Authentication Providers:**
   - Go to your Supabase project dashboard
   - Navigate to Authentication > Providers
   - Enable Email, Google, and Azure AD providers

2. **Configure OAuth Providers:**
   - **Google:** Add your Google OAuth credentials
   - **Azure AD:** Add your Azure AD application credentials

3. **Set Redirect URLs:**
   - Add your domain to allowed redirect URLs
   - For local development: `http://localhost:3000`

## 📁 **File Storage**

The application uses Supabase Storage for file uploads:

1. **Enable Storage:**
   - Go to Storage in your Supabase dashboard
   - Create a new bucket called `uploads`

2. **Configure Storage Policies:**
   ```sql
   -- Allow authenticated users to upload files
   CREATE POLICY "Users can upload files" ON storage.objects
   FOR INSERT WITH CHECK (auth.role() = 'authenticated');

   -- Allow users to view their own files
   CREATE POLICY "Users can view files" ON storage.objects
   FOR SELECT USING (auth.role() = 'authenticated');
   ```

## 🔄 **Real-time Features**

The application uses Supabase Realtime for real-time updates:

1. **Realtime Subscriptions:** Customer changes, assignments, activities
2. **Connection Management:** Automatic reconnection on disconnect
3. **SSE Endpoint:** `/api/sse` for Server-Sent Events

## 📊 **Monitoring and Logs**

### **Application Logs:**
```bash
# View application logs
docker-compose logs -f app

# View all services
docker-compose logs -f
```

### **Database Logs:**
- **Supabase:** Available in the Supabase dashboard
- **Local:** `supabase logs`

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Database Connection Issues:**
   ```bash
   # Check if Supabase is running locally
   supabase status
   
   # Check database logs
   supabase logs
   ```

2. **Authentication Issues:**
   - Verify environment variables are set correctly
   - Check Supabase Auth configuration
   - Ensure redirect URLs are configured

3. **File Upload Issues:**
   - Verify Supabase Storage is enabled
   - Check storage policies
   - Ensure bucket exists

4. **Real-time Issues:**
   - Check Supabase Realtime is enabled
   - Verify WebSocket connections
   - Check browser console for errors

### **Health Checks:**

```bash
# Check application health
curl http://localhost:3000/api/health

# Check Supabase health
curl http://localhost:54321/health
```

## 🔄 **Updates and Maintenance**

### **Updating the Application:**

```bash
# 1. Pull latest changes
git pull origin main

# 2. Rebuild and restart
docker-compose down
docker-compose up -d --build

# 3. Run any new migrations
supabase db push
```

### **Backup and Recovery:**

1. **Database Backups:**
   - Supabase automatically handles backups
   - For local development, use `supabase db dump`

2. **File Backups:**
   - Supabase Storage provides redundancy
   - For local development, backup the `uploads` directory

## 📈 **Scaling Considerations**

### **Production Scaling:**

1. **Database:**
   - Use Supabase Pro plan for better performance
   - Consider read replicas for heavy read workloads

2. **Application:**
   - Use multiple Docker containers behind a load balancer
   - Consider using Docker Swarm or Kubernetes

3. **Storage:**
   - Supabase Storage scales automatically
   - Consider CDN for static assets

## 🔒 **Security Best Practices**

1. **Environment Variables:**
   - Never commit `.env.local` to version control
   - Use strong, unique secrets
   - Rotate secrets regularly

2. **Database Security:**
   - Use Row Level Security (RLS) policies
   - Regularly audit database access
   - Enable database backups

3. **Application Security:**
   - Keep dependencies updated
   - Use HTTPS in production
   - Implement rate limiting

4. **Authentication:**
   - Use strong password policies
   - Enable MFA where possible
   - Regularly audit user access

## 📞 **Support**

For issues and questions:

1. **Check the logs** for error messages
2. **Review this documentation** for common solutions
3. **Check Supabase documentation** for database-related issues
4. **Create an issue** in the project repository

---

**Happy Deploying! 🚀**