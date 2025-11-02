# Supported Chart Types

This document lists all chart types supported in the layout-config widget system.

## Fully Implemented Chart Types

### Basic Charts
- **BAR** - Bar Chart (`bar-chart`)
- **LINE** - Line Chart (`line-chart`)
- **AREA** - Area Chart (`area-chart`)
- **PIE** - Pie Chart (`pie-chart`)
- **DONUT** - Donut Chart (`donut-chart`)
- **SCATTER** - Scatter Plot (`scatter-chart`)

### Advanced Charts
- **RADAR** - Radar Chart (`radar-chart`)
- **GAUGE** - Gauge Chart (`gauge-chart`)
- **FUNNEL** - Funnel Chart (`funnel-chart`)
- **WATERFALL** - Waterfall Chart (`waterfall-chart`)
- **TREEMAP** - Treemap Chart (`treemap-chart`)
- **HEATMAP** - Heatmap Chart (`heatmap-chart`)
- **BUBBLE_MAP** - Bubble Map Chart (`bubble-chart`)
- **COMPOSED** - Combo Chart (`combo-chart`)

## Chart Type Mapping

Chart types from the widget palette are mapped to ChartRenderer chart types as follows:

| Widget Type | ChartRenderer Type |
|------------|-------------------|
| `bar-chart` | `BAR` |
| `line-chart` | `LINE` |
| `area-chart` | `AREA` |
| `pie-chart` | `PIE` |
| `donut-chart` | `DONUT` |
| `scatter-chart` | `SCATTER` |
| `radar-chart` | `RADAR` |
| `gauge-chart` | `GAUGE` |
| `funnel-chart` | `FUNNEL` |
| `waterfall-chart` | `WATERFALL` |
| `treemap-chart` | `TREEMAP` |
| `heatmap-chart` | `HEATMAP` |
| `bubble-chart` | `BUBBLE_MAP` |
| `combo-chart` | `COMPOSED` |

## Data Requirements

### Required Properties
- **dataSource**: Must be set to `'sample'` for sample data
- **sampleData**: Array of objects with chart data
- **dimensions**: Array of dimension field names (e.g., `['name', 'category']`)
- **measures**: Array of measure field names (e.g., `['value', 'sales']`)

### Sample Data Format
```json
[
  { "name": "Jan", "value": 1200 },
  { "name": "Feb", "value": 1500 },
  { "name": "Mar", "value": 1800 }
]
```

### Chart-Specific Requirements

#### Pie/Donut Charts
- Requires at least 1 dimension and 1 measure
- Dimensions: Category names (e.g., `['name']`)
- Measures: Values to display (e.g., `['value']`)

#### Scatter Charts
- Requires at least 2 dimensions and 1 measure
- Dimensions: X and Y coordinates (e.g., `['x', 'y']`)
- Measures: Size/color value (e.g., `['value']`)

#### Heatmap Charts
- Requires grid-like data with x, y, and value
- Dimensions: X and Y categories (e.g., `['x', 'y']`)
- Measures: Value to color-map (e.g., `['value']`)

#### Bubble Maps
- Requires geographic-like data
- Dimensions: Latitude and longitude (e.g., `['lat', 'lng']`)
- Measures: Bubble size value (e.g., `['value']`)

## Error Handling

All chart rendering is wrapped in error boundaries that will:
1. Catch rendering errors
2. Display a fallback UI with error message
3. Log errors to console for debugging

Invalid data structures will show appropriate error messages in the data source editor.

