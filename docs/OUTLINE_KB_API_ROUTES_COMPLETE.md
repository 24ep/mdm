# Outline Knowledge Base API Routes - Complete

## ✅ API Routes Created

### Collections API
- **GET** `/api/knowledge/collections` - List collections with pagination, search, filtering
- **POST** `/api/knowledge/collections` - Create new collection
- **GET** `/api/knowledge/collections/[id]` - Get collection details with members
- **PUT** `/api/knowledge/collections/[id]` - Update collection
- **DELETE** `/api/knowledge/collections/[id]` - Delete collection (soft delete)

### Documents API
- **GET** `/api/knowledge/documents` - List documents with pagination, search, filtering
- **POST** `/api/knowledge/documents` - Create new document
- **GET** `/api/knowledge/documents/[id]` - Get document details with children
- **PUT** `/api/knowledge/documents/[id]` - Update document (auto-creates version)
- **DELETE** `/api/knowledge/documents/[id]` - Delete document (soft delete)

### Comments API
- **GET** `/api/knowledge/documents/[id]/comments` - Get threaded comments
- **POST** `/api/knowledge/documents/[id]/comments` - Create comment (sends notifications for replies)

### Search API
- **GET** `/api/knowledge/search` - Full-text search with PostgreSQL tsvector

## 🔐 Security Features

All routes include:
- ✅ Authentication check (NextAuth session)
- ✅ Rate limiting
- ✅ Permission checking (collection members, creators)
- ✅ Audit logging
- ✅ Space-aware filtering

## 📋 Permission Model

### Collection Access
- **Creator**: Full access (admin)
- **Admin Member**: Full access
- **Editor Member**: Read/Write access
- **Viewer Member**: Read-only access
- **Public Collections**: Read access for all authenticated users

### Document Access
- Inherits from collection permissions
- Public documents accessible to all if `isPublic = true`
- Private documents require collection membership

## 🔍 Search Features

- Full-text search using PostgreSQL `tsvector` and `tsquery`
- Ranks results by relevance
- Filters by accessible collections
- Supports space and collection scoping
- Returns snippets with highlights

## 📝 Version History

- Automatic version creation on document update
- Versions stored in `knowledge_document_versions` table
- Includes title, content, contentHtml, and creator

## 🔔 Notifications

- Comment replies trigger notifications
- Uses existing `NotificationService`
- Mentions will trigger notifications (to be implemented)

## 🎯 Next Steps

1. Create UI components for collections and documents
2. Implement real-time collaboration (presence)
3. Add share/permissions UI
4. Integrate with Vault for document encryption
5. Add mentions parsing and notifications

