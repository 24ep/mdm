# Phase 3.2: Status Color Functions Consolidation

## Overview

Consolidating duplicate status color functions across feature utilities into a shared utility.

## Current State

### Functions Found

1. **Storage Utils:**
   - `getCacheStatusColor()` - Connection status
   - `getBackupStatusColor()` - Job status

2. **Data Utils:**
   - `getConnectionStatusColor()` - Connection status
   - `getJobStatusColor()` - Job status

3. **Content Utils:**
   - `getChangeRequestStatusColor()` - Approval status
   - `getTicketPriorityColor()` - Priority

4. **Security Utils:**
   - `getSeverityColor()` - Severity
   - `getStatusColor()` - Result status

5. **Analytics Utils:**
   - `getHealthStatusColor()` - Health status
   - `getAlertSeverityColor()` - Severity

6. **Integration Utils:**
   - `getIntegrationStatusColor()` - Integration status

## Solution

### Created `src/lib/status-colors.ts`

**Shared Utilities:**
- Generic `getStatusColor()` function
- Common color mappings (connection, job, approval, health, etc.)
- Convenience functions for each pattern

**Color Mappings:**
- `connectionStatusColors` - connected/disconnected/error
- `jobStatusColors` - completed/running/failed/pending
- `approvalStatusColors` - approved/rejected/pending/merged
- `healthStatusColors` - healthy/degraded/down/unknown
- `integrationStatusColors` - active/inactive/error/pending
- `priorityColors` - high/medium/low/critical
- `severityColors` - low/medium/high/critical
- `resultStatusColors` - success/error/warning

## Updated Files

✅ **Storage Utils** - Uses shared utilities
✅ **Data Utils** - Uses shared utilities
✅ **Content Utils** - Uses shared utilities
✅ **Security Utils** - Uses shared utilities
✅ **Analytics Utils** - Uses shared utilities
✅ **Integration Utils** - Uses shared utilities

## Benefits

1. **Code Reduction**: ~100-150 lines of duplicate code removed
2. **Consistency**: All status colors use same mappings
3. **Maintainability**: Single place to update color schemes
4. **Type Safety**: TypeScript ensures correct usage
5. **Reusability**: Easy to add new status color patterns

## Impact

- **Lines Removed**: ~100-150 lines
- **Files Updated**: 6 feature utils files
- **New Shared Utility**: 1 file (`status-colors.ts`)
- **Consistency**: Improved across all features

## Status

✅ **Complete** - All status color functions consolidated

