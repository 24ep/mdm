# Data Entities Guide

## Overview

The Data Entities feature allows you to view and manage records for dynamic data models. When you click on a data entity in the sidebar, it will show all records for that specific model in a table format.

## Features

### 1. Dynamic Table Columns
- Table columns are automatically generated based on the model's attributes
- Each attribute becomes a column in the table
- Column headers show the attribute's display name

### 2. Advanced Filtering
- **Global Search**: Search across all attribute values
- **Column-specific Filters**: Each column has its own filter based on attribute type:
  - **Text/Number fields**: Text input for partial matching
  - **Select fields**: Dropdown with all available options
  - **Boolean fields**: Yes/No/All options
  - **Date fields**: Date range filtering (future enhancement)

### 3. Sorting
- Click on any column header to sort by that attribute
- First click: Ascending order
- Second click: Descending order  
- Third click: Remove sorting
- Visual indicators show current sort direction

### 4. Pagination
- Configurable page size (default: 20 records)
- Page navigation with numbered pages
- Shows current page and total results
- Previous/Next navigation buttons

### 5. Record Management
- View all records for the selected model
- Edit individual records (future enhancement)
- Delete records (future enhancement)
- Add new records (future enhancement)

## How to Use

### 1. Access Data Entities
1. Look for the "Data Entities" section in the sidebar
2. Click on any pinned data model
3. The page will load showing all records for that model

### 2. Filter Records
1. Use the global search box to search across all fields
2. Use column-specific filters to narrow down results
3. Click "Clear Filters" to reset all filters

### 3. Sort Records
1. Click on any column header to sort by that field
2. Click again to reverse the sort order
3. Click a third time to remove sorting

### 4. Navigate Pages
1. Use the pagination controls at the bottom
2. Click page numbers to jump to specific pages
3. Use Previous/Next buttons for sequential navigation

## Technical Details

### API Endpoints
- `GET /api/data-records?data_model_id={id}` - Get records with filtering, sorting, and pagination
- `GET /api/data-models/{id}` - Get model information
- `GET /api/data-models/{id}/attributes` - Get model attributes

### Query Parameters
- `data_model_id` - Required. The ID of the data model
- `page` - Page number (default: 1)
- `limit` - Records per page (default: 20)
- `search` - Global search term
- `sort_by` - Attribute name to sort by
- `sort_direction` - 'asc' or 'desc'
- `filter_{attribute_name}` - Filter by specific attribute value

### Data Structure
Records are returned with a `values` object containing all attribute values:
```json
{
  "id": "record-uuid",
  "data_model_id": "model-uuid", 
  "created_at": "2024-01-01T00:00:00Z",
  "values": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  }
}
```

## Future Enhancements

1. **Inline Editing**: Edit records directly in the table
2. **Bulk Operations**: Select multiple records for batch operations
3. **Export Functionality**: Export filtered results to CSV/Excel
4. **Advanced Filters**: Date ranges, numeric ranges, etc.
5. **Column Customization**: Show/hide columns, reorder columns
6. **Record Creation**: Add new records through the interface
7. **Data Validation**: Real-time validation based on attribute rules

## Troubleshooting

### No Records Showing
- Check if the data model has any records
- Verify the model is active
- Check if records are marked as active

### Filters Not Working
- Ensure attribute names match exactly
- Check if attribute values exist
- Try clearing filters and reapplying

### Performance Issues
- Large datasets may take time to load
- Consider using more specific filters
- Pagination helps with performance

### Missing Attributes
- Verify the model has attributes defined
- Check if attributes are active
- Ensure proper data model configuration
