# Master Data Management (MDM) System - Complete Guide

## 🎯 **System Overview**

The Master Data Management (MDM) system is a comprehensive web application for event organizations to store and manage customer data, built with PostgreSQL and PostgREST as the primary backend. **Now featuring a flexible EAV (Entity-Attribute-Value) system for dynamic data modeling.**

## 📋 **Table of Contents**

1. [System Architecture](#system-architecture)
2. [EAV System Implementation](#eav-system-implementation)
3. [Attachment Infrastructure](#attachment-infrastructure)
4. [API Documentation](#api-documentation)
5. [Database Setup](#database-setup)
6. [Environment Configuration](#environment-configuration)
7. [Deployment Guide](#deployment-guide)
8. [User Management](#user-management)
9. [Workflows & Features](#workflows--features)
10. [Troubleshooting](#troubleshooting)

---

## 🏗️ **System Architecture**

### **Tech Stack**
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** PostgreSQL with PostgREST API
- **Authentication:** NextAuth.js with OAuth providers
- **Real-time:** Server-Sent Events for live updates
- **Storage:** MinIO (S3-compatible) for file management
- **Deployment:** Docker, Docker Compose
- **UI Components:** Radix UI, Lucide React Icons

### **Core Features**
- **EAV System:** Flexible Entity-Attribute-Value data modeling for dynamic schemas
- **Customer Management:** Complete CRUD operations for customer data
- **Assignment System:** Kanban-style task management with drag-and-drop
- **Dynamic Data Entry:** Manage any type of entity with configurable attributes
- **Import/Export:** Excel/CSV file processing with progress tracking
- **Settings:** Configurable system settings and user preferences

### **Advanced Features**
- **EAV Data Modeling:** Create any entity type with custom attributes dynamically
- **Real-time Updates:** Live data synchronization using Server-Sent Events
- **Role-based Access Control:** Granular permissions with database-level security
- **Audit Trail:** Complete activity logging and value history tracking
- **Search & Filtering:** Advanced search capabilities across all entity types
- **Responsive Design:** Mobile-first, modern UI with glass morphism
- **Dark/Light Theme:** Automatic theme switching
- **Thai Font Support:** Full Unicode and Thai language support
- **File Storage:** MinIO (S3-compatible) for file uploads

---

## 🔧 **EAV System Implementation**

### **Overview**
The EAV (Entity-Attribute-Value) system allows for flexible, dynamic data modeling without requiring schema changes.

### **Core Tables**
- **`entity_types`** - Defines different types of entities (e.g., Customer, Product, Order)
- **`eav_attributes`** - Defines attributes for each entity type
- **`eav_entities`** - Individual entity instances
- **`eav_values`** - Actual values for entity attributes
- **`attribute_groups`** - Groups related attributes together
- **`attribute_dependencies`** - Defines attribute dependencies
- **`attribute_inheritance`** - Handles entity type hierarchies
- **`eav_value_history`** - Audit trail for value changes

### **Data Types Supported**
- **Text:** TEXT, TEXTAREA, EMAIL, PHONE, URL
- **Numeric:** NUMBER, CURRENCY, PERCENTAGE
- **Date/Time:** DATE, DATETIME
- **Boolean:** BOOLEAN
- **Selection:** SELECT, MULTI_SELECT
- **Reference:** REFERENCE, REFERENCE_MULTI, USER, USER_MULTI
- **Other:** JSON, BLOB, FILE

### **API Endpoints**
- **Entity Types:** `/api/eav/entity-types/`
- **Attributes:** `/api/eav/attributes/`
- **Entities:** `/api/eav/entities/`
- **Values:** `/api/eav/entities/[id]/values/`

### **Frontend Components**
- **EavEntityManager:** Main EAV management component
- **Dynamic Form Generation:** Automatically generates forms based on entity type configuration
- **Value Management:** Type-specific input controls
- **Search and Filtering:** Across all entity types

---

## 📎 **Attachment Infrastructure**

### **Implementation Status: 100% COMPLETE**

The attachment infrastructure has been fully implemented with all components, APIs, database schemas, React components, and integration points.

### **Database Schema**
- **`space_attachment_storage`** - Storage provider configuration per space
- **`attachment_files`** - File metadata and relationships
- **Features:** RLS policies, indexes, triggers, foreign key constraints

### **API Endpoints**
- **Storage Config:** `/api/spaces/[id]/attachment-storage/`
- **Connection Test:** `/api/spaces/[id]/attachment-storage/test/`
- **File Upload:** `/api/attachments/upload/`
- **File Download:** `/api/attachments/[id]/download/`
- **File Delete:** `/api/attachments/[id]/`
- **File List:** `/api/attachments/`

### **Storage Providers**
- **MinIO** (S3-compatible)
- **AWS S3**
- **SFTP**
- **FTP**

### **React Components**
- **File Upload:** `src/components/ui/file-upload.tsx`
- **File List:** `src/components/ui/file-list.tsx`
- **Storage Config:** `src/components/ui/storage-config.tsx`
- **Attachment Field:** `src/components/ui/attachment-field.tsx`

---

## 📚 **API Documentation**

### **EAV APIs**
- [Entity Types API](./api/entity-types.md)
- [Attributes API](./api/attributes.md)
- [Entities API](./api/entities.md)
- [Values API](./api/values.md)

### **Core APIs**
- **Users:** `/api/users/`
- **Spaces:** `/api/spaces/`
- **Data Models:** `/api/data-models/`
- **Records:** `/api/records/`
- **Attachments:** `/api/attachments/`

---

## 🗄️ **Database Setup**

### **Prerequisites**
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose
- Git

### **Quick Start**
```bash
# Clone repository
git clone <repository-url>
cd mdm

# Install dependencies
npm install

# Setup environment
cp env.example .env.local
# Edit .env.local with your database credentials

# Start database
docker-compose up -d

# Run migrations
npm run db:migrate

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

### **Database Migrations**
- **EAV Schema:** `supabase/migrations/036_eav_best_practices_refactor.sql`
- **Data Migration:** `supabase/migrations/043_working_migration.sql`
- **Entity Types:** `supabase/migrations/045_add_missing_entity_types.sql`
- **Example Data:** `supabase/migrations/047_simple_eav_example_data.sql`

---

## ⚙️ **Environment Configuration**

### **Required Environment Variables**
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/customer_data_management"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Storage (MinIO)
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="attachments"

# AWS S3 (Alternative)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket"
```

---

## 🚀 **Deployment Guide**

### **Docker Deployment**
```bash
# Build and start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

### **Production Considerations**
- Use environment-specific configuration
- Set up proper SSL certificates
- Configure database backups
- Monitor system resources
- Set up log aggregation

---

## 👥 **User Management**

### **User Roles**
- **ADMIN:** Full system access
- **MANAGER:** Space and data management
- **USER:** Basic data access

### **Authentication**
- NextAuth.js with multiple providers
- Session management
- Role-based access control
- Password hashing with bcrypt

### **User Creation**
```bash
# Create admin user
npm run create-admin

# Create manager user
npm run create-manager
```

---

## 🔄 **Workflows & Features**

### **Assignment System**
- Kanban-style task management
- Drag-and-drop functionality
- Status tracking
- User assignments

### **Import/Export**
- Excel/CSV file processing
- Progress tracking
- Data validation
- Error handling

### **Real-time Features**
- Server-Sent Events
- Live data synchronization
- Real-time notifications
- Collaborative editing

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Database Connection**
```bash
# Check database status
docker-compose ps

# View database logs
docker-compose logs postgres

# Test connection
npm run test-db
```

#### **EAV System Issues**
```sql
-- Check entity types
SELECT * FROM entity_types;

-- Check attributes
SELECT * FROM eav_attributes;

-- Check entities
SELECT * FROM eav_entities;

-- Check values
SELECT * FROM eav_values;
```

#### **Attachment Issues**
```bash
# Check MinIO status
docker-compose logs minio

# Test storage connection
curl http://localhost:9000/minio/health/live
```

### **Debug Endpoints**
- `/api/debug/user-info` - Check user session
- `/api/debug/database` - Test database connection
- `/api/debug/storage` - Test storage connection

---

## 📞 **Support**

For questions or issues:
1. Check this documentation
2. Review the troubleshooting section
3. Check the example data and API endpoints
4. Contact the development team

---

**Last updated:** January 2024  
**Version:** 1.0  
**Status:** Production Ready ✅
