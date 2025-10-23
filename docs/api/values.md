# Values API Documentation

## Overview

Values represent the actual data stored for entity attributes in the EAV system. Each value is associated with a specific entity and attribute, and contains the actual data based on the attribute's data type.

## Endpoints

### GET /api/eav/entities/[id]/values

Retrieve all values for a specific entity.

**Query Parameters:**
- `attribute` (string, optional): Filter by attribute name
- `dataType` (string, optional): Filter by data type
- `includeHistory` (boolean, optional): Include value history

**Response:**
```json
{
  "entityId": "uuid",
  "entityType": {
    "id": "uuid",
    "name": "customer",
    "displayName": "Customer"
  },
  "values": [
    {
      "id": "uuid",
      "attributeId": "uuid",
      "attribute": {
        "id": "uuid",
        "name": "first_name",
        "displayName": "First Name",
        "dataType": "TEXT",
        "isRequired": true,
        "isUnique": false
      },
      "textValue": "John",
      "numberValue": null,
      "booleanValue": null,
      "dateValue": null,
      "datetimeValue": null,
      "jsonValue": null,
      "blobValue": null,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    },
    {
      "id": "uuid",
      "attributeId": "uuid",
      "attribute": {
        "id": "uuid",
        "name": "is_vip",
        "displayName": "VIP Customer",
        "dataType": "BOOLEAN",
        "isRequired": false,
        "isUnique": false
      },
      "textValue": null,
      "numberValue": null,
      "booleanValue": true,
      "dateValue": null,
      "datetimeValue": null,
      "jsonValue": null,
      "blobValue": null,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "history": [
    {
      "id": "uuid",
      "entityId": "uuid",
      "attributeId": "uuid",
      "oldTextValue": "Jane",
      "newTextValue": "John",
      "changedBy": "uuid",
      "changeReason": "Data correction",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/eav/entities/[id]/values

Set values for an entity (replaces all existing values).

**Request Body:**
```json
{
  "values": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-0123",
    "is_vip": true,
    "credit_limit": 10000.00,
    "date_of_birth": "1985-03-15"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Values set successfully",
  "createdCount": 6,
  "updatedCount": 0,
  "deletedCount": 0
}
```

### PUT /api/eav/entities/[id]/values

Update specific values for an entity.

**Request Body:**
```json
{
  "values": {
    "phone": "+1-555-0124",
    "is_vip": false,
    "credit_limit": 15000.00
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Values updated successfully",
  "createdCount": 0,
  "updatedCount": 3,
  "deletedCount": 0
}
```

### DELETE /api/eav/entities/[id]/values

Delete all values for an entity.

**Response:**
```json
{
  "success": true,
  "message": "All values deleted successfully",
  "deletedCount": 6
}
```

### DELETE /api/eav/entities/[id]/values/[attributeName]

Delete a specific value for an entity.

**Response:**
```json
{
  "success": true,
  "message": "Value deleted successfully",
  "deletedCount": 1
}
```

## Value Data Types

### Text Values
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1-555-0123",
  "description": "Customer description"
}
```

### Number Values
```json
{
  "price": 29.99,
  "quantity": 5,
  "credit_limit": 10000.00,
  "discount_percentage": 15.5
}
```

### Boolean Values
```json
{
  "is_vip": true,
  "is_active": false,
  "in_stock": true,
  "is_verified": false
}
```

### Date Values
```json
{
  "date_of_birth": "1985-03-15",
  "order_date": "2024-01-15",
  "expiry_date": "2024-12-31"
}
```

### DateTime Values
```json
{
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "last_login": "2024-01-15T09:45:00Z"
}
```

### JSON Values
```json
{
  "metadata": {
    "source": "import",
    "tags": ["vip", "premium"],
    "preferences": {
      "notifications": true,
      "theme": "dark"
    }
  },
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zip": "12345"
  }
}
```

### Reference Values
```json
{
  "customer_id": "customer-uuid",
  "product_ids": ["product-uuid-1", "product-uuid-2"],
  "assigned_user": "user-uuid"
}
```

## Validation

### Required Attributes
All required attributes must be provided when setting values:

```json
{
  "error": "Validation Error",
  "message": "Required attribute 'email' is missing",
  "details": {
    "field": "values.email",
    "code": "REQUIRED_ATTRIBUTE_MISSING"
  }
}
```

### Data Type Validation
Values must match the attribute's data type:

```json
{
  "error": "Validation Error",
  "message": "Invalid data type for attribute 'price'",
  "details": {
    "field": "values.price",
    "code": "INVALID_DATA_TYPE",
    "expectedType": "NUMBER",
    "actualType": "TEXT"
  }
}
```

### Unique Constraint Validation
Unique attributes must have unique values:

```json
{
  "error": "Validation Error",
  "message": "Value for unique attribute 'email' already exists",
  "details": {
    "field": "values.email",
    "code": "UNIQUE_CONSTRAINT_VIOLATION"
  }
}
```

### Custom Validation Rules
Attributes can have custom validation rules:

```json
{
  "error": "Validation Error",
  "message": "Email format is invalid",
  "details": {
    "field": "values.email",
    "code": "INVALID_FORMAT",
    "rule": "email_format"
  }
}
```

## Value History

### Get Value History
```bash
curl -X GET "/api/eav/entities/entity-id/values?includeHistory=true"
```

### Value History Response
```json
{
  "history": [
    {
      "id": "uuid",
      "entityId": "uuid",
      "attributeId": "uuid",
      "attributeName": "first_name",
      "oldTextValue": "Jane",
      "newTextValue": "John",
      "changedBy": "user-uuid",
      "changeReason": "Data correction",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "uuid",
      "entityId": "uuid",
      "attributeId": "uuid",
      "attributeName": "is_vip",
      "oldBooleanValue": false,
      "newBooleanValue": true,
      "changedBy": "user-uuid",
      "changeReason": "Customer upgraded to VIP",
      "createdAt": "2024-01-15T11:00:00Z"
    }
  ]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "message": "Invalid value for attribute 'price'",
  "details": {
    "field": "values.price",
    "code": "INVALID_VALUE",
    "attribute": "price",
    "dataType": "NUMBER",
    "validationRules": {
      "min": 0,
      "max": 10000
    }
  }
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Entity not found",
  "code": "ENTITY_NOT_FOUND"
}
```

### 409 Conflict
```json
{
  "error": "Conflict",
  "message": "Value for unique attribute already exists",
  "code": "UNIQUE_CONSTRAINT_VIOLATION"
}
```

## Examples

### Set Customer Values
```bash
curl -X POST /api/eav/entities/customer-id/values \
  -H "Content-Type: application/json" \
  -d '{
    "values": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1-555-0123",
      "is_vip": true,
      "credit_limit": 10000.00,
      "date_of_birth": "1985-03-15"
    }
  }'
```

### Update Product Values
```bash
curl -X PUT /api/eav/entities/product-id/values \
  -H "Content-Type: application/json" \
  -d '{
    "values": {
      "price": 39.99,
      "in_stock": false,
      "metadata": {
        "supplier": "TechCorp",
        "warranty": "2 years"
      }
    }
  }'
```

### Set Order Values
```bash
curl -X POST /api/eav/entities/order-id/values \
  -H "Content-Type: application/json" \
  -d '{
    "values": {
      "order_number": "ORD-001",
      "order_date": "2024-01-15",
      "total_amount": 1329.98,
      "status": "completed",
      "shipping_address": "123 Main St, Anytown, USA 12345"
    }
  }'
```

### Get Values with History
```bash
curl -X GET "/api/eav/entities/customer-id/values?includeHistory=true&attribute=email"
```

### Delete Specific Value
```bash
curl -X DELETE /api/eav/entities/customer-id/values/phone
```
