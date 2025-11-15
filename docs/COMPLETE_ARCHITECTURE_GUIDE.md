# Complete Architecture Guide - MDM Platform

**Version:** 1.0  
**Date:** 2025-01-XX  
**Status:** 📋 Architecture Blueprint

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Concepts](#architecture-concepts)
3. [Complete Code Structure](#complete-code-structure)
4. [System Requirements](#system-requirements)
5. [Single Source of Code Pattern](#single-source-of-code-pattern)
6. [Feature Modules](#feature-modules)
7. [Marketplace & Plugin System](#marketplace--plugin-system)
8. [Infrastructure Management](#infrastructure-management)
9. [API Architecture](#api-architecture)
10. [Security & Authentication](#security--authentication)
11. [Refactoring Plan](#refactoring-plan)
12. [Implementation Guide](#implementation-guide)
13. [Migration Strategy](#migration-strategy)

---

## 🎯 Overview

This document provides a complete blueprint for the MDM (Master Data Management) platform architecture, including:

- **Modular Monolith** architecture with feature modules
- **Single Source of Code** pattern for all features
- **Marketplace/Plugin System** for extensibility
- **Infrastructure Management** with service management GUIs
- **Unified UI/UX** across admin and space views

### Key Principles

1. **Single Source of Code** - One component file, used everywhere
2. **Feature Modules** - Self-contained, reusable feature modules
3. **Space-Aware** - All features support space filtering
4. **Plugin-Based** - Extensible through marketplace plugins
5. **Unified Experience** - Same UI/UX in admin and space views

---

## 🏗️ Architecture Concepts

### 1. Modular Monolith

```
┌─────────────────────────────────────────────────────────────┐
│              MODULAR MONOLITH (Single Deployment)            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Core Platform Modules                        │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │
│  │  │ Data     │ │ Spaces   │ │ Users    │            │  │
│  │  │ Models   │ │          │ │          │            │  │
│  │  └──────────┘ └──────────┘ └──────────┘            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │    Feature Modules (Single Source)                  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │
│  │  │ Tickets  │ │ Reports  │ │ Dashboards│           │  │
│  │  └──────────┘ └──────────┘ └──────────┘            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │
│  │  │Workflows │ │Marketplace│ │Infrastructure│        │  │
│  │  └──────────┘ └──────────┘ └──────────┘            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │    Marketplace/Plugin System                        │  │
│  │  - Service Registry                                 │  │
│  │  - Plugin Loader                                    │  │
│  │  - API Gateway                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Shared Infrastructure                        │  │
│  │  - Database (PostgreSQL)                            │  │
│  │  - Cache (Redis)                                    │  │
│  │  - Storage (MinIO)                                  │  │
│  │  - Secrets (Vault)                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2. Single Source of Code Pattern

**Principle:** One component file, used in multiple places with different props.

```
✅ SINGLE COMPONENT
src/features/tickets/components/TicketsList.tsx

✅ USED IN:
├── src/app/[space]/tickets/page.tsx          (Space view)
└── src/app/admin/features/content/           (Admin view)
    └── TicketsManagement.tsx
```

**Benefits:**
- No code duplication
- Single place to fix bugs
- Consistent UI/UX
- Easier maintenance

### 3. Space-Aware Architecture

All features automatically filter by space when in space context:

```typescript
// Space view - automatically uses current space
<TicketsList spaceId={null} />  // null = use current space

// Admin view - can show all spaces
<TicketsList spaceId={null} showSpaceSelector={true} />
```

### 4. Marketplace Plugin System

- **Service Registry** - Register and discover services
- **Plugin Loader** - Dynamic SDK loading
- **API Gateway** - Route requests to plugins
- **UI Components** - Embed plugin UIs

---

## 📁 Complete Code Structure

```
mdm/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── src/
│   ├── app/                                    # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx                            # Admin dashboard
│   │   ├── providers.tsx
│   │   ├── globals.css
│   │   │
│   │   ├── [space]/                            # Space-scoped routes
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                        # Space dashboard
│   │   │   ├── tickets/page.tsx               # ✅ Uses TicketsList
│   │   │   ├── reports/page.tsx                # ✅ Uses ReportsList
│   │   │   ├── dashboards/page.tsx             # ✅ Uses DashboardsList
│   │   │   ├── workflows/page.tsx              # ✅ Uses WorkflowsList
│   │   │   ├── marketplace/page.tsx            # ✅ Uses MarketplaceHome
│   │   │   ├── infrastructure/page.tsx         # ✅ Uses InfrastructureOverview
│   │   │   ├── data/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── ... (other space routes)
│   │   │
│   │   ├── admin/                              # Admin routes
│   │   │   ├── page.tsx
│   │   │   └── features/
│   │   │       ├── content/
│   │   │       │   └── TicketsManagement.tsx   # ✅ Uses TicketsList
│   │   │       ├── infrastructure/
│   │   │       │   └── InfrastructureManagement.tsx  # ✅ Uses InfrastructureOverview
│   │   │       ├── integration/
│   │   │       ├── data-governance/
│   │   │       └── business-intelligence/
│   │   │
│   │   ├── reports/                            # Global reports
│   │   │   ├── page.tsx                        # ✅ Uses ReportsList
│   │   │   ├── [id]/page.tsx
│   │   │   ├── integrations/page.tsx
│   │   │   └── source/[source]/page.tsx
│   │   │
│   │   ├── marketplace/                        # Global marketplace
│   │   │   ├── page.tsx                        # ✅ Uses MarketplaceHome
│   │   │   ├── category/[category]/page.tsx
│   │   │   ├── plugin/[slug]/page.tsx
│   │   │   ├── plugin/[slug]/install/page.tsx
│   │   │   └── installed/page.tsx
│   │   │
│   │   ├── dashboards/                         # Global dashboards
│   │   │   ├── page.tsx                        # ✅ Uses DashboardsList
│   │   │   └── [id]/page.tsx
│   │   │
│   │   ├── workflows/                          # Global workflows
│   │   │   ├── page.tsx                        # ✅ Uses WorkflowsList
│   │   │   └── [id]/page.tsx
│   │   │
│   │   ├── infrastructure/                      # Global infrastructure
│   │   │   ├── page.tsx                        # ✅ Uses InfrastructureOverview
│   │   │   └── [id]/page.tsx
│   │   │
│   │   ├── auth/
│   │   │   └── signin/page.tsx
│   │   │
│   │   └── api/                                 # API Routes
│   │       ├── v1/                              # Versioned API
│   │       │   ├── data-models/
│   │       │   ├── entities/
│   │       │   ├── spaces/
│   │       │   ├── users/
│   │       │   ├── tickets/
│   │       │   ├── reports/
│   │       │   ├── dashboards/
│   │       │   ├── workflows/
│   │       │   └── ... (other v1 routes)
│   │       │
│   │       ├── marketplace/                     # Marketplace API
│   │       │   ├── plugins/
│   │       │   │   ├── route.ts                 # GET: List, POST: Register
│   │       │   │   ├── [slug]/
│   │       │   │   │   ├── route.ts             # GET/PUT/DELETE
│   │       │   │   │   ├── install/route.ts
│   │       │   │   │   ├── uninstall/route.ts
│   │       │   │   │   ├── configure/route.ts
│   │       │   │   │   ├── test/route.ts
│   │       │   │   │   ├── health/route.ts
│   │       │   │   │   └── sync/route.ts
│   │       │   │   └── search/route.ts
│   │       │   │
│   │       │   ├── installations/
│   │       │   │   ├── route.ts                 # GET: List, POST: Create
│   │       │   │   ├── [id]/
│   │       │   │   │   ├── route.ts             # GET/PUT/DELETE
│   │       │   │   │   ├── config/route.ts
│   │       │   │   │   ├── credentials/route.ts
│   │       │   │   │   ├── status/route.ts
│   │       │   │   │   └── logs/route.ts
│   │       │   │
│   │       │   ├── categories/
│   │       │   │   ├── route.ts
│   │       │   │   └── [category]/plugins/route.ts
│   │       │   │
│   │       │   └── analytics/
│   │       │       ├── route.ts
│   │       │       └── plugins/[slug]/route.ts
│   │       │
│   │       ├── plugins/                         # Plugin Runtime API
│   │       │   ├── [slug]/
│   │       │   │   ├── route.ts                 # Generic handler
│   │       │   │   ├── api/[...path]/route.ts   # Proxy to plugin API
│   │       │   │   ├── webhook/route.ts
│   │       │   │   ├── events/route.ts
│   │       │   │   └── components/
│   │       │   │       ├── config/route.ts
│   │       │   │       ├── embed/route.ts
│   │       │   │       └── widget/route.ts
│   │       │   │
│   │       │   └── gateway/
│   │       │       ├── route.ts
│   │       │       └── [slug]/[...path]/route.ts
│   │       │
│   │       ├── infrastructure/                  # Infrastructure API
│   │       │   ├── instances/
│   │       │   │   ├── route.ts                 # GET: List, POST: Create
│   │       │   │   ├── [id]/
│   │       │   │   │   ├── route.ts             # GET/PUT/DELETE
│   │       │   │   │   ├── services/route.ts    # GET: Services on instance
│   │       │   │   │   ├── discover/route.ts    # POST: Discover services
│   │       │   │   │   ├── health/route.ts      # GET: Health check
│   │       │   │   │   └── test/route.ts        # POST: Test connection
│   │       │   │
│   │       │   └── services/
│   │       │       ├── [id]/
│   │       │       │   ├── route.ts             # GET/PUT/DELETE
│   │       │       │   ├── assign-plugin/route.ts  # POST: Assign plugin
│   │       │       │   ├── management/route.ts     # GET: Management UI
│   │       │       │   └── management/[...action]/route.ts  # Proxy to plugin
│   │       │
│   │       ├── reports/
│   │       │   ├── route.ts
│   │       │   ├── [id]/route.ts
│   │       │   └── integrations/
│   │       │       ├── route.ts
│   │       │       ├── power-bi/
│   │       │       ├── grafana/
│   │       │       └── looker-studio/
│   │       │
│   │       ├── tickets/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── comments/route.ts
│   │       │       └── attachments/route.ts
│   │       │
│   │       ├── dashboards/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       │
│   │       ├── workflows/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       │
│   │       ├── admin/                           # Admin APIs
│   │       │   ├── integrations/
│   │       │   ├── marketplace/
│   │       │   ├── infrastructure/
│   │       │   └── ... (other admin routes)
│   │       │
│   │       ├── auth/
│   │       │   └── [...nextauth]/route.ts
│   │       │
│   │       └── internal/                        # Internal APIs
│   │           ├── automation/
│   │           ├── scheduler/
│   │           ├── webhooks/
│   │           └── sse/
│   │
│   ├── features/                                # Feature Modules (Single Source)
│   │   │
│   │   ├── tickets/                             # Tickets Feature
│   │   │   ├── components/
│   │   │   │   ├── TicketsList.tsx              # ✅ SINGLE SOURCE
│   │   │   │   ├── TicketCard.tsx
│   │   │   │   ├── TicketDetailModal.tsx
│   │   │   │   ├── TicketKanban.tsx
│   │   │   │   ├── TicketFilters.tsx
│   │   │   │   └── TicketActions.tsx
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useTickets.ts                # ✅ Space-aware
│   │   │   │   ├── useTicketActions.ts
│   │   │   │   └── useTicketFilters.ts
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── ticket-api.ts
│   │   │   │   └── ticket-utils.ts
│   │   │   │
│   │   │   └── types.ts
│   │   │
│   │   ├── reports/                             # Reports Feature
│   │   │   ├── components/
│   │   │   │   ├── ReportsList.tsx              # ✅ SINGLE SOURCE
│   │   │   │   ├── ReportsTreeView.tsx
│   │   │   │   ├── SourceTypeView.tsx
│   │   │   │   ├── ReportCard.tsx
│   │   │   │   └── ReportFilters.tsx
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useReports.ts                # ✅ Space-aware
│   │   │   │   └── useReportActions.ts
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   └── report-api.ts
│   │   │   │
│   │   │   └── types.ts
│   │   │
│   │   ├── dashboards/                          # Dashboards Feature
│   │   │   ├── components/
│   │   │   │   ├── DashboardsList.tsx           # ✅ SINGLE SOURCE
│   │   │   │   ├── DashboardCard.tsx
│   │   │   │   └── DashboardFilters.tsx
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useDashboards.ts             # ✅ Space-aware
│   │   │   │   └── useDashboardActions.ts
│   │   │   │
│   │   │   └── types.ts
│   │   │
│   │   ├── workflows/                           # Workflows Feature
│   │   │   ├── components/
│   │   │   │   ├── WorkflowsList.tsx            # ✅ SINGLE SOURCE
│   │   │   │   ├── WorkflowCard.tsx
│   │   │   │   └── WorkflowFilters.tsx
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useWorkflows.ts              # ✅ Space-aware
│   │   │   │   └── useWorkflowActions.ts
│   │   │   │
│   │   │   └── types.ts
│   │   │
│   │   ├── marketplace/                         # Marketplace Feature
│   │   │   ├── components/
│   │   │   │   ├── MarketplaceHome.tsx          # ✅ SINGLE SOURCE
│   │   │   │   ├── PluginCard.tsx
│   │   │   │   ├── PluginDetails.tsx
│   │   │   │   ├── InstallationWizard.tsx
│   │   │   │   ├── PluginConfig.tsx
│   │   │   │   ├── InstalledPlugins.tsx
│   │   │   │   ├── PluginSearch.tsx
│   │   │   │   └── CategoryView.tsx
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useMarketplacePlugins.ts     # ✅ Space-aware
│   │   │   │   ├── usePluginInstallation.ts
│   │   │   │   ├── usePluginConfig.ts
│   │   │   │   └── usePluginComponent.ts
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── plugin-registry.ts
│   │   │   │   ├── plugin-loader.ts
│   │   │   │   ├── plugin-gateway.ts
│   │   │   │   └── plugin-auth.ts
│   │   │   │
│   │   │   └── plugins/                          # Plugin Implementations
│   │   │       ├── powerbi/
│   │   │       │   ├── plugin.ts
│   │   │       │   ├── components/
│   │   │       │   │   ├── ConfigComponent.tsx
│   │   │       │   │   └── EmbedComponent.tsx
│   │   │       │   └── lib/
│   │   │       │       └── powerbi-client.ts
│   │   │       │
│   │   │       ├── grafana/
│   │   │       ├── looker-studio/
│   │   │       ├── servicedesk/
│   │   │       │
│   │   │       ├── minio-management/             # Service Management Plugins
│   │   │       │   ├── plugin.ts
│   │   │       │   ├── components/
│   │   │       │   │   └── MinIOManagementUI.tsx
│   │   │       │   └── lib/
│   │   │       │       └── minio-client.ts
│   │   │       │
│   │   │       ├── kong-management/
│   │   │       │   ├── plugin.ts
│   │   │       │   ├── components/
│   │   │       │   │   └── KongManagementUI.tsx
│   │   │       │   └── lib/
│   │   │       │       └── kong-client.ts
│   │   │       │
│   │   │       ├── redis-management/
│   │   │       ├── postgres-management/
│   │   │       └── ... (other plugins)
│   │   │
│   │   │   └── types.ts
│   │   │
│   │   └── infrastructure/                      # Infrastructure Feature
│   │       ├── components/
│   │       │   ├── InfrastructureOverview.tsx  # ✅ SINGLE SOURCE
│   │       │   ├── InstanceCard.tsx
│   │       │   ├── InstanceDetails.tsx
│   │       │   ├── ServicesList.tsx
│   │       │   ├── ServiceCard.tsx
│   │       │   ├── ServiceManagement.tsx
│   │       │   ├── ManagementPluginSelector.tsx
│   │       │   └── InstanceDiscovery.tsx
│   │       │
│   │       ├── hooks/
│   │       │   ├── useInfrastructureInstances.ts  # ✅ Space-aware
│   │       │   ├── useInstanceServices.ts
│   │       │   ├── useServiceManagement.ts
│   │       │   └── useInstanceDiscovery.ts
│   │       │
│   │       ├── lib/
│   │       │   ├── instance-connectors/
│   │       │   │   ├── ssh-connector.ts
│   │       │   │   ├── docker-connector.ts
│   │       │   │   ├── kubernetes-connector.ts
│   │       │   │   └── http-connector.ts
│   │       │   │
│   │       │   ├── service-discovery/
│   │       │   │   ├── docker-discovery.ts
│   │       │   │   ├── systemd-discovery.ts
│   │       │   │   └── process-discovery.ts
│   │       │   │
│   │       │   └── service-managers/
│   │       │       └── plugin-manager.ts
│   │       │
│   │       └── types.ts
│   │
│   ├── shared/                                   # Shared Code
│   │   ├── lib/
│   │   │   ├── security/
│   │   │   │   ├── permission-checker.ts
│   │   │   │   ├── credential-manager.ts
│   │   │   │   ├── audit-logger.ts
│   │   │   │   └── rate-limiter.ts
│   │   │   │
│   │   │   ├── resilience/
│   │   │   │   ├── retry-handler.ts
│   │   │   │   ├── circuit-breaker.ts
│   │   │   │   ├── health-checker.ts
│   │   │   │   └── error-boundary.tsx
│   │   │   │
│   │   │   ├── cache/
│   │   │   │   ├── cache-manager.ts
│   │   │   │   ├── query-cache.ts
│   │   │   │   └── redis-cache.ts
│   │   │   │
│   │   │   ├── monitoring/
│   │   │   │   ├── metrics-collector.ts
│   │   │   │   ├── logger.ts
│   │   │   │   └── tracing.ts
│   │   │   │
│   │   │   ├── realtime/
│   │   │   │   ├── websocket-manager.ts
│   │   │   │   ├── sse-manager.ts
│   │   │   │   └── event-emitter.ts
│   │   │   │
│   │   │   ├── batch/
│   │   │   │   ├── batch-processor.ts
│   │   │   │   ├── job-queue.ts
│   │   │   │   └── scheduler.ts
│   │   │   │
│   │   │   ├── export-import/
│   │   │   │   ├── config-exporter.ts
│   │   │   │   ├── config-importer.ts
│   │   │   │   └── backup-exporter.ts
│   │   │   │
│   │   │   ├── search/
│   │   │   │   ├── search-engine.ts
│   │   │   │   ├── filter-builder.ts
│   │   │   │   └── search-index.ts
│   │   │   │
│   │   │   ├── notifications/
│   │   │   │   ├── notification-manager.ts
│   │   │   │   ├── notification-channels.ts
│   │   │   │   └── notification-templates.ts
│   │   │   │
│   │   │   ├── database/
│   │   │   │   ├── transaction-manager.ts
│   │   │   │   ├── migration-runner.ts
│   │   │   │   └── backup-manager.ts
│   │   │   │
│   │   │   ├── db.ts                            # Database client
│   │   │   ├── auth.ts                          # Auth utilities
│   │   │   ├── secrets-manager.ts
│   │   │   ├── encryption.ts
│   │   │   └── ... (other shared libs)
│   │   │
│   │   ├── hooks/
│   │   │   ├── useSpaceFilter.ts                # Space filtering helper
│   │   │   ├── usePermissions.ts
│   │   │   └── ... (other shared hooks)
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                              # Base UI components (shadcn)
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   └── ... (all UI components)
│   │   │   │
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.tsx
│   │   │   │   └── PlatformLayout.tsx
│   │   │   │
│   │   │   └── shared/                          # Shared business components
│   │   │       ├── SpaceSelector.tsx
│   │   │       ├── LoadingSpinner.tsx
│   │   │       └── ErrorBoundary.tsx
│   │   │
│   │   └── types/
│   │       ├── database.ts
│   │       ├── api.ts
│   │       └── index.ts
│   │
│   ├── components/                              # Legacy/Other Components
│   │   ├── project-management/
│   │   ├── studio/
│   │   ├── datascience/
│   │   └── ... (other components)
│   │
│   ├── contexts/
│   │   ├── space-context.tsx
│   │   ├── theme-context.tsx
│   │   └── notification-context.tsx
│   │
│   ├── hooks/                                   # Legacy hooks (migrate to features)
│   │   └── ... (existing hooks)
│   │
│   ├── lib/                                     # Legacy libs (migrate to shared)
│   │   └── ... (existing libs)
│   │
│   ├── middleware.ts
│   ├── proxy.ts
│   └── types/
│       └── ... (type definitions)
│
├── public/
│   └── ... (static files)
│
├── lib/                                         # Root level libs
│   ├── agent-loop.ts
│   ├── connectors.ts
│   └── ... (other root libs)
│
├── sql/
│   └── ... (SQL scripts)
│
├── scripts/
│   └── ... (utility scripts)
│
├── docs/
│   └── ... (documentation)
│
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── docker-compose.yml
└── Dockerfile
```

---

## 💻 System Requirements

### Hardware Requirements

#### Development Environment
- **CPU:** 4+ cores
- **RAM:** 8GB minimum, 16GB recommended
- **Storage:** 20GB free space
- **OS:** Windows 10+, macOS 10.15+, or Linux

#### Production Environment
- **CPU:** 8+ cores
- **RAM:** 16GB minimum, 32GB recommended
- **Storage:** 100GB+ SSD
- **Network:** 100Mbps+ bandwidth

### Software Requirements

#### Runtime
- **Node.js:** 18.x or higher
- **PostgreSQL:** 15.x or higher
- **Redis:** 7.x or higher (optional, for caching)
- **Docker:** 20.x+ (for containerized deployment)
- **Docker Compose:** 2.x+ (for local development)

#### Development Tools
- **npm:** 9.x+ or **yarn:** 1.22+
- **Git:** 2.30+
- **TypeScript:** 5.x+
- **Next.js:** 16.x+

### Database Requirements

#### PostgreSQL
- **Version:** 15.x or higher
- **Extensions Required:**
  - `uuid-ossp` (for UUID generation)
  - `pg_trgm` (for text search)
  - `pgcrypto` (for encryption)
- **Connection Pool:** 20-50 connections
- **Storage:** Minimum 50GB for production

#### Redis (Optional)
- **Version:** 7.x or higher
- **Memory:** 2GB+ recommended
- **Persistence:** AOF or RDB enabled

### External Services

#### Required
- **PostgREST:** v12.0.2+ (for REST API)
- **MinIO:** Latest (for file storage)
- **HashiCorp Vault:** Latest (for secrets management)

#### Optional
- **Kong API Gateway:** 3.x+ (for API management)
- **Monitoring:** Prometheus, Grafana
- **Logging:** ELK Stack or similar

### Browser Requirements

#### Supported Browsers
- **Chrome:** 90+
- **Firefox:** 88+
- **Safari:** 14+
- **Edge:** 90+

#### Features Required
- JavaScript enabled
- LocalStorage support
- WebSocket support
- Fetch API support

### Network Requirements

#### Ports Required
- **3000:** Next.js application
- **3001:** PostgREST API
- **5432:** PostgreSQL
- **6379:** Redis
- **9000:** MinIO API
- **9001:** MinIO Console
- **8200:** Vault

#### Firewall Rules
- Allow inbound: 3000, 3001, 9000, 9001
- Allow outbound: All (for external API calls)

### Security Requirements

#### SSL/TLS
- **Production:** HTTPS required
- **Certificates:** Valid SSL certificates
- **Cipher Suites:** Modern, secure ciphers only

#### Authentication
- **NextAuth.js:** 4.x+
- **OAuth Providers:** Supported providers
- **Session Management:** Secure session storage

#### Secrets Management
- **Vault:** For production secrets
- **Encryption:** AES-256 for sensitive data
- **Key Rotation:** Automated key rotation

---

## 🔄 Single Source of Code Pattern

### Concept

**One component file, used in multiple places with different props.**

### Pattern Structure

```
✅ SINGLE COMPONENT
src/features/[feature]/components/[Feature]List.tsx

✅ USED IN:
├── src/app/[space]/[feature]/page.tsx          (Space view)
└── src/app/admin/features/[feature]/           (Admin view)
    └── [Feature]Management.tsx
```

### Implementation Example

```typescript
// ✅ SINGLE SOURCE - src/features/tickets/components/TicketsList.tsx
'use client'

import { useTickets } from '../hooks/useTickets'

interface TicketsListProps {
  spaceId?: string | null      // null = use current space, undefined = all spaces
  showSpaceSelector?: boolean  // Show space selector (admin view)
}

export function TicketsList({ 
  spaceId = null,
  showSpaceSelector = false 
}: TicketsListProps) {
  const { tickets, loading } = useTickets({ spaceId })
  
  return (
    <div>
      {showSpaceSelector && <SpaceSelector />}
      {/* Same UI for both admin and space */}
      <TicketKanban tickets={tickets} />
    </div>
  )
}
```

```typescript
// ✅ SPACE VIEW - src/app/[space]/tickets/page.tsx
import { TicketsList } from '@/features/tickets/components/TicketsList'

export default function SpaceTicketsPage() {
  return <TicketsList spaceId={null} showSpaceSelector={false} />
}
```

```typescript
// ✅ ADMIN VIEW - src/app/admin/features/content/TicketsManagement.tsx
import { TicketsList } from '@/features/tickets/components/TicketsList'  // SAME FILE!

export function TicketsManagement() {
  return <TicketsList spaceId={null} showSpaceSelector={true} />
}
```

### Benefits

1. **No Code Duplication** - One file, multiple uses
2. **Consistent UI/UX** - Same experience everywhere
3. **Easier Maintenance** - Fix once, works everywhere
4. **Faster Development** - Build once, use everywhere
5. **Type Safety** - Shared types across views

### Space-Aware Pattern

All hooks automatically handle space filtering:

```typescript
// src/features/tickets/hooks/useTickets.ts
export function useTickets(options: { spaceId?: string | null } = {}) {
  const { currentSpace } = useSpace()
  
  // Determine space ID
  const spaceId = options.spaceId !== undefined 
    ? options.spaceId 
    : currentSpace?.id || null
  
  // Fetch with space filter
  const { tickets } = useQuery({
    queryKey: ['tickets', spaceId],
    queryFn: () => fetchTickets({ spaceId })
  })
  
  return { tickets }
}
```

---

## 📦 Feature Modules

### Module Structure

Each feature module follows this structure:

```
src/features/[feature-name]/
├── components/           # UI components (single source)
│   └── [Feature]List.tsx
├── hooks/               # React hooks (space-aware)
│   └── use[Feature].ts
├── lib/                 # Business logic
│   └── [feature]-api.ts
└── types.ts             # TypeScript types
```

### Feature List

1. **Tickets** - Project management and ticketing
2. **Reports** - BI reports and dashboards
3. **Dashboards** - Custom dashboards
4. **Workflows** - Workflow automation
5. **Marketplace** - Plugin marketplace
6. **Infrastructure** - Infrastructure management

### Module Standards

#### Component Standards
- All components must be reusable
- Props for customization (spaceId, showSpaceSelector)
- TypeScript types for all props
- Error boundaries for error handling

#### Hook Standards
- Space-aware by default
- Use React Query for data fetching
- Proper error handling
- Loading states

#### API Standards
- Consistent error responses
- Proper HTTP status codes
- Request/response validation
- Rate limiting

---

## 🛒 Marketplace & Plugin System

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Marketplace System                                     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Service Registry                                │   │
│  │  - Plugin definitions                           │   │
│  │  - Service metadata                             │   │
│  │  - Capabilities                                 │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Plugin Loader                                   │   │
│  │  - Dynamic SDK loading                          │   │
│  │  - Component loading                            │   │
│  │  - Version management                           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  API Gateway                                      │   │
│  │  - Request routing                               │   │
│  │  - Authentication proxy                          │   │
│  │  - Rate limiting                                │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Plugin Types

1. **BI Tools** - Power BI, Grafana, Looker Studio
2. **Service Management** - MinIO, Kong, Redis, PostgreSQL
3. **Communication** - Slack, Teams, Email
4. **Storage** - AWS S3, Google Cloud Storage
5. **Monitoring** - Datadog, New Relic, Prometheus

### Plugin Structure

```typescript
interface PluginDefinition {
  id: string
  name: string
  category: string
  capabilities: {
    api: boolean
    ui: boolean
    webhook: boolean
  }
  sdk: {
    type: 'npm' | 'cdn' | 'local'
    package?: string
    url?: string
  }
  ui: {
    configComponent?: string
    embedComponent?: string
    managementComponent?: string
  }
}
```

### Plugin Registration

```typescript
// Register plugin in marketplace
POST /api/marketplace/plugins
{
  "id": "kong-management",
  "name": "Kong API Gateway Management",
  "category": "service-management",
  "capabilities": {
    "serviceNames": ["kong", "kong-gateway"]
  },
  "ui": {
    "managementComponent": "@/features/marketplace/plugins/kong-management/components/KongManagementUI"
  }
}
```

---

## 🖥️ Infrastructure Management

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Infrastructure Management                              │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Instance Registry                               │   │
│  │  - VMs, Docker hosts, K8s clusters             │   │
│  │  - Connection management                         │   │
│  │  - Health monitoring                            │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Service Discovery                               │   │
│  │  - Auto-discover services                        │   │
│  │  - Docker containers                             │   │
│  │  - Systemd services                             │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Service Management                              │   │
│  │  - Assign management plugins                     │   │
│  │  - Unified management UI                         │   │
│  │  - Plugin-based GUIs                             │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Instance Types

1. **VMs** - Virtual machines (SSH connection)
2. **Docker Hosts** - Docker daemon (Docker API)
3. **Kubernetes** - K8s clusters (K8s API)
4. **Cloud Instances** - AWS, Azure, GCP

### Service Discovery

- **Docker Containers** - Discover running containers
- **Systemd Services** - Discover system services
- **Process Discovery** - Discover running processes
- **Custom Discovery** - Plugin-based discovery

### Management Plugins

- **MinIO Management** - Bucket and object management
- **Kong Management** - Routes, services, plugins
- **Redis Management** - Key management, monitoring
- **PostgreSQL Management** - Database management

---

## 🔌 API Architecture

### API Structure

```
/api/
├── v1/                    # Versioned public API
├── marketplace/           # Marketplace API
├── plugins/               # Plugin runtime API
├── infrastructure/        # Infrastructure API
├── admin/                 # Admin APIs
├── auth/                  # Authentication
└── internal/              # Internal APIs
```

### API Versioning

- **v1** - Current stable version
- **v2** - Future version (backward compatible)
- **Deprecation** - 6 months notice before removal

### API Standards

- **RESTful** - Follow REST conventions
- **JSON** - All responses in JSON
- **Error Handling** - Consistent error format
- **Rate Limiting** - Per user/space limits
- **Authentication** - JWT tokens

### Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {},
  "timestamp": "2025-01-XXT00:00:00Z"
}
```

---

## 🔐 Security & Authentication

### Authentication

- **NextAuth.js** - Session management
- **OAuth Providers** - Google, GitHub, etc.
- **JWT Tokens** - API authentication
- **Session Storage** - Secure session storage

### Authorization

- **RBAC** - Role-based access control
- **Space Permissions** - Per-space permissions
- **Resource Permissions** - Per-resource permissions
- **API Permissions** - Per-endpoint permissions

### Security Features

- **Encryption** - AES-256 for sensitive data
- **Secrets Management** - Vault integration
- **Audit Logging** - All actions logged
- **Rate Limiting** - Prevent abuse
- **CORS** - Configured CORS policies

---

## 📋 Refactoring Plan

### Phase 1: Foundation (Weeks 1-2)

#### 1.1 Create Feature Module Structure
- [ ] Create `src/features/` directory
- [ ] Set up base structure for each feature
- [ ] Create shared utilities structure

#### 1.2 Database Schema Updates
- [ ] Add marketplace tables
- [ ] Add infrastructure tables
- [ ] Add service management tables
- [ ] Run migrations

#### 1.3 Shared Utilities
- [ ] Create security utilities
- [ ] Create cache utilities
- [ ] Create monitoring utilities
- [ ] Create error handling utilities

### Phase 2: Feature Migration (Weeks 3-6)

#### 2.1 Tickets Feature
- [ ] Create `src/features/tickets/` structure
- [ ] Extract `TicketsList` component
- [ ] Create `useTickets` hook (space-aware)
- [ ] Update space and admin views to use shared component
- [ ] Test and verify

#### 2.2 Reports Feature
- [ ] Create `src/features/reports/` structure
- [ ] Extract `ReportsList` component
- [ ] Create `useReports` hook (space-aware)
- [ ] Update views to use shared component
- [ ] Test and verify

#### 2.3 Dashboards Feature
- [ ] Create `src/features/dashboards/` structure
- [ ] Extract `DashboardsList` component
- [ ] Create `useDashboards` hook (space-aware)
- [ ] Update views to use shared component
- [ ] Test and verify

#### 2.4 Workflows Feature
- [ ] Create `src/features/workflows/` structure
- [ ] Extract `WorkflowsList` component
- [ ] Create `useWorkflows` hook (space-aware)
- [ ] Update views to use shared component
- [ ] Test and verify

### Phase 3: Marketplace System (Weeks 7-10)

#### 3.1 Marketplace Foundation
- [ ] Create marketplace database schema
- [ ] Create plugin registry API
- [ ] Create plugin loader system
- [ ] Create API gateway

#### 3.2 Plugin System
- [ ] Create plugin interface
- [ ] Create plugin loader
- [ ] Create plugin gateway
- [ ] Create plugin authentication

#### 3.3 Existing Integrations to Plugins
- [ ] Convert Power BI to plugin
- [ ] Convert Grafana to plugin
- [ ] Convert Looker Studio to plugin
- [ ] Convert ServiceDesk to plugin
- [ ] Convert OpenMetadata to plugin

#### 3.4 Marketplace UI
- [ ] Create marketplace home page
- [ ] Create plugin details page
- [ ] Create installation wizard
- [ ] Create plugin management UI

### Phase 4: Infrastructure Management (Weeks 11-14)

#### 4.1 Infrastructure Foundation
- [ ] Create infrastructure database schema
- [ ] Create instance connector system
- [ ] Create service discovery system
- [ ] Create health check system

#### 4.2 Infrastructure UI
- [ ] Create infrastructure overview component
- [ ] Create instance details component
- [ ] Create services list component
- [ ] Create service management component

#### 4.3 Service Management Plugins
- [ ] Create MinIO management plugin
- [ ] Create Kong management plugin
- [ ] Create Redis management plugin
- [ ] Create PostgreSQL management plugin

#### 4.4 Integration
- [ ] Integrate with marketplace
- [ ] Test service discovery
- [ ] Test plugin assignment
- [ ] Test management UIs

### Phase 5: Enhancements (Weeks 15-18)

#### 5.1 Security Enhancements
- [ ] Implement audit logging
- [ ] Implement rate limiting
- [ ] Implement credential encryption
- [ ] Implement permission system

#### 5.2 Performance Enhancements
- [ ] Implement caching
- [ ] Implement query optimization
- [ ] Implement lazy loading
- [ ] Implement code splitting

#### 5.3 Monitoring & Observability
- [ ] Implement metrics collection
- [ ] Implement structured logging
- [ ] Implement error tracking
- [ ] Implement performance monitoring

#### 5.4 Real-time Features
- [ ] Implement WebSocket support
- [ ] Implement SSE support
- [ ] Implement real-time updates
- [ ] Implement live notifications

### Phase 6: Testing & Documentation (Weeks 19-20)

#### 6.1 Testing
- [ ] Unit tests for all features
- [ ] Integration tests for APIs
- [ ] E2E tests for critical flows
- [ ] Performance tests

#### 6.2 Documentation
- [ ] API documentation
- [ ] Component documentation
- [ ] Plugin development guide
- [ ] Deployment guide

### Phase 7: Migration & Cleanup (Weeks 21-22)

#### 7.1 Legacy Code Migration
- [ ] Migrate remaining components
- [ ] Remove duplicate code
- [ ] Update imports
- [ ] Clean up unused files

#### 7.2 API Migration
- [ ] Migrate all APIs to v1
- [ ] Update API documentation
- [ ] Deprecate old routes
- [ ] Remove old routes

#### 7.3 Final Cleanup
- [ ] Code review
- [ ] Performance optimization
- [ ] Security audit
- [ ] Final testing

---

## 📖 Implementation Guide

### Creating a New Feature Module

#### Step 1: Create Structure
```bash
mkdir -p src/features/[feature-name]/{components,hooks,lib}
touch src/features/[feature-name]/types.ts
```

#### Step 2: Create Main Component
```typescript
// src/features/[feature]/components/[Feature]List.tsx
'use client'

import { use[Feature] } from '../hooks/use[Feature]'

interface [Feature]ListProps {
  spaceId?: string | null
  showSpaceSelector?: boolean
}

export function [Feature]List({ spaceId = null, showSpaceSelector = false }: [Feature]ListProps) {
  const { items, loading } = use[Feature]({ spaceId })
  
  return (
    <div>
      {showSpaceSelector && <SpaceSelector />}
      {/* Component UI */}
    </div>
  )
}
```

#### Step 3: Create Hook
```typescript
// src/features/[feature]/hooks/use[Feature].ts
import { useSpace } from '@/contexts/space-context'
import { useQuery } from '@tanstack/react-query'

export function use[Feature](options: { spaceId?: string | null } = {}) {
  const { currentSpace } = useSpace()
  const spaceId = options.spaceId !== undefined ? options.spaceId : currentSpace?.id || null
  
  return useQuery({
    queryKey: ['[feature]', spaceId],
    queryFn: () => fetch[Feature]({ spaceId })
  })
}
```

#### Step 4: Create Page Routes
```typescript
// src/app/[space]/[feature]/page.tsx
import { [Feature]List } from '@/features/[feature]/components/[Feature]List'

export default function Space[Feature]Page() {
  return <[Feature]List spaceId={null} showSpaceSelector={false} />
}
```

### Creating a Management Plugin

#### Step 1: Create Plugin Structure
```bash
mkdir -p src/features/marketplace/plugins/[plugin-name]/{components,lib}
```

#### Step 2: Create Plugin Definition
```typescript
// src/features/marketplace/plugins/[plugin-name]/plugin.ts
export const [Plugin]Plugin = {
  id: '[plugin-name]',
  name: '[Plugin] Management',
  category: 'service-management',
  capabilities: {
    serviceNames: ['[service-name]']
  },
  ui: {
    managementComponent: '@/features/marketplace/plugins/[plugin-name]/components/[Plugin]ManagementUI'
  }
}
```

#### Step 3: Create Management UI
```typescript
// src/features/marketplace/plugins/[plugin-name]/components/[Plugin]ManagementUI.tsx
'use client'

export function [Plugin]ManagementUI({ service, instance, config }) {
  // Management UI implementation
  return <div>Management Interface</div>
}
```

#### Step 4: Register Plugin
```typescript
// Register in plugin registry
POST /api/marketplace/plugins
```

---

## 🔄 Migration Strategy

### Migration Principles

1. **Incremental** - Migrate one feature at a time
2. **Backward Compatible** - Old routes still work
3. **Tested** - Test each migration thoroughly
4. **Documented** - Document all changes

### Migration Steps

#### For Each Feature:

1. **Create Feature Module**
   - Create directory structure
   - Create types
   - Create base components

2. **Extract Components**
   - Identify shared components
   - Extract to feature module
   - Update imports

3. **Create Hooks**
   - Extract data fetching logic
   - Make space-aware
   - Add error handling

4. **Update Views**
   - Update space view to use shared component
   - Update admin view to use shared component
   - Test both views

5. **Clean Up**
   - Remove duplicate code
   - Update imports
   - Remove unused files

### Migration Checklist

- [ ] Feature module created
- [ ] Components extracted
- [ ] Hooks created
- [ ] Views updated
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Legacy code removed

---

## 📊 Success Metrics

### Code Quality
- **Code Duplication:** < 5%
- **Test Coverage:** > 80%
- **TypeScript Coverage:** 100%
- **Linter Errors:** 0

### Performance
- **Page Load Time:** < 2s
- **API Response Time:** < 500ms
- **Time to Interactive:** < 3s
- **Bundle Size:** Optimized

### User Experience
- **Consistent UI/UX** across all views
- **Fast Response Times**
- **Error Handling** - Graceful error messages
- **Accessibility** - WCAG 2.1 AA compliant

---

## 🎯 Next Steps

1. **Review Architecture** - Review this document with team
2. **Prioritize Features** - Decide which features to migrate first
3. **Set Timeline** - Create detailed timeline for each phase
4. **Assign Tasks** - Assign tasks to team members
5. **Start Implementation** - Begin Phase 1

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Maintained By:** Development Team

