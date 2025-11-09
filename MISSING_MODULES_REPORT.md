# Missing Modules from Secondary Menu

## Summary
- **Total modules in page.tsx**: 39
- **Modules in secondary menu**: 31
- **Missing modules**: 8

## Missing Modules

The following modules are implemented in `src/app/page.tsx` but are **NOT** present in the secondary menu (`groupedTabs` in `src/components/platform/PlatformSidebar.tsx`):

1. **audit** - `AuditLogs` component
2. **backup** - `BackupRecovery` component
3. **api** - `APIManagement` component
4. **notifications** - `NotificationCenter` component
5. **themes** - `ThemeBranding` component
6. **roles** - `RoleManagement` component
7. **permission-tester** - `PermissionTester` component
8. **space-settings** - `SpaceSettingsAdmin` component

## Current Menu Structure

### Overview Group
- overview
- analytics

### Tools Group
- bigquery
- notebook
- ai-analyst
- ai-chat-ui
- knowledge-base
- projects
- bi
- storage
- data-governance

### System Group
- users
- space-layouts
- data
- attachments
- kernels
- health
- logs
- database
- change-requests
- sql-linting
- schema-migrations
- data-masking
- cache
- security
- performance
- settings
- page-templates
- export
- integrations

### Data Management Group
- space-selection

## Recommendations

To add the missing modules to the secondary menu, update the `groupedTabs` object in `src/components/platform/PlatformSidebar.tsx`:

**Suggested additions:**
- `audit`, `backup`, `api`, `notifications`, `themes` → Add to `system` group (likely in appropriate sections)
- `roles`, `permission-tester` → Add to `system` group (likely in Management or Security section)
- `space-settings` → Add to `system` group (likely in Management section)

