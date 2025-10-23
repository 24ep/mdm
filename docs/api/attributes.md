# Attributes API Documentation

## Overview

Attributes define the fields and properties for entity types in the EAV system. Each attribute specifies the data type, validation rules, and display properties for entity values.

## Endpoints

### GET /api/eav/attributes

Retrieve all attributes with optional filtering.

**Query Parameters:**
- `entityTypeId` (string, optional): Filter by entity type ID
- `entityType` (string, optional): Filter by entity type name
- `dataType` (string, optional): Filter by data type
- `isRequired` (boolean, optional): Filter by required status
- `isActive` (boolean, optional): Filter by active status
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
      "name": "first_name",
      "displayName": "First Name",
      "entityTypeId": "uuid",
      "entityType": {
        "id": "uuid",
        "name": "customer",
        "displayName": "Customer"
      },
      "dataType": "TEXT",
      "isRequired": true,
      "isUnique": false,
      "isIndexed": true,
      "isSearchable": true,
      "isAuditable": true,
      "sortOrder": 1,
      "isVisible": true,
      "isEditable": true,
      "isActive": true,
      "validationRules": {
        "minLength": 2,
        "maxLength": 50
      },
      "defaultValue": null,
      "attributeGroupId": "uuid",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### POST /api/eav/attributes

Create a new attribute.

**Request Body:**
```json
{
  "name": "email",
  "displayName": "Email Address",
  "entityTypeId": "uuid",
  "dataType": "EMAIL",
  "isRequired": true,
  "isUnique": true,
  "isIndexed": true,
  "isSearchable": true,
  "isAuditable": true,
  "sortOrder": 3,
  "isVisible": true,
  "isEditable": true,
  "isActive": true,
  "validationRules": {
    "format": "email",
    "maxLength": 255
  },
  "defaultValue": null,
  "attributeGroupId": "uuid"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "email",
  "displayName": "Email Address",
  "entityTypeId": "uuid",
  "dataType": "EMAIL",
  "isRequired": true,
  "isUnique": true,
  "isIndexed": true,
  "isSearchable": true,
  "isAuditable": true,
  "sortOrder": 3,
  "isVisible": true,
  "isEditable": true,
  "isActive": true,
  "validationRules": {
    "format": "email",
    "maxLength": 255
  },
  "defaultValue": null,
  "attributeGroupId": "uuid",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### GET /api/eav/attributes/[id]

Retrieve a specific attribute by ID.

**Response:**
```json
{
  "id": "uuid",
  "name": "email",
  "displayName": "Email Address",
  "entityTypeId": "uuid",
  "entityType": {
    "id": "uuid",
    "name": "customer",
    "displayName": "Customer"
  },
  "dataType": "EMAIL",
  "isRequired": true,
  "isUnique": true,
  "isIndexed": true,
  "isSearchable": true,
  "isAuditable": true,
  "sortOrder": 3,
  "isVisible": true,
  "isEditable": true,
  "isActive": true,
  "validationRules": {
    "format": "email",
    "maxLength": 255
  },
  "defaultValue": null,
  "attributeGroupId": "uuid",
  "attributeGroup": {
    "id": "uuid",
    "name": "contact_info",
    "displayName": "Contact Information"
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### PUT /api/eav/attributes/[id]

Update an existing attribute.

**Request Body:**
```json
{
  "displayName": "Email Address",
  "isRequired": true,
  "validationRules": {
    "format": "email",
    "maxLength": 255,
    "required": true
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "email",
  "displayName": "Email Address",
  "entityTypeId": "uuid",
  "dataType": "EMAIL",
  "isRequired": true,
  "isUnique": true,
  "isIndexed": true,
  "isSearchable": true,
  "isAuditable": true,
  "sortOrder": 3,
  "isVisible": true,
  "isEditable": true,
  "isActive": true,
  "validationRules": {
    "format": "email",
    "maxLength": 255,
    "required": true
  },
  "defaultValue": null,
  "attributeGroupId": "uuid",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### DELETE /api/eav/attributes/[id]

Delete an attribute (soft delete).

**Response:**
```json
{
  "success": true,
  "message": "Attribute deleted successfully"
}
```

## Data Types

### Text Types
- `TEXT` - Short text strings
- `TEXTAREA` - Long text content
- `EMAIL` - Email addresses
- `PHONE` - Phone numbers
- `URL` - Web URLs

### Numeric Types
- `NUMBER` - Decimal numbers
- `CURRENCY` - Currency values
- `PERCENTAGE` - Percentage values

### Date/Time Types
- `DATE` - Date values
- `DATETIME` - Date and time values

### Boolean Types
- `BOOLEAN` - True/false values

### Selection Types
- `SELECT` - Single selection from options
- `MULTI_SELECT` - Multiple selections

### Reference Types
- `REFERENCE` - Reference to another entity
- `REFERENCE_MULTI` - Multiple entity references
- `USER` - User reference
- `USER_MULTI` - Multiple user references

### Other Types
- `JSON` - JSON data
- `BLOB` - Binary data
- `FILE` - File references

## Validation Rules

### Common Validation Rules
```json
{
  "required": true,
  "minLength": 2,
  "maxLength": 255,
  "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
  "min": 0,
  "max": 100,
  "format": "email|phone|url|date"
}
```

### Data Type Specific Rules

#### TEXT/TEXTAREA
- `minLength` - Minimum character length
- `maxLength` - Maximum character length
- `pattern` - Regular expression pattern

#### NUMBER/CURRENCY/PERCENTAGE
- `min` - Minimum value
- `max` - Maximum value
- `precision` - Decimal places

#### DATE/DATETIME
- `minDate` - Minimum date
- `maxDate` - Maximum date
- `format` - Date format

#### SELECT/MULTI_SELECT
- `options` - Array of available options
- `allowCustom` - Allow custom values

#### REFERENCE/REFERENCE_MULTI
- `entityTypeId` - Target entity type
- `maxSelections` - Maximum number of selections

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "message": "Invalid data type for attribute",
  "details": {
    "field": "dataType",
    "code": "INVALID_DATA_TYPE",
    "allowedValues": ["TEXT", "NUMBER", "BOOLEAN", "DATE"]
  }
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Attribute not found",
  "code": "ATTRIBUTE_NOT_FOUND"
}
```

### 409 Conflict
```json
{
  "error": "Conflict",
  "message": "Attribute with this name already exists for entity type",
  "code": "DUPLICATE_ATTRIBUTE_NAME"
}
```

## Examples

### Create a Text Attribute
```bash
curl -X POST /api/eav/attributes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "first_name",
    "displayName": "First Name",
    "entityTypeId": "customer-entity-type-id",
    "dataType": "TEXT",
    "isRequired": true,
    "validationRules": {
      "minLength": 2,
      "maxLength": 50
    }
  }'
```

### Create an Email Attribute
```bash
curl -X POST /api/eav/attributes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "email",
    "displayName": "Email Address",
    "entityTypeId": "customer-entity-type-id",
    "dataType": "EMAIL",
    "isRequired": true,
    "isUnique": true,
    "validationRules": {
      "maxLength": 255
    }
  }'
```

### Create a Select Attribute
```bash
curl -X POST /api/eav/attributes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "status",
    "displayName": "Status",
    "entityTypeId": "order-entity-type-id",
    "dataType": "SELECT",
    "isRequired": true,
    "validationRules": {
      "options": ["pending", "processing", "shipped", "delivered", "cancelled"]
    }
  }'
```

### Get Attributes for Entity Type
```bash
curl -X GET "/api/eav/attributes?entityType=customer&sort=sortOrder&order=asc"
```
