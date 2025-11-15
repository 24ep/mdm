# Refactoring Plan - Detailed Implementation Guide

**Version:** 1.0  
**Date:** 2025-01-XX  
**Status:** 📋 Implementation Plan

---

## 📋 Overview

This document provides a detailed, step-by-step plan for refactoring the MDM platform to the new single-source architecture with marketplace and infrastructure management.

---

## 🎯 Goals

1. **Single Source of Code** - Eliminate code duplication
2. **Feature Modules** - Organize code into reusable modules
3. **Marketplace System** - Plugin-based extensibility
4. **Infrastructure Management** - Unified infrastructure and service management
5. **Consistent UI/UX** - Same experience across all views

---

## 📅 Timeline Overview

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 1: Foundation | 2 weeks | Structure, database, shared utilities |
| Phase 2: Feature Migration | 4 weeks | Migrate tickets, reports, dashboards, workflows |
| Phase 3: Marketplace | 4 weeks | Plugin system, existing integrations |
| Phase 4: Infrastructure | 4 weeks | Infrastructure management, service discovery |
| Phase 5: Enhancements | 4 weeks | Security, performance, monitoring |
| Phase 6: Testing | 2 weeks | Unit, integration, E2E tests |
| Phase 7: Migration | 2 weeks | Legacy cleanup, API migration |
| **Total** | **22 weeks** | **~5.5 months** |

---

## Phase 1: Foundation (Weeks 1-2)

### Week 1: Structure Setup

#### Day 1-2: Create Feature Module Structure
```bash
# Create directories
mkdir -p src/features/{tickets,reports,dashboards,workflows,marketplace,infrastructure}/{components,hooks,lib}
mkdir -p src/shared/{lib,hooks,components,types}
mkdir -p src/shared/lib/{security,resilience,cache,monitoring,realtime,batch}

# Create index files
touch src/features/tickets/types.ts
touch src/features/reports/types.ts
# ... (for all features)
```

**Tasks:**
- [ ] Create all directory structures
- [ ] Create base TypeScript config files
- [ ] Set up path aliases in `tsconfig.json`
- [ ] Create base export files

#### Day 3-4: Database Schema Updates

**Create Migration Files:**

```sql
-- Migration: 20250101000000_add_marketplace_tables.sql
-- Migration: 20250101000001_add_infrastructure_tables.sql
-- Migration: 20250101000002_add_service_management_tables.sql
```

**Tasks:**
- [ ] Create marketplace tables
  - [ ] `service_registry`
  - [ ] `service_installations`
  - [ ] `service_ui_components`
  - [ ] `service_api_routes`
- [ ] Create infrastructure tables
  - [ ] `infrastructure_instances`
  - [ ] `instance_services`
  - [ ] `service_management_assignments`
- [ ] Run migrations
- [ ] Update Prisma schema
- [ ] Generate Prisma client

#### Day 5: Shared Utilities Foundation

**Tasks:**
- [ ] Create `src/shared/lib/security/permission-checker.ts`
- [ ] Create `src/shared/lib/security/credential-manager.ts`
- [ ] Create `src/shared/lib/security/audit-logger.ts`
- [ ] Create `src/shared/lib/cache/cache-manager.ts`
- [ ] Create `src/shared/lib/monitoring/logger.ts`
- [ ] Create `src/shared/hooks/useSpaceFilter.ts`

### Week 2: Core Infrastructure

#### Day 1-2: API Route Structure

**Tasks:**
- [ ] Create `src/app/api/v1/` structure
- [ ] Create `src/app/api/marketplace/` structure
- [ ] Create `src/app/api/plugins/` structure
- [ ] Create `src/app/api/infrastructure/` structure
- [ ] Set up route handlers (stubs)

#### Day 3-4: Context and Hooks

**Tasks:**
- [ ] Verify `space-context.tsx` exists and works
- [ ] Create `src/shared/hooks/usePermissions.ts`
- [ ] Create `src/shared/hooks/useSpaceFilter.ts`
- [ ] Test context providers

#### Day 5: Testing Setup

**Tasks:**
- [ ] Set up Jest configuration
- [ ] Set up React Testing Library
- [ ] Create test utilities
- [ ] Write sample tests for shared utilities

