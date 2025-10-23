# Master Data Management (MDM) System

A comprehensive web application for event organizations to store and manage customer data, built with PostgreSQL and PostgREST as the primary backend. **Now featuring a flexible EAV (Entity-Attribute-Value) system for dynamic data modeling.**

## 🚀 **Tech Stack**

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** PostgreSQL with PostgREST API
- **Authentication:** NextAuth.js with OAuth providers
- **Real-time:** Server-Sent Events for live updates
- **Storage:** MinIO (S3-compatible) for file management
- **Deployment:** Docker, Docker Compose
- **UI Components:** Radix UI, Lucide React Icons

## ✨ **Features**

### **Core Functionality**
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

## 🏗️ **Architecture**

### **EAV System Architecture**
- **Entity Types:** Define different types of entities (Customer, Product, Order, etc.)
- **Attributes:** Define fields and properties for each entity type
- **Entities:** Individual instances of entity types
- **Values:** Actual data stored for entity attributes
- **Dynamic Schema:** No hardcoded tables - everything is configurable
- **Type Safety:** Strong typing with enum-based data types
- **Audit Trail:** Complete value history tracking

### **Frontend Architecture**
- **Pages:** Dashboard, Customer Management, Assignments, Data Entry, Settings, EAV Management
- **Components:** Reusable UI components with Radix UI, EAV-specific components
- **Layout:** Responsive sidebar navigation with header
- **State Management:** React hooks and PostgREST client
- **Styling:** Tailwind CSS with custom design system

### **Backend Architecture**
- **Database:** PostgreSQL with EAV schema and direct connection
- **Authentication:** NextAuth.js with multiple OAuth providers
- **Real-time:** Server-Sent Events for live updates
- **Storage:** MinIO (S3-compatible) for file management
- **API:** PostgREST for database operations and Next.js API routes
- **EAV API:** Dedicated endpoints for entity types, attributes, entities, and values

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+
- Docker and Docker Compose

### **Installation**

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd customer-data-management
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development stack:**
   ```bash
   # Start PostgreSQL, PostgREST, and MinIO with Docker Compose
   docker-compose up -d
   ```

5. **Set up the database:**
   ```bash
   # Apply database schema
   npm run db:push
   
   # Seed initial data
   npm run db:seed
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

7. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🐳 **Docker Deployment**

### **Production Deployment**
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app
```

## 📁 **Project Structure**

```
customer-data-management/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard page
│   │   ├── customers/         # Customer management
│   │   ├── assignments/       # Assignment kanban
│   │   ├── data/              # Data entry pages
│   │   ├── settings/          # Settings page
│   │   └── import-export/     # Import/Export page
│   ├── components/            # Reusable components
│   │   ├── ui/               # Base UI components
│   │   └── layout/           # Layout components
│   ├── lib/                  # Utility libraries
│   │   └── database.js       # Database connection utilities
│   └── types/                # TypeScript type definitions
├── prisma/                   # Database schema and migrations
│   └── schema.prisma         # Prisma schema definition
├── docs/                     # Documentation
├── docker-compose.yml        # Production Docker setup
└── Dockerfile               # Application container
```

## 🔧 **Configuration**

### **Environment Variables**
See `env.example` for all required environment variables:

- **Supabase:** Project URL, API keys, and service role key
- **Application:** App-specific settings and configuration

### **Database Schema**
The application uses a comprehensive Supabase database schema with:
- **Users & Authentication:** Supabase Auth integration
- **Customer Data:** Complete customer information
- **Assignment System:** Task and workflow management
- **Data Models:** Flexible data structure system
- **Audit Trail:** Activity logging and tracking
- **Row Level Security:** Database-level access control

## 📊 **API Documentation**

### **Core Endpoints**
- `GET/POST /api/customers` - Customer management
- `GET/POST /api/assignments` - Assignment operations
- `GET/POST /api/companies` - Company data
- `GET/POST /api/import-export/import` - File import
- `GET/POST /api/import-export/export` - Data export
- `GET /api/sse` - Real-time updates via Server-Sent Events

### **Authentication**
- NextAuth.js handles all authentication
- OAuth providers: Google, Azure AD, Email
- Automatic session management

## 🎨 **Design System**

### **Color Palette**
- **Primary:** Blue (#1e40af)
- **Secondary:** Slate (#64748b)
- **Success:** Green (#059669)
- **Warning:** Amber (#d97706)
- **Error:** Red (#dc2626)

### **Typography**
- **Font Family:** Inter (Latin), Noto Sans Thai (Thai)
- **Font Weights:** 400, 500, 600, 700
- **Responsive:** Mobile-first approach

### **Components**
- **Glass Morphism:** Modern, translucent design elements
- **Rounded Corners:** Consistent border radius
- **Shadows:** Subtle depth and elevation
- **Animations:** Smooth transitions and micro-interactions

## 🔒 **Security**

### **Authentication & Authorization**
- **Supabase Auth:** Secure authentication with multiple providers
- **Row Level Security:** Database-level access control
- **Session Management:** Automatic token handling
- **OAuth Integration:** Google, Azure AD support

### **Data Protection**
- **Row Level Security:** Database-level access control
- **Input Validation:** Comprehensive data validation
- **SQL Injection Prevention:** Supabase client protection
- **XSS Protection:** Content Security Policy

## 📈 **Performance**

### **Optimization Strategies**
- **Server-side Rendering:** Next.js SSR for better SEO
- **Image Optimization:** Next.js Image component
- **Code Splitting:** Automatic bundle optimization
- **Database Caching:** Query result caching
- **Database Indexing:** Optimized query performance

### **Real-time Features**
- **Server-Sent Events:** Live data synchronization
- **Connection Management:** Automatic reconnection
- **Event Streaming:** Real-time updates for data changes

## 🧪 **Testing**

### **Test Coverage**
- **Unit Tests:** Component and utility testing
- **Integration Tests:** API endpoint testing
- **E2E Tests:** Full user journey testing
- **Performance Tests:** Load and stress testing

### **Test Commands**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📚 **Documentation**

- **[Complete System Guide](docs/COMPLETE_SYSTEM_GUIDE.md)** - Comprehensive system overview and setup
- **[API Documentation](docs/api/)** - Complete API reference for EAV system
- **[Database Setup Guide](docs/DATABASE_SETUP_GUIDE.md)** - Database configuration and migration
- **[Environment Setup](docs/ENVIRONMENT_SETUP.md)** - Environment variables and configuration
- **[Documentation Index](docs/README.md)** - All available documentation
- **[Software Requirements Specification (SRS)](docs/SRS.md)**
- **[Business Requirements Document (BRD)](docs/BRD.md)**
- **[Test Cases](docs/TEST_CASES.md)**

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

For support and questions:
- **Documentation:** Check the docs folder
- **Issues:** Create a GitHub issue
- **Email:** Contact the development team

---

**Built with ❤️ for event organizations worldwide**