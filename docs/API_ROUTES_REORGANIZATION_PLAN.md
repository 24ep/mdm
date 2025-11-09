# API Routes Reorganization Plan

## Current State
- **Total Routes:** 270+ files
- **Structure:** Flat organization in `src/app/api/`
- **Issues:** Hard to navigate, no clear grouping, mixed patterns

## Target Structure

```
src/app/api/
├── v1/                          # Versioned API (current stable)
│   ├── data-models/            # Data model operations
│   ├── entities/                # EAV entities
│   ├── attributes/              # EAV attributes
│   ├── values/                  # EAV values
│   ├── data-records/            # Data records
│   ├── spaces/                  # Space management
│   ├── users/                   # User management
│   ├── notifications/           # Notifications
│   ├── dashboards/              # Dashboard operations
│   ├── workflows/               # Workflow operations
│   ├── tickets/                 # Ticket management
│   ├── chatbots/                # Chatbot operations
│   ├── notebooks/               # Notebook operations
│   ├── files/                   # File operations
│   ├── folders/                 # Folder operations
│   ├── attachments/             # Attachment operations
│   ├── import-export/           # Import/Export
│   ├── export-profiles/         # Export profiles
│   ├── import-profiles/         # Import profiles
│   ├── data-sync-schedules/    # Data sync
│   ├── templates/               # Templates
│   ├── roles/                   # Role management
│   ├── permissions/             # Permission checks
│   ├── assignments/             # Assignments
│   ├── invitations/             # Invitations
│   ├── settings/                # Settings
│   ├── health/                  # Health check
│   └── realtime/                # Real-time updates
│
├── admin/                       # Admin-only APIs (already exists)
│   ├── users/                   # User management
│   ├── spaces/                  # Space management
│   ├── storage/                 # Storage management
│   ├── cache-instances/         # Cache management
│   ├── kong-instances/          # Kong gateway
│   ├── secrets/                 # Secrets management
│   ├── system-health/           # System health
│   ├── analytics/               # Analytics
│   ├── logs/                    # Logs
│   ├── query-history/           # Query history
│   ├── query-performance/       # Query performance
│   ├── database-connections/    # Database connections
│   ├── database-stats/          # Database stats
│   ├── database-tables/         # Database tables
│   ├── execute-query/           # Query execution
│   ├── filesystem/              # Filesystem operations
│   ├── ai-models/               # AI models
│   ├── ai-providers/            # AI providers
│   ├── api-client/              # API client
│   ├── bi/                      # Business intelligence
│   ├── chat-sessions/           # Chat sessions
│   ├── notebooks/               # Notebooks
│   ├── roles/                   # Roles
│   ├── saved-queries/           # Saved queries
│   ├── sso-config/              # SSO config
│   └── attachments/             # Attachments
│
├── public/                       # Public APIs (already exists)
│   └── spaces/                  # Public space data
│
├── auth/                         # Authentication (keep as-is)
│   ├── [...nextauth]/
│   ├── invite/
│   ├── reset-password/
│   ├── signup/
│   └── sso-providers/
│
├── internal/                     # Internal APIs
│   ├── automation/              # Automation
│   ├── scheduler/               # Scheduler
│   ├── webhooks/                # Webhooks
│   └── sse/                     # Server-sent events
│
└── legacy/                       # Legacy routes (backward compatibility)
    ├── companies/               # Legacy company routes
    ├── customers/               # Legacy customer routes
    ├── events/                  # Legacy event routes
    ├── industries/              # Legacy industry routes
    ├── positions/               # Legacy position routes
    ├── sources/                  # Legacy source routes
    ├── titles/                  # Legacy title routes
    ├── call-workflow-statuses/  # Legacy status routes
    └── business-profiles/       # Legacy profile routes
```

## Migration Strategy

### Phase 1: Create New Structure (Non-Breaking)
1. Create `v1/` directory structure
2. Create route redirects/mappings
3. Test backward compatibility

### Phase 2: Migrate Routes Incrementally
1. Start with most-used routes
2. Move routes one domain at a time
3. Update imports in frontend
4. Test thoroughly

### Phase 3: Cleanup
1. Remove legacy routes after migration
2. Update documentation
3. Update API client code

## Benefits

1. **Clear Organization** - Routes grouped by domain
2. **Versioning** - Easy to add v2, v3, etc.
3. **Better Navigation** - Easier to find routes
4. **Separation of Concerns** - Admin, public, internal clearly separated
5. **Backward Compatibility** - Legacy routes maintained during migration

## Implementation Notes

- Use Next.js route groups for organization
- Maintain backward compatibility with redirects
- Update API documentation
- Create migration script for imports

