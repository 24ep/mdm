import { 
  BarChart3, 
  PieChart, 
  LineChart, 
  TrendingUp,
  Table,
  Type,
  Image,
  Filter,
  Map,
  Gauge,
  Grid3X3,
  Move,
  Trash2,
  Copy,
  Undo,
  Redo,
  Download,
  Share2,
  Plus,
  Minus,
  RotateCcw,
  Play,
  Pause,
  RefreshCw,
  Activity,
  Target,
  Zap,
  Layers,
  BarChart,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  AreaChart,
  Radar,
  Box,
  TreePine,
  Thermometer,
  Clock,
  Calendar,
  Globe,
  MapPin,
  Users,
  DollarSign,
  Percent,
  TrendingDown,
  MinusCircle,
  PlusCircle,
  ChevronDown,
  ChevronRight,
  Download as DownloadIcon,
  FileText,
  FileSpreadsheet,
  FileImage,
  Share2 as Share2Icon,
  Link,
  Code,
  Users as UsersIcon,
  Lock,
  Globe as GlobeIcon,
  Copy as CopyIcon,
  Check,
  Undo as UndoIcon,
  Redo as RedoIcon,
  History,
  Palette,
  Layout,
  Search,
  Youtube,
  Video,
  Code2,
  Square,
  Circle as CircleIcon,
  Minus as MinusIcon,
  ArrowRight,
  Triangle,
  Star,
  Hexagon
} from 'lucide-react'
import { ToolboxGroup } from '../types'

