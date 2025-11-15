# Migration Analysis: Infrastructure & Marketplace

## Current State Analysis

### Infrastructure Feature ✅
**Status:** ✅ **Already Properly Organized**

- ✅ Core infrastructure feature is in `src/features/infrastructure/`
- ✅ `src/app/admin/features/infrastructure/InfrastructureManagement.tsx` is just a thin wrapper
- ✅ Uses `InfrastructureOverview` from `@/features/infrastructure` (single-source)
- ✅ Routes are properly set up:
  - `/infrastructure` → Uses `InfrastructureOverview` directly
  - `/[space]/infrastructure` → Uses `InfrastructureOverview` with space context

**Conclusion:** ✅ **No migration needed** - Infrastructure is already properly organized.

### Marketplace Feature ✅
**Status:** ✅ **Already Properly Organized**

- ✅ Core marketplace feature is in `src/features/marketplace/`
- ✅ All plugins are in `src/features/marketplace/plugins/`
- ✅ Routes are properly set up:
  - `/marketplace` → Uses `MarketplaceHome` directly
  - `/[space]/marketplace` → Uses `MarketplaceHome` with space context

**Conclusion:** ✅ **No migration needed** - Marketplace is already properly organized.

### Integration Hub vs Marketplace ⚠️
**Status:** ⚠️ **Different Purposes - Keep Both**

The `IntegrationHub` in `src/app/admin/features/integration/` serves a different purpose than the Marketplace:

**IntegrationHub:**
- OAuth provider configuration
- Webhook integrations
- API client management
- General integration settings
- Legacy integration management

**Marketplace:**
- Plugin-based extensibility
- Service management plugins (MinIO, Kong, Redis, PostgreSQL)
- BI plugins (Power BI, Grafana, Looker Studio)
- Plugin installation and management
- Plugin reviews and ratings

**Conclusion:** ✅ **Keep both** - They serve different purposes:
- IntegrationHub = Configuration and OAuth/Webhook management
- Marketplace = Plugin ecosystem and service management

## Recommendations

### ✅ No Action Required

1. **Infrastructure** - Already properly organized
   - Core feature in `src/features/infrastructure/`
   - Admin wrapper is appropriate (thin wrapper pattern)

2. **Marketplace** - Already properly organized
   - Core feature in `src/features/marketplace/`
   - All plugins properly organized

3. **IntegrationHub** - Keep as-is
   - Serves different purpose than Marketplace
   - Handles OAuth, webhooks, API clients
   - Marketplace handles plugins

### 📋 Optional Cleanup (Future)

1. **IntegrationHub References**
   - The `IntegrationList` component mentions Power BI, Grafana, Looker
   - These are now marketplace plugins
   - Could add a note/link to marketplace for these integrations
   - Or keep as legacy configuration interface

2. **Documentation**
   - Document the difference between IntegrationHub and Marketplace
   - Clarify when to use each

## Summary

✅ **No code needs to be moved** - Everything is already properly organized according to the new architecture:
- Infrastructure feature is in `src/features/infrastructure/`
- Marketplace feature is in `src/features/marketplace/`
- IntegrationHub serves a different purpose and should remain

The architecture is clean and follows the single-source pattern correctly.

