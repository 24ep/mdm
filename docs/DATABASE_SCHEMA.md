# Database Schema - Complete Reference

**Version:** 1.0  
**Last Updated:** 2025-01-XX

---

## 📋 Overview

This document describes all database tables required for the new architecture, including marketplace, infrastructure, and service management.

---

## 🗄️ Core Tables

### Existing Tables (No Changes)
- `users`
- `spaces`
- `space_members`
- `data_models`
- `tickets`
- `ticket_spaces`
- `reports`
- `dashboards`
- `workflows`
- `external_connections`

---

## 🛒 Marketplace Tables

### service_registry

Stores plugin/service definitions in the marketplace.

```sql
CREATE TABLE public.service_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    version VARCHAR(50) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    provider_url TEXT,
    category VARCHAR(100), -- 'business-intelligence', 'service-management', etc.
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'deprecated')),
    
    -- Capabilities
    capabilities JSONB DEFAULT '{}'::jsonb,
    
    -- API Configuration
    api_base_url TEXT,
    api_auth_type VARCHAR(50), -- 'oauth2', 'api_key', 'bearer', 'none'
    api_auth_config JSONB DEFAULT '{}'::jsonb,
    
    -- UI Configuration
    ui_type VARCHAR(50), -- 'iframe', 'react_component', 'web_component'
    ui_config JSONB DEFAULT '{}'::jsonb,
    
    -- Webhook Configuration
    webhook_supported BOOLEAN DEFAULT false,
    webhook_events TEXT[],
    
    -- Metadata
    icon_url TEXT,
    screenshots TEXT[],
    documentation_url TEXT,
    support_url TEXT,
    pricing_info JSONB,
    
    -- Installation Stats
    installation_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2),
    review_count INTEGER DEFAULT 0,
    
    -- Security
    verified BOOLEAN DEFAULT false,
    security_audit JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT unique_slug UNIQUE (slug)
);

CREATE INDEX idx_service_registry_category ON public.service_registry(category);
CREATE INDEX idx_service_registry_status ON public.service_registry(status);
CREATE INDEX idx_service_registry_verified ON public.service_registry(verified);
```

### service_installations

Tracks plugin installations per space.

```sql
CREATE TABLE public.service_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES public.service_registry(id) ON DELETE CASCADE,
    space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
    installed_by UUID REFERENCES public.users(id),
    
    -- Configuration
    config JSONB DEFAULT '{}'::jsonb,
    credentials JSONB DEFAULT '{}'::jsonb, -- Encrypted
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    last_health_check TIMESTAMPTZ,
    health_status VARCHAR(50),
    
    -- Permissions
    permissions JSONB DEFAULT '{}'::jsonb,
    
    installed_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    UNIQUE(service_id, space_id)
);

CREATE INDEX idx_service_installations_space ON public.service_installations(space_id);
CREATE INDEX idx_service_installations_service ON public.service_installations(service_id);
CREATE INDEX idx_service_installations_status ON public.service_installations(status);
```

### service_ui_components

Stores UI component configurations for plugins.

```sql
CREATE TABLE public.service_ui_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES public.service_registry(id) ON DELETE CASCADE,
    installation_id UUID REFERENCES public.service_installations(id) ON DELETE CASCADE,
    
    component_type VARCHAR(50), -- 'widget', 'page', 'sidebar', 'modal'
    component_name VARCHAR(255),
    component_id VARCHAR(255),
    
    -- Rendering Config
    render_type VARCHAR(50), -- 'iframe', 'react', 'web_component'
    render_config JSONB DEFAULT '{}'::jsonb,
    
    -- Placement
    placement VARCHAR(50), -- 'dashboard', 'sidebar', 'settings'
    placement_config JSONB DEFAULT '{}'::jsonb,
    
    -- Permissions
    required_permissions TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_service_ui_components_service ON public.service_ui_components(service_id);
CREATE INDEX idx_service_ui_components_installation ON public.service_ui_components(installation_id);
```

### service_api_routes

Stores API route configurations for plugins.

```sql
CREATE TABLE public.service_api_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES public.service_registry(id) ON DELETE CASCADE,
    installation_id UUID REFERENCES public.service_installations(id) ON DELETE CASCADE,
    
    route_path VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    target_url TEXT NOT NULL,
    
    -- Authentication
    auth_type VARCHAR(50),
    auth_config JSONB DEFAULT '{}'::jsonb,
    
    -- Rate Limiting
    rate_limit INTEGER,
    rate_limit_window INTEGER,
    
    -- Caching
    cache_enabled BOOLEAN DEFAULT false,
    cache_ttl INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_service_api_routes_service ON public.service_api_routes(service_id);
CREATE INDEX idx_service_api_routes_installation ON public.service_api_routes(installation_id);
```

---

## 🖥️ Infrastructure Tables

### infrastructure_instances

Stores infrastructure instances (VMs, Docker hosts, etc.).