---

## Phase 2: Feature Migration (Weeks 3-6)

### Week 3: Tickets Feature

#### Day 1: Extract Components

**Tasks:**
- [ ] Analyze existing tickets code
- [ ] Identify shared components
- [ ] Create `src/features/tickets/components/TicketsList.tsx`
- [ ] Create `src/features/tickets/components/TicketCard.tsx`
- [ ] Create `src/features/tickets/components/TicketKanban.tsx`
- [ ] Create `src/features/tickets/components/TicketFilters.tsx`

#### Day 2: Create Hooks

**Tasks:**
- [ ] Create `src/features/tickets/hooks/useTickets.ts` (space-aware)
- [ ] Create `src/features/tickets/hooks/useTicketActions.ts`
- [ ] Create `src/features/tickets/hooks/useTicketFilters.ts`
- [ ] Test hooks

#### Day 3: Update Views

**Tasks:**
- [ ] Update `src/app/[space]/projects/page.tsx` to use `TicketsList`
- [ ] Update `src/app/admin/features/content/ProjectsManagement.tsx` to use `TicketsList`
- [ ] Test both views
- [ ] Verify space filtering works

#### Day 4: API Migration

**Tasks:**
- [ ] Create `src/app/api/v1/tickets/route.ts`
- [ ] Migrate existing ticket API logic
- [ ] Update API to support space filtering
- [ ] Test API endpoints

#### Day 5: Testing & Cleanup

**Tasks:**
- [ ] Write unit tests for components
- [ ] Write integration tests for hooks
- [ ] Write API tests
- [ ] Remove duplicate code
- [ ] Update documentation

### Week 4: Reports Feature

#### Day 1-2: Extract Components

**Tasks:**
- [ ] Create `src/features/reports/components/ReportsList.tsx`
- [ ] Create `src/features/reports/components/ReportsTreeView.tsx`
- [ ] Create `src/features/reports/components/SourceTypeView.tsx`
- [ ] Create `src/features/reports/components/ReportCard.tsx`

#### Day 3: Create Hooks

**Tasks:**
- [ ] Create `src/features/reports/hooks/useReports.ts` (space-aware)
- [ ] Create `src/features/reports/hooks/useReportActions.ts`
- [ ] Test hooks

#### Day 4: Update Views

**Tasks:**
- [ ] Update `src/app/[space]/reports/page.tsx`
- [ ] Update `src/app/reports/page.tsx`
- [ ] Test both views

#### Day 5: Testing

**Tasks:**
- [ ] Write tests
- [ ] Remove duplicate code
- [ ] Update documentation

### Week 5: Dashboards Feature

**Tasks:**
- [ ] Create `src/features/dashboards/` structure
- [ ] Extract `DashboardsList` component
- [ ] Create `useDashboards` hook (space-aware)
- [ ] Update views
- [ ] Test and cleanup

### Week 6: Workflows Feature

**Tasks:**
- [ ] Create `src/features/workflows/` structure
- [ ] Extract `WorkflowsList` component
- [ ] Create `useWorkflows` hook (space-aware)
- [ ] Update views
- [ ] Test and cleanup

---

## Phase 3: Marketplace System (Weeks 7-10)

### Week 7: Marketplace Foundation

#### Day 1-2: Plugin Registry

**Tasks:**
- [ ] Create `src/features/marketplace/lib/plugin-registry.ts`
- [ ] Create plugin registration API
- [ ] Create plugin discovery API
- [ ] Test plugin registry

#### Day 3-4: Plugin Loader

**Tasks:**
- [ ] Create `src/features/marketplace/lib/plugin-loader.ts`
- [ ] Implement dynamic SDK loading
- [ ] Implement component loading
- [ ] Test plugin loader

#### Day 5: API Gateway

**Tasks:**
- [ ] Create `src/features/marketplace/lib/plugin-gateway.ts`
- [ ] Create API gateway routes
- [ ] Implement request routing
- [ ] Test API gateway

### Week 8: Plugin System

#### Day 1-2: Plugin Interface

**Tasks:**
- [ ] Define plugin interface
- [ ] Create plugin types
- [ ] Create plugin validation
- [ ] Test plugin interface

