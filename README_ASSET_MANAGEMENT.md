# Asset Management System

This document describes the asset management system that centralizes database types, system types, logos, and localizations.

## Overview

The asset management system provides a centralized way to manage:
- **Database Types**: PostgreSQL, MySQL, SQLite, MongoDB, Redis, etc.
- **System Types**: REST API, GraphQL, Webhooks, SFTP, S3, etc.
- **CMS Types**: WordPress, Drupal, Joomla, etc.
- **Languages**: Supported languages for localization
- **Localizations**: Translations for assets and asset types
- **Logos/Icons**: Visual assets for database types and systems

## Database Schema

### Models

1. **Language**: Supported languages (en, es, fr, de, etc.)
2. **AssetType**: Categories of assets (database_type, system_type, cms_type)
3. **Asset**: Individual assets (postgresql, mysql, api, etc.)
4. **Localization**: Translations for assets and types

## Setup

### 1. Run Migrations

```bash
npx prisma migrate dev --name add_asset_management
```

### 2. Seed Initial Data

```bash
npx tsx prisma/seed-assets.ts
```

This will create:
- 10 languages (English, Spanish, French, etc.)
- 3 asset types (database_type, system_type, cms_type)
- 8 database type assets (PostgreSQL, MySQL, SQLite, etc.)
- 5 system type assets (REST API, GraphQL, etc.)
- 3 CMS type assets (WordPress, Drupal, Joomla)

## Usage

### Using the Asset Management UI

Navigate to **Admin > System Settings > Assets** tab to:
- View and manage assets
- Upload logos for assets
- Manage languages
- Add localizations/translations

### Using Assets in Code

#### Fetch Database Types

```typescript
import { getDatabaseTypes } from '@/lib/assets'

const databaseTypes = await getDatabaseTypes()
// Returns: [{ id, code: 'postgresql', name: 'PostgreSQL', icon: '🐘', ... }, ...]
```

#### Use DatabaseTypeSelect Component

```tsx
import { DatabaseTypeSelect } from '@/components/assets/DatabaseTypeSelect'

<DatabaseTypeSelect
  value={selectedType}
  onValueChange={(value) => setSelectedType(value)}
  placeholder="Select database type"
/>
```

#### Fetch Specific Asset

```typescript
import { getAsset } from '@/lib/assets'

const postgresAsset = await getAsset('database_type', 'postgresql')
// Returns: { id, code: 'postgresql', name: 'PostgreSQL', icon: '🐘', ... }
```

## Migration Guide

### Before (Hardcoded)

```tsx
<Select>
  <SelectContent>
    <SelectItem value="postgresql">PostgreSQL</SelectItem>
    <SelectItem value="mysql">MySQL</SelectItem>
    <SelectItem value="sqlite">SQLite</SelectItem>
  </SelectContent>
</Select>
```

### After (Using Asset Management)

```tsx
import { DatabaseTypeSelect } from '@/components/assets/DatabaseTypeSelect'

<DatabaseTypeSelect
  value={dbType}
  onValueChange={setDbType}
/>
```

Or fetch dynamically:

```tsx
import { getDatabaseTypes } from '@/lib/assets'

const [databaseTypes, setDatabaseTypes] = useState([])

useEffect(() => {
  getDatabaseTypes().then(setDatabaseTypes)
}, [])

<Select>
  <SelectContent>
    {databaseTypes.map(type => (
      <SelectItem key={type.id} value={type.code}>
        {type.icon} {type.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

## API Endpoints

### Asset Types
- `GET /api/admin/assets/types` - List asset types
- `POST /api/admin/assets/types` - Create asset type

### Assets
- `GET /api/admin/assets?assetTypeCode=database_type` - List assets by type
- `POST /api/admin/assets` - Create asset
- `PUT /api/admin/assets/[id]` - Update asset
- `DELETE /api/admin/assets/[id]` - Delete asset

### Languages
- `GET /api/admin/assets/languages` - List languages
- `POST /api/admin/assets/languages` - Create language
- `PUT /api/admin/assets/languages/[id]` - Update language

### Localizations
- `GET /api/admin/assets/localizations` - List localizations
- `POST /api/admin/assets/localizations` - Create/update localization

### Logo Upload
- `POST /api/admin/assets/upload-logo` - Upload logo for asset

## Features

### Localization Support

Assets can be localized by language:

```typescript
// Fetch assets with Spanish translations
const assets = await getDatabaseTypes('es')
// Assets will have Spanish names if translations exist
```

### Logo Management

Upload logos for assets through the UI or API:
- Supported formats: PNG, JPG, GIF
- Max size: 2MB
- Stored in `/uploads/assets/logos/`

### System vs Custom Assets

- **System Assets**: Cannot be deleted, managed by seed data
- **Custom Assets**: Can be created, edited, and deleted by admins

## Best Practices

1. **Always use asset codes** instead of hardcoded strings
2. **Use the utility functions** from `@/lib/assets` for consistency
3. **Check `isActive`** before displaying assets
4. **Use localized names** when displaying to users
5. **Upload logos** for better visual identification

## Future Enhancements

- Asset versioning
- Asset metadata validation
- Bulk asset import/export
- Asset usage tracking
- Asset dependencies