```sql
CREATE TABLE public.infrastructure_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'vm', 'docker_host', 'kubernetes', 'cloud_instance'
    host VARCHAR(255) NOT NULL,
    port INTEGER,
    protocol VARCHAR(10) DEFAULT 'ssh',
    
    -- Connection
    connection_type VARCHAR(50), -- 'ssh', 'docker_api', 'kubernetes', 'http'
    connection_config JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    status VARCHAR(50) DEFAULT 'unknown', -- 'online', 'offline', 'error'
    last_health_check TIMESTAMPTZ,
    health_status JSONB DEFAULT '{}'::jsonb,
    
    -- Metadata
    os_type VARCHAR(50),
    os_version VARCHAR(50),
    resources JSONB, -- { cpu, memory, disk }
    tags TEXT[],
    
    -- Relations
    space_id UUID REFERENCES public.spaces(id),
    created_by UUID REFERENCES public.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_infrastructure_instances_space ON public.infrastructure_instances(space_id);
CREATE INDEX idx_infrastructure_instances_type ON public.infrastructure_instances(type);
CREATE INDEX idx_infrastructure_instances_status ON public.infrastructure_instances(status);
```

### instance_services

Stores services running on infrastructure instances.

```sql
CREATE TABLE public.instance_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES public.infrastructure_instances(id) ON DELETE CASCADE,
    
    -- Service Info
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'docker_container', 'systemd_service', 'application'
    status VARCHAR(50) DEFAULT 'unknown', -- 'running', 'stopped', 'error'
    
    -- Service Details
    service_config JSONB DEFAULT '{}'::jsonb,
    endpoints JSONB DEFAULT '[]'::jsonb,
    health_check_url TEXT,
    
    -- Management
    management_plugin_id UUID REFERENCES public.service_registry(id),
    management_config JSONB DEFAULT '{}'::jsonb,
    
    -- Discovery
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(instance_id, name, type)
);

CREATE INDEX idx_instance_services_instance ON public.instance_services(instance_id);
CREATE INDEX idx_instance_services_plugin ON public.instance_services(management_plugin_id);
CREATE INDEX idx_instance_services_status ON public.instance_services(status);
```

### service_management_assignments

Tracks management plugin assignments to services.

```sql
CREATE TABLE public.service_management_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_service_id UUID REFERENCES public.instance_services(id) ON DELETE CASCADE,
    plugin_id UUID REFERENCES public.service_registry(id) ON DELETE CASCADE,
    
    -- Assignment
    assigned_by UUID REFERENCES public.users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Configuration
    config JSONB DEFAULT '{}'::jsonb,
    credentials JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_used TIMESTAMPTZ,
    
    UNIQUE(instance_service_id, plugin_id)
);

CREATE INDEX idx_service_management_assignments_service ON public.service_management_assignments(instance_service_id);
CREATE INDEX idx_service_management_assignments_plugin ON public.service_management_assignments(plugin_id);
```

---

## 📊 Migration Scripts

### Create All Tables

```sql
-- Run in order:
-- 1. Marketplace tables
-- 2. Infrastructure tables
-- 3. Indexes
-- 4. Foreign keys
```

### Migration File Template

```sql
-- Migration: YYYYMMDDHHMMSS_description.sql

BEGIN;

-- Create tables
CREATE TABLE IF NOT EXISTS public.service_registry (...);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_service_registry_category ON public.service_registry(category);

-- Add foreign keys
ALTER TABLE public.service_installations 
ADD CONSTRAINT fk_service_installations_service 
FOREIGN KEY (service_id) REFERENCES public.service_registry(id) ON DELETE CASCADE;

COMMIT;
```

---

## 🔍 Common Queries

### Get All Plugins in Category

```sql
SELECT * FROM public.service_registry
WHERE category = 'business-intelligence'
AND status = 'approved'
AND deleted_at IS NULL;
```

### Get Installed Plugins for Space

```sql
SELECT sr.*, si.*
FROM public.service_installations si
JOIN public.service_registry sr ON sr.id = si.service_id
WHERE si.space_id = $1
AND si.status = 'active'
AND si.deleted_at IS NULL;
```

### Get Services on Instance

```sql
SELECT * FROM public.instance_services
WHERE instance_id = $1
ORDER BY discovered_at DESC;
```

### Get Services with Management Plugins

```sql
SELECT is.*, sr.name as plugin_name, sr.slug as plugin_slug
FROM public.instance_services is
JOIN public.service_registry sr ON sr.id = is.management_plugin_id
WHERE is.instance_id = $1
AND is.management_plugin_id IS NOT NULL;
```

---

## 🔐 Security Considerations

### Credential Storage

- Store credentials in Vault (preferred)
- Encrypt credentials in database if Vault not available
- Never log credentials
- Rotate credentials regularly

### Access Control

- Row-level security (RLS) on all tables
- Space-based filtering
- User-based permissions
- Audit logging for all changes

---

**Schema Version:** 1.0  
**Last Updated:** 2025-01-XX