#### Day 3-4: Plugin Authentication

**Tasks:**
- [ ] Create plugin authentication system
- [ ] Implement credential management
- [ ] Test authentication

#### Day 5: Plugin Events

**Tasks:**
- [ ] Create event system
- [ ] Implement webhook support
- [ ] Test events

### Week 9: Convert Existing Integrations

#### Day 1: Power BI Plugin

**Tasks:**
- [ ] Create `src/features/marketplace/plugins/powerbi/` structure
- [ ] Extract Power BI logic to plugin
- [ ] Create plugin definition
- [ ] Register plugin
- [ ] Test plugin

#### Day 2: Grafana Plugin

**Tasks:**
- [ ] Create Grafana plugin structure
- [ ] Extract Grafana logic
- [ ] Register plugin
- [ ] Test plugin

#### Day 3: Looker Studio Plugin

**Tasks:**
- [ ] Create Looker Studio plugin
- [ ] Extract logic
- [ ] Register plugin
- [ ] Test plugin

#### Day 4: ServiceDesk Plugin

**Tasks:**
- [ ] Create ServiceDesk plugin
- [ ] Extract ServiceDesk logic
- [ ] Register plugin
- [ ] Test plugin

#### Day 5: OpenMetadata Plugin

**Tasks:**
- [ ] Create OpenMetadata plugin
- [ ] Extract logic
- [ ] Register plugin
- [ ] Test plugin

### Week 10: Marketplace UI

#### Day 1-2: Marketplace Home

**Tasks:**
- [ ] Create `src/features/marketplace/components/MarketplaceHome.tsx`
- [ ] Create plugin browsing UI
- [ ] Create search and filters
- [ ] Test UI

#### Day 3: Plugin Details

**Tasks:**
- [ ] Create `PluginDetails` component
- [ ] Create installation wizard
- [ ] Test installation flow

#### Day 4: Plugin Management

**Tasks:**
- [ ] Create `InstalledPlugins` component
- [ ] Create plugin configuration UI
- [ ] Test management UI

#### Day 5: Integration

**Tasks:**
- [ ] Integrate marketplace with reports
- [ ] Test end-to-end flow
- [ ] Update documentation

---

## Phase 4: Infrastructure Management (Weeks 11-14)

### Week 11: Infrastructure Foundation

#### Day 1-2: Instance Connectors

**Tasks:**
- [ ] Create `src/features/infrastructure/lib/instance-connectors/ssh-connector.ts`
- [ ] Create `docker-connector.ts`
- [ ] Create `kubernetes-connector.ts`
- [ ] Create `http-connector.ts`
- [ ] Test connectors

#### Day 3-4: Service Discovery

**Tasks:**
- [ ] Create `src/features/infrastructure/lib/service-discovery/docker-discovery.ts`
- [ ] Create `systemd-discovery.ts`
- [ ] Create `process-discovery.ts`
- [ ] Test discovery

#### Day 5: Health Checks

**Tasks:**
- [ ] Create health check system
- [ ] Implement health check API
- [ ] Test health checks

### Week 12: Infrastructure UI

#### Day 1-2: Overview Component

**Tasks:**
- [ ] Create `src/features/infrastructure/components/InfrastructureOverview.tsx`
- [ ] Create `InstanceCard` component
- [ ] Create instance list view
- [ ] Test UI

#### Day 3: Instance Details

**Tasks:**
- [ ] Create `InstanceDetails` component
- [ ] Create services list
- [ ] Test details view

#### Day 4: Service Management

**Tasks:**
- [ ] Create `ServiceManagement` component
- [ ] Create `ManagementPluginSelector` component
- [ ] Test service management

#### Day 5: Integration

**Tasks:**
- [ ] Integrate with marketplace
- [ ] Test plugin assignment
- [ ] Test management UIs

### Week 13: Service Management Plugins

#### Day 1: MinIO Plugin

**Tasks:**
- [ ] Create `src/features/marketplace/plugins/minio-management/` structure
- [ ] Create `MinIOManagementUI` component
- [ ] Implement MinIO client
- [ ] Register plugin
- [ ] Test plugin

#### Day 2: Kong Plugin

