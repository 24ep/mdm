# Entity Types API Documentation

## Overview

Entity Types define the structure and metadata for different types of entities in the EAV system. Each entity type represents a category of data (e.g., Customer, Product, Order).

## Endpoints

### GET /api/eav/entity-types

Retrieve all entity types.

**Query Parameters:**
- `active` (boolean, optional): Filter by active status
- `search` (string, optional): Search by name or display name
- `sort` (string, optional): Sort field (name, display_name, sort_order, created_at)
- `order` (string, optional): Sort order (asc, desc)
- `limit` (number, optional): Number of results to return
- `offset` (number, optional): Number of results to skip

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "customer",
      "displayName": "Customer",
      "description": "Customer information",
      "isActive": true,
      "sortOrder": 1,
      "metadata": {
        "icon": "user",
        "color": "blue",
        "category": "business"
      },
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### POST /api/eav/entity-types

Create a new entity type.

**Request Body:**
```json
{
  "name": "customer",
  "displayName": "Customer",
  "description": "Customer information and details",
  "isActive": true,
  "sortOrder": 1,
  "metadata": {
    "icon": "user",
    "color": "blue",
    "category": "business"
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "customer",
  "displayName": "Customer",
  "description": "Customer information and details",
  "isActive": true,
  "sortOrder": 1,
  "metadata": {
    "icon": "user",
    "color": "blue",
    "category": "business"
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### GET /api/eav/entity-types/[id]

Retrieve a specific entity type by ID.

**Response:**
```json
{
  "id": "uuid",
  "name": "customer",
  "displayName": "Customer",
  "description": "Customer information",
  "isActive": true,
  "sortOrder": 1,
  "metadata": {
    "icon": "user",
    "color": "blue"
  },
  "attributes": [
    {
      "id": "uuid",
      "name": "first_name",
      "displayName": "First Name",
      "dataType": "TEXT",
      "isRequired": true,
      "isUnique": false,
      "sortOrder": 1
    }
  ],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### PUT /api/eav/entity-types/[id]

Update an existing entity type.

**Request Body:**
```json
{
  "displayName": "Customer Information",
  "description": "Updated customer description",
  "metadata": {
    "icon": "user-circle",
    "color": "blue",
    "category": "business"
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "customer",
  "displayName": "Customer Information",
  "description": "Updated customer description",
  "isActive": true,
  "sortOrder": 1,
  "metadata": {
    "icon": "user-circle",
    "color": "blue",
    "category": "business"
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### DELETE /api/eav/entity-types/[id]

Delete an entity type (soft delete).

**Response:**
```json
{
  "success": true,
  "message": "Entity type deleted successfully"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "message": "Name is required",
  "details": {
    "field": "name",
    "code": "REQUIRED"
  }
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Entity type not found",
  "code": "ENTITY_TYPE_NOT_FOUND"
}
```

### 409 Conflict
```json
{
  "error": "Conflict",
  "message": "Entity type with this name already exists",
  "code": "DUPLICATE_NAME"
}
```

## Validation Rules

### Name
- Required
- Must be unique
- 3-100 characters
- Only lowercase letters, numbers, and underscores
- Must start with a letter

### Display Name
- Required
- 1-200 characters
- Human-readable name

### Description
- Optional
- Maximum 1000 characters

### Metadata
- Optional JSON object
- Common fields: icon, color, category
- Can contain any valid JSON structure

## Examples

### Create a Product Entity Type
```bash
curl -X POST /api/eav/entity-types \
  -H "Content-Type: application/json" \
  -d '{
    "name": "product",
    "displayName": "Product",
    "description": "Product catalog items",
    "metadata": {
      "icon": "package",
      "color": "green",
      "category": "inventory"
    }
  }'
```

### Get Entity Types with Filtering
```bash
curl -X GET "/api/eav/entity-types?active=true&search=customer&sort=name&order=asc&limit=10"
```

### Update Entity Type Metadata
```bash
curl -X PUT /api/eav/entity-types/customer-id \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": {
      "icon": "user-circle",
      "color": "blue",
      "category": "business",
      "tags": ["customer", "person"]
    }
  }'
```