export const TOOLBOX_GROUPS: ToolboxGroup[] = [
  {
    id: 'basic-charts',
    name: 'Basic Charts',
    icon: BarChart3,
    items: [
      {
        id: 'bar-chart',
        name: 'Bar Chart',
        icon: BarChart3,
        type: 'CHART',
        chart_type: 'BAR',
        description: 'Compare values across categories',
        defaultSize: { width: 6, height: 4 }
      },
      {
        id: 'horizontal-bar',
        name: 'Horizontal Bar',
        icon: BarChart,
        type: 'CHART',
        chart_type: 'HORIZONTAL_BAR',
        description: 'Horizontal bar chart for long labels',
        defaultSize: { width: 6, height: 4 }
      },
      {
        id: 'line-chart',
        name: 'Line Chart',
        icon: LineChart,
        type: 'CHART',
        chart_type: 'LINE',
        description: 'Show trends over time',
        defaultSize: { width: 6, height: 4 }
      },
      {
        id: 'area-chart',
        name: 'Area Chart',
        icon: AreaChart,
        type: 'CHART',
        chart_type: 'AREA',
        description: 'Show trends with filled areas',
        defaultSize: { width: 6, height: 4 }
      },
      {
        id: 'pie-chart',
        name: 'Pie Chart',
        icon: PieChart,
        type: 'CHART',
        chart_type: 'PIE',
        description: 'Show parts of a whole',
        defaultSize: { width: 4, height: 4 }
      },
      {
        id: 'donut-chart',
        name: 'Donut Chart',
        icon: PieChartIcon,
        type: 'CHART',
        chart_type: 'DONUT',
        description: 'Pie chart with center hole',
        defaultSize: { width: 4, height: 4 }
      }
    ]
  },
  {
    id: 'kpi-metrics',
    name: 'KPI & Metrics',
    icon: TrendingUp,
    items: [
      {
        id: 'kpi-card',
        name: 'KPI Card',
        icon: TrendingUp,
        type: 'KPI',
        description: 'Display key performance indicators',
        defaultSize: { width: 3, height: 2 }
      },
      {
        id: 'metric-card',
        name: 'Metric Card',
        icon: Target,
        type: 'METRIC',
        description: 'Single value with trend',
        defaultSize: { width: 3, height: 2 }
      },
      {
        id: 'progress-bar',
        name: 'Progress Bar',
        icon: Activity,
        type: 'PROGRESS',
        description: 'Show completion percentage',
        defaultSize: { width: 4, height: 1 }
      },
      {
        id: 'gauge',
        name: 'Gauge',
        icon: Gauge,
        type: 'GAUGE',
        description: 'Show progress or status',
        defaultSize: { width: 3, height: 3 }
      }
    ]
  },
  {
    id: 'data-display',
    name: 'Data Display',
    icon: Table,
    items: [
      {
        id: 'data-table',
        name: 'Data Table',
        icon: Table,
        type: 'TABLE',
        description: 'Display data in tabular format',
        defaultSize: { width: 8, height: 6 }
      },
      {
        id: 'pivot-table',
        name: 'Pivot Table',
        icon: Table,
        type: 'PIVOT_TABLE',
        description: 'Interactive data summarization',
        defaultSize: { width: 8, height: 6 }
      }
    ]
  },
  {
    id: 'content-elements',
    name: 'Content Elements',
    icon: Type,
    items: [
      {
        id: 'text-block',
        name: 'Text Block',
        icon: Type,
        type: 'TEXT',
        description: 'Add text, titles, or descriptions',
        defaultSize: { width: 4, height: 2 }
      },
      {
        id: 'image',
        name: 'Image',
        icon: Image,
        type: 'IMAGE',
        description: 'Display images or logos',
        defaultSize: { width: 4, height: 3 }
      }
    ]
  },
  {
    id: 'advanced-charts',
    name: 'Advanced Charts',
    icon: Layers,
    items: [
      { id: 'scatter-plot', name: 'Scatter Plot', icon: AreaChart, type: 'CHART', chart_type: 'SCATTER', description: 'Correlate two measures with optional size', defaultSize: { width: 6, height: 4 } },
      { id: 'radar-chart', name: 'Radar Chart', icon: Radar, type: 'CHART', chart_type: 'RADAR', description: 'Compare across categories radially', defaultSize: { width: 5, height: 5 } },
      { id: 'funnel-chart', name: 'Funnel', icon: Filter, type: 'CHART', chart_type: 'FUNNEL', description: 'Visualize stages conversion', defaultSize: { width: 5, height: 4 } },
      { id: 'waterfall-chart', name: 'Waterfall', icon: TrendingUp, type: 'CHART', chart_type: 'WATERFALL', description: 'Incremental gains/losses over a total', defaultSize: { width: 6, height: 4 } },
      { id: 'box-plot', name: 'Box Plot', icon: Box, type: 'CHART', chart_type: 'BOX_PLOT', description: 'Distribution with quartiles', defaultSize: { width: 5, height: 4 } }
    ]
  },
  {
    id: 'maps-geospatial',
    name: 'Maps & Geo',
    icon: Map,
    items: [
      { id: 'choropleth-map', name: 'Choropleth Map', icon: Globe, type: 'MAP', chart_type: 'CHOROPLETH', description: 'Color-coded regions by value', defaultSize: { width: 8, height: 6 } },
      { id: 'bubble-map', name: 'Bubble Map', icon: MapPin, type: 'MAP', chart_type: 'BUBBLE_MAP', description: 'Point locations sized by value', defaultSize: { width: 8, height: 6 } }
    ]
  },
  {
    id: 'controls',
    name: 'Controls',
    icon: Filter,
    items: [
      { id: 'date-range', name: 'Date Range', icon: Calendar, type: 'CONTROL', chart_type: 'DATE_RANGE', description: 'Filter by date interval', defaultSize: { width: 4, height: 2 } },
      { id: 'dropdown-filter', name: 'Dropdown Filter', icon: ChevronDown, type: 'CONTROL', chart_type: 'DROPDOWN_FILTER', description: 'Select a category to filter', defaultSize: { width: 3, height: 2 } },
      { id: 'search-box', name: 'Search Box', icon: Search, type: 'CONTROL', chart_type: 'SEARCH_BOX', description: 'Keyword search filter', defaultSize: { width: 4, height: 2 } },
      { id: 'global-filter', name: 'Global Filter', icon: Filter, type: 'CONTROL', chart_type: 'GLOBAL_FILTER', description: 'Filter applied to all charts', defaultSize: { width: 4, height: 2 } }
    ]
  },
  {
    id: 'media-widgets',
    name: 'Media & Widgets',
    icon: Layout,
    items: [
      { id: 'web-page', name: 'Web Page', icon: Link, type: 'WIDGET', chart_type: 'WEB_PAGE', description: 'Embed a web page via URL', defaultSize: { width: 6, height: 4 } },
      { id: 'iframe-embed', name: 'iFrame/Embed', icon: Code, type: 'WIDGET', chart_type: 'IFRAME', description: 'Embed external content via URL', defaultSize: { width: 6, height: 4 } },
      { id: 'button', name: 'Button', icon: PlusCircle, type: 'WIDGET', chart_type: 'BUTTON', description: 'Trigger actions', defaultSize: { width: 2, height: 1 } },
      { id: 'rich-text', name: 'Rich Text', icon: Type, type: 'WIDGET', chart_type: 'RICH_TEXT', description: 'Formatted text content', defaultSize: { width: 5, height: 3 } },
      { id: 'youtube', name: 'YouTube', icon: Youtube, type: 'WIDGET', chart_type: 'YOUTUBE', description: 'Embed a YouTube video', defaultSize: { width: 6, height: 4 } },
      { id: 'video', name: 'Video', icon: Video, type: 'WIDGET', chart_type: 'VIDEO', description: 'Embed a hosted video (mp4, webm)', defaultSize: { width: 6, height: 4 } },
      { id: 'html-embed', name: 'HTML Embed', icon: Code2, type: 'WIDGET', chart_type: 'HTML', description: 'Custom HTML block', defaultSize: { width: 5, height: 3 } },
      { id: 'python', name: 'Python', icon: Code2, type: 'WIDGET', chart_type: 'PYTHON', description: 'Run/render Python output (custom integration)', defaultSize: { width: 5, height: 3 } }
    ]
  },
  {
    id: 'icons',
    name: 'Icons',
    icon: Star,
    items: [
      { id: 'icon-generic', name: 'Icon', icon: Star, type: 'ICON', chart_type: 'ICON', description: 'Configurable icon element', defaultSize: { width: 2, height: 2 } }
    ]
  },
  {
    id: 'shapes',
    name: 'Shapes',
    icon: Layers,
    items: [
      { id: 'rectangle', name: 'Rectangle', icon: Square, type: 'SHAPE', chart_type: 'RECTANGLE', description: 'Add a rectangular shape', defaultSize: { width: 4, height: 2 } },
      { id: 'circle', name: 'Circle', icon: CircleIcon, type: 'SHAPE', chart_type: 'CIRCLE', description: 'Add a circular shape', defaultSize: { width: 3, height: 3 } },
      { id: 'ellipse', name: 'Ellipse', icon: CircleIcon, type: 'SHAPE', chart_type: 'ELLIPSE', description: 'Add an ellipse shape', defaultSize: { width: 4, height: 3 } },
      { id: 'rounded-rect', name: 'Rounded Rect', icon: Square, type: 'SHAPE', chart_type: 'ROUNDED_RECT', description: 'Rectangle with corner radius', defaultSize: { width: 4, height: 2 } },
      { id: 'line', name: 'Line', icon: MinusIcon, type: 'SHAPE', chart_type: 'LINE', description: 'Line shape', defaultSize: { width: 6, height: 1 } },
      { id: 'arrow', name: 'Arrow', icon: ArrowRight, type: 'SHAPE', chart_type: 'ARROW', description: 'Arrow line', defaultSize: { width: 6, height: 2 } },
      { id: 'triangle', name: 'Triangle', icon: Triangle, type: 'SHAPE', chart_type: 'TRIANGLE', description: 'Triangle shape', defaultSize: { width: 3, height: 3 } },
      { id: 'star', name: 'Star', icon: Star, type: 'SHAPE', chart_type: 'STAR', description: 'Star shape', defaultSize: { width: 3, height: 3 } },
      { id: 'hexagon', name: 'Hexagon', icon: Hexagon, type: 'SHAPE', chart_type: 'HEXAGON', description: 'Hexagon shape', defaultSize: { width: 3, height: 3 } },
      { id: 'divider', name: 'Divider', icon: MinusIcon, type: 'SHAPE', chart_type: 'DIVIDER', description: 'Horizontal divider line', defaultSize: { width: 6, height: 1 } }
    ]
  }
]