**Tasks:**
- [ ] Create Kong management plugin
- [ ] Create `KongManagementUI` component
- [ ] Implement Kong client
- [ ] Register plugin
- [ ] Test plugin

#### Day 3: Redis Plugin

**Tasks:**
- [ ] Create Redis management plugin
- [ ] Create management UI
- [ ] Test plugin

#### Day 4: PostgreSQL Plugin

**Tasks:**
- [ ] Create PostgreSQL management plugin
- [ ] Create management UI
- [ ] Test plugin

#### Day 5: Testing

**Tasks:**
- [ ] Test all management plugins
- [ ] Fix issues
- [ ] Update documentation

### Week 14: Auto-Discovery

#### Day 1-2: Discovery System

**Tasks:**
- [ ] Create auto-discovery scheduler
- [ ] Implement discovery rules
- [ ] Test discovery

#### Day 3-4: Discovery UI

**Tasks:**
- [ ] Create discovery status UI
- [ ] Create discovery history
- [ ] Test UI

#### Day 5: Integration Testing

**Tasks:**
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Fix issues

---

## Phase 5: Enhancements (Weeks 15-18)

### Week 15: Security

**Tasks:**
- [ ] Implement audit logging
- [ ] Implement rate limiting
- [ ] Implement credential encryption
- [ ] Security audit
- [ ] Fix security issues

### Week 16: Performance

**Tasks:**
- [ ] Implement caching
- [ ] Optimize queries
- [ ] Implement lazy loading
- [ ] Code splitting
- [ ] Performance testing

### Week 17: Monitoring

**Tasks:**
- [ ] Implement metrics collection
- [ ] Structured logging
- [ ] Error tracking
- [ ] Performance monitoring
- [ ] Dashboard creation

### Week 18: Real-time

**Tasks:**
- [ ] WebSocket implementation
- [ ] SSE implementation
- [ ] Real-time updates
- [ ] Live notifications
- [ ] Testing

---

## Phase 6: Testing & Documentation (Weeks 19-20)

### Week 19: Testing

**Tasks:**
- [ ] Unit tests (target: 80%+ coverage)
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance tests
- [ ] Security tests

### Week 20: Documentation

**Tasks:**
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Component documentation
- [ ] Plugin development guide
- [ ] Deployment guide
- [ ] User guide

---

## Phase 7: Migration & Cleanup (Weeks 21-22)

### Week 21: Legacy Migration

**Tasks:**
- [ ] Migrate remaining components
- [ ] Remove duplicate code
- [ ] Update all imports
- [ ] Remove unused files
- [ ] Code review

### Week 22: Final Cleanup

**Tasks:**
- [ ] API migration to v1
- [ ] Deprecate old routes
- [ ] Final testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Release preparation

---

## 📊 Progress Tracking

### Checklist Template

For each feature migration:

- [ ] Feature module structure created
- [ ] Components extracted
- [ ] Hooks created (space-aware)
- [ ] Views updated
- [ ] API routes created/updated
- [ ] Tests written
- [ ] Documentation updated
- [ ] Legacy code removed
- [ ] Code review completed

### Metrics

Track these metrics throughout:

- **Code Duplication:** Target < 5%
- **Test Coverage:** Target > 80%
- **TypeScript Coverage:** Target 100%
- **Build Time:** Monitor and optimize
- **Bundle Size:** Monitor and optimize

---

## 🚨 Risk Management

### Identified Risks

1. **Breaking Changes** - Mitigation: Maintain backward compatibility
2. **Time Overruns** - Mitigation: Buffer time in schedule
3. **Team Capacity** - Mitigation: Prioritize critical features
4. **Technical Debt** - Mitigation: Code reviews, refactoring time

### Mitigation Strategies

- **Incremental Migration** - One feature at a time
- **Backward Compatibility** - Old routes still work
- **Testing** - Comprehensive testing at each phase
- **Documentation** - Document all changes

---

## 📝 Notes

### Important Decisions

- Use modular monolith (not microservices)
- Single source of code pattern
- Plugin-based marketplace
- Space-aware architecture

### Dependencies

- Next.js 16.x
- React 19.x
- TypeScript 5.x
- Prisma 6.x
- PostgreSQL 15.x

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-XX

