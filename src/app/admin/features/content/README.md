# Content Feature

This feature contains all content management, knowledge base, attachments, change requests, and project management functionality.

## Structure

```
content/
├── components/
│   ├── KnowledgeBase.tsx        # Knowledge base management
│   ├── AttachmentManager.tsx   # File attachment management
│   ├── ChangeRequests.tsx      # Change request workflow
│   └── ProjectsManagement.tsx  # Project and ticket management
├── types.ts                     # Shared type definitions
├── utils.ts                     # Utility functions
├── index.ts                     # Public exports
└── README.md                    # This file
```

## Components

### KnowledgeBase
- Knowledge notebook management
- Document organization
- Search and filtering
- Tag management

### AttachmentManager
- File attachment management
- Upload and download
- File type filtering
- Attachment metadata
- Public/private access control

### ChangeRequests
- Change request workflow
- SQL change management
- Approval process
- Rollback support
- Request history

### ProjectsManagement
- Project and ticket management
- Kanban board view
- Spreadsheet view
- Gantt chart view
- Timesheet tracking
- Ticket attributes and labels

## Usage

```typescript
// Import components
import {
  KnowledgeBase,
  AttachmentManager,
  ChangeRequests,
  ProjectsManagement,
} from '@/app/admin/features/content'

// Import types
import { KnowledgeNotebook, Attachment, ChangeRequest, Ticket } from '@/app/admin/features/content'

// Import utilities
import { formatFileSize, filterNotebooksBySearch, getChangeRequestStatusColor } from '@/app/admin/features/content'
```

## Types

- `KnowledgeNotebook` - Knowledge base notebook
- `Attachment` - File attachment
- `ChangeRequest` - Change request configuration
- `Ticket` - Project ticket

## Utilities

- `formatFileSize(bytes)` - Format file size in human-readable format
- `filterNotebooksBySearch(notebooks, query)` - Filter notebooks by search query
- `sortNotebooksByName(notebooks, order)` - Sort notebooks by name
- `filterAttachmentsBySearch(attachments, query)` - Filter attachments by search query
- `filterAttachmentsByType(attachments, mimeType)` - Filter attachments by MIME type
- `isAttachmentPublic(attachment)` - Check if attachment is public
- `getChangeRequestStatusColor(status)` - Get change request status badge color
- `isChangeRequestPending(changeRequest)` - Check if change request is pending
- `filterChangeRequestsByStatus(changeRequests, status)` - Filter change requests by status
- `getTicketPriorityColor(priority)` - Get ticket priority badge color
- `filterTicketsByStatus(tickets, status)` - Filter tickets by status
- `filterTicketsByPriority(tickets, priority)` - Filter tickets by priority

## Migration Notes

This feature was migrated from `src/app/admin/components/` to demonstrate the new feature-based structure. All imports have been updated to use the new location.

