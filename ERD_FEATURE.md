# ERD (Entity Relationship Diagram) Feature

## Overview

The ERD feature provides an interactive Entity Relationship Diagram view for data model management. Users can visualize their data models, configure relationships, and manage attributes through an intuitive drag-and-drop interface.

## Features

### 🎯 Core Functionality

- **Interactive ERD Diagram**: Visual representation of data models and their relationships
- **Drag & Drop**: Move models around the canvas and create relationships by connecting attributes
- **Attribute Management**: Click on attributes to configure their properties
- **Relationship Configuration**: Create and manage relationships between models
- **Auto Layout**: Automatically arrange models in a grid layout
- **Save Layout**: Persist model positions and relationships

### 🔧 Technical Features

- **Real-time Updates**: Changes are reflected immediately in the diagram
- **Zoom Controls**: Zoom in/out for better visibility
- **Grid Toggle**: Show/hide background grid for alignment
- **Responsive Design**: Works on different screen sizes
- **Keyboard Shortcuts**: Quick access to common actions

## File Structure

```
src/
├── components/erd/
│   ├── ERDDiagram.tsx          # Main ERD diagram component
│   └── ERDNavigation.tsx       # Navigation and stats components
├── app/
│   ├── data/models/erd/
│   │   └── page.tsx            # ERD view page
│   └── api/
│       ├── data-models/
│       │   ├── [id]/attributes/[attrId]/
│       │   │   └── route.ts    # Attribute CRUD operations
│       │   ├── relationships/
│       │   │   └── route.ts    # Relationship management
│       │   └── layout/
│       │       └── route.ts    # Layout persistence
└── supabase/migrations/
    └── 032_add_erd_position_fields.sql  # Database schema updates
```

## Usage

### Accessing the ERD View

1. Navigate to **Data Models** page (`/data/models`)
2. Click the **"ERD View"** button in the top-right corner
3. Or directly visit `/data/models/erd`

### Working with the ERD

#### Moving Models
- Click and drag any model card to reposition it on the canvas
- Models maintain their position when you save the layout

#### Creating Relationships
1. Click on an attribute in the source model
2. Drag to the target attribute in the destination model
3. Configure the relationship type and label in the dialog

#### Editing Attributes
1. Click on any attribute in a model
2. Modify properties in the attribute configuration dialog:
   - Name and display name
   - Data type
   - Required/Unique flags
   - Primary/Foreign key settings
   - Referenced table/column for foreign keys

#### Managing the Layout
- **Auto Layout**: Automatically arranges models in a grid
- **Save Layout**: Persists current positions to the database
- **Zoom**: Use +/- buttons to zoom in/out
- **Grid Toggle**: Show/hide background grid

## API Endpoints

### Attribute Management
- `GET /api/data-models/[id]/attributes/[attrId]` - Get attribute details
- `PUT /api/data-models/[id]/attributes/[attrId]` - Update attribute
- `DELETE /api/data-models/[id]/attributes/[attrId]` - Delete attribute

### Relationship Management
- `GET /api/data-models/relationships` - Get all relationships
- `POST /api/data-models/relationships` - Create new relationship
- `PUT /api/data-models/relationships` - Update relationship
- `DELETE /api/data-models/relationships` - Delete relationship

### Layout Management
- `GET /api/data-models/layout` - Get saved layout
- `POST /api/data-models/layout` - Save layout

## Database Schema

### New Fields Added to `data_models` Table
```sql
ALTER TABLE public.data_models 
ADD COLUMN erd_position_x INTEGER DEFAULT 100,
ADD COLUMN erd_position_y INTEGER DEFAULT 100;
```

### Relationship Detection
Relationships are automatically detected from foreign key attributes:
- Attributes with `is_foreign_key = true`
- `referenced_table` and `referenced_column` fields
- Automatically creates one-to-many relationships

## Component Architecture

### ERDDiagram Component
- **Props**: Models, relationship handlers, attribute handlers
- **State**: Selected items, dialog states, drag states
- **Features**: Drag & drop, zoom, relationship creation

### ERDNavigation Component
- **Props**: Stats, action handlers
- **Features**: Navigation, controls, statistics display

### AttributeForm Component
- **Props**: Model, attribute, save/cancel handlers
- **Features**: Attribute configuration, validation

### RelationshipForm Component
- **Props**: Relationship, models, save/cancel handlers
- **Features**: Relationship configuration

## Styling and UI

- **Design System**: Uses existing UI components (Card, Button, Dialog, etc.)
- **Color Coding**: Different colors for different attribute types
- **Icons**: Lucide React icons for visual clarity
- **Responsive**: Adapts to different screen sizes
- **Accessibility**: Keyboard navigation and screen reader support

## Future Enhancements

### Planned Features
- [ ] Custom relationship types beyond one-to-many
- [ ] Relationship cardinality indicators
- [ ] Model grouping and clustering
- [ ] Export to image/PDF
- [ ] Collaborative editing
- [ ] Version history for layouts
- [ ] Advanced filtering and search
- [ ] Model templates and patterns

### Technical Improvements
- [ ] Performance optimization for large diagrams
- [ ] Real-time collaboration
- [ ] Offline support
- [ ] Advanced layout algorithms
- [ ] Custom relationship visualization

## Troubleshooting

### Common Issues

1. **Models not loading**: Check API endpoints and database connections
2. **Relationships not showing**: Verify foreign key attributes are properly configured
3. **Layout not saving**: Check database permissions and API responses
4. **Drag & drop not working**: Ensure JavaScript is enabled and no console errors

### Debug Mode
Enable debug logging by adding `?debug=true` to the URL to see detailed console output.

## Contributing

When adding new features to the ERD:

1. Follow the existing component structure
2. Use TypeScript interfaces for type safety
3. Add proper error handling
4. Include accessibility features
5. Write tests for new functionality
6. Update this documentation

## Dependencies

- React 18+
- Next.js 14+
- Tailwind CSS
- Lucide React (icons)
- Custom UI components
- Supabase (database)
