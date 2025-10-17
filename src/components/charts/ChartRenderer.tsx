'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadialBarChart,
  RadialBar,
  Treemap as ReTreemap,
  ComposedChart
} from 'recharts'
// Removed Card wrapper to avoid inner borders inside element padding
import { Filter, BarChart3 as LBarChart3, LineChart as LLineChart, PieChart as LPieChart, Table as LTable, AreaChart as LAreaChart } from 'lucide-react'
import {
  Star as StarIcon,
  Heart,
  Home,
  User,
  Settings as SettingsIcon,
  Bell,
  CheckCircle,
  AlertTriangle,
  Camera,
  Cloud,
  Folder,
  Mail,
  Phone,
  Play as PlayIcon,
  Pause as PauseIcon,
  Search as SearchIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  X as XIcon,
  Check as CheckIcon
} from 'lucide-react'

interface ChartData {
  [key: string]: any
}

interface ChartRendererProps {
  type: string
  chartType: string
  data: ChartData[]
  dimensions: string[]
  measures: string[]
  filters: any[]
  title: string
  isLive?: boolean
  refreshInterval?: number
  onRefresh?: () => void
  onFilter?: (filter: any) => void
  onExport?: (format: string) => void
  className?: string
  config?: any
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

export function ChartRenderer({
  type,
  chartType,
  data,
  dimensions,
  measures,
  filters,
  title,
  isLive = false,
  refreshInterval = 30000,
  onRefresh,
  onFilter,
  onExport,
  className = '',
  config
}: ChartRendererProps) {
  // Header controls removed per request (no live badge, pause, reload, download, title, or last updated)

  const handleDataPointClick = (data: any, index: number) => {
    if (onFilter && dimensions.length > 0) {
      const filter = {
        field: dimensions[0],
        operator: '=',
        value: data[dimensions[0]]
      }
      onFilter(filter)
    }
  }

  const renderChart = () => {
    // Use sample data if no real data is provided
    const chartData = data && data.length > 0 ? data : (() => {
      const ct = (chartType || type || '').toUpperCase()
      
      if (ct.includes('LINE')) {
        return [
          { name: 'Jan', sales: 1200, profit: 300 },
          { name: 'Feb', sales: 1500, profit: 400 },
          { name: 'Mar', sales: 1800, profit: 500 },
          { name: 'Apr', sales: 1600, profit: 450 },
          { name: 'May', sales: 2000, profit: 600 },
          { name: 'Jun', sales: 2200, profit: 700 }
        ]
      } else if (ct.includes('PIE') || ct.includes('DONUT')) {
        return [
          { name: 'Desktop', value: 45, color: '#3b82f6' },
          { name: 'Mobile', value: 35, color: '#10b981' },
          { name: 'Tablet', value: 20, color: '#f59e0b' }
        ]
      } else if (ct.includes('AREA')) {
        return [
          { name: 'Q1', revenue: 50000, expenses: 30000 },
          { name: 'Q2', revenue: 65000, expenses: 35000 },
          { name: 'Q3', revenue: 75000, expenses: 40000 },
          { name: 'Q4', revenue: 80000, expenses: 42000 }
        ]
      } else if (ct.includes('TABLE')) {
        return [
          { product: 'Product A', sales: 1000, profit: 200, growth: '+12%' },
          { product: 'Product B', sales: 1500, profit: 300, growth: '+8%' },
          { product: 'Product C', sales: 800, profit: 150, growth: '+15%' },
          { product: 'Product D', sales: 2000, profit: 500, growth: '+5%' },
          { product: 'Product E', sales: 1200, profit: 250, growth: '+20%' }
        ]
      } else {
        return [
          { name: 'Jan', sales: 1200, profit: 300 },
          { name: 'Feb', sales: 1500, profit: 400 },
          { name: 'Mar', sales: 1800, profit: 500 },
          { name: 'Apr', sales: 1600, profit: 450 },
          { name: 'May', sales: 2000, profit: 600 },
          { name: 'Jun', sales: 2200, profit: 700 }
        ]
      }
    })()

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    }

    const ct = (chartType || type || '').toUpperCase()
    switch (ct) {
      case 'STACKED_BAR':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={dimensions[0] || 'name'} />
              <YAxis />
              <Tooltip />
              <Legend />
              {measures.map((m, i) => (
                <Bar key={m} dataKey={m} stackId="a" fill={COLORS[i % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case 'GROUPED_BAR':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={dimensions[0] || 'name'} />
              <YAxis />
              <Tooltip />
              <Legend />
              {measures.map((m, i) => (
                <Bar key={m} dataKey={m} fill={COLORS[i % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case 'COMPOSED':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={dimensions[0] || 'name'} />
              <YAxis />
              <Tooltip />
              <Legend />
              {measures[0] && <Bar dataKey={measures[0]} fill={COLORS[0]} />}
              {measures[1] && <Line dataKey={measures[1]} stroke={COLORS[1]} strokeWidth={2} />}
              {measures[2] && <Area dataKey={measures[2]} fill={COLORS[2]} stroke={COLORS[2]} fillOpacity={0.5} />}
            </ComposedChart>
          </ResponsiveContainer>
        )

      case 'BAR':
        return (
          <div className="w-full h-full bg-white overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart {...commonProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey={dimensions[0] || 'name'} tick={{ fontSize: 12, fontFamily: 'Roboto, sans-serif' }} />
                <YAxis tick={{ fontSize: 12, fontFamily: 'Roboto, sans-serif' }} />
                <Tooltip contentStyle={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px' }} />
              {measures.map((measure, index) => (
                <Bar
                  key={measure}
                  dataKey={measure}
                  fill={COLORS[index % COLORS.length]}
                  onClick={handleDataPointClick}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          </div>
        )

      case 'LINE':
        return (
          <div className="w-full h-full bg-white overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
            <LineChart {...commonProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey={dimensions[0] || 'name'} tick={{ fontSize: 12, fontFamily: 'Roboto, sans-serif' }} />
                <YAxis tick={{ fontSize: 12, fontFamily: 'Roboto, sans-serif' }} />
                <Tooltip contentStyle={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px' }} />
              {measures.map((measure, index) => (
                <Line
                  key={measure}
                  type="monotone"
                  dataKey={measure}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  onClick={(e: any) => {/* noop or custom */}}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          </div>
        )

      case 'PIE':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={measures[0] || 'value'}
                onClick={(e: any) => {/* noop or custom */}}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'SCATTER':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config?.xKey || dimensions[0] || 'x'} name="X" />
              <YAxis dataKey={config?.yKey || measures[0] || 'y'} name="Y" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name={title} data={data} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        )

      case 'RADAR':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey={config?.angleKey || dimensions[0] || 'name'} />
              <PolarRadiusAxis />
              <Radar name={title} dataKey={config?.valueKey || measures[0] || 'value'} stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        )

      case 'YOUTUBE': {
        const url = config?.url || ''
        return url ? (
          <div className="w-full h-full"><iframe className="w-full h-full" src={url} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>
        ) : <div className="text-sm text-muted-foreground">Set a YouTube embed URL in settings</div>
      }

      case 'VIDEO': {
        const src = config?.src || ''
        return src ? (
          <video className="w-full h-full" src={src} controls autoPlay={!!config?.autoplay} loop={!!config?.loop} muted={!!config?.muted} />
        ) : <div className="text-sm text-muted-foreground">Set a video source (mp4/webm) in settings</div>
      }

      case 'HTML': {
        const html = config?.html || ''
        return (
          <div className="w-full h-full overflow-auto" dangerouslySetInnerHTML={{ __html: html }} />
        )
      }

      case 'RECTANGLE':
        return (
          <div style={{ width: '100%', height: '100%', background: config?.fill || '#e5e7eb', border: config?.stroke ? `1px solid ${config?.stroke}` : undefined }} />
        )

      case 'CIRCLE':
        return (
          <div style={{ width: '100%', height: '100%', borderRadius: '9999px', background: config?.fill || '#e5e7eb', border: config?.stroke ? `1px solid ${config?.stroke}` : undefined }} />
        )

      case 'DIVIDER':
        return (
          <div className="w-full h-full flex items-center"><div style={{ width: '100%', height: config?.thickness || 1, background: config?.color || '#e5e7eb' }} /></div>
        )

      // Shapes via SVG for better control
      case 'RECTANGLE': {
        const stroke = config?.stroke || '#cbd5e1'
        const fill = config?.fill || '#e5e7eb'
        const strokeWidth = Number(config?.strokeWidth || 1)
        const dash = config?.dashed ? (config?.dashPattern || '4 2') : undefined
        const rotation = Number(config?.rotation || 0)
        const rx = 0
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <g transform={`rotate(${rotation},50,50)`}>
              <rect x="5" y="5" width="90" height="90" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={dash} rx={rx} ry={rx} />
            </g>
          </svg>
        )
      }
      case 'ROUNDED_RECT': {
        const stroke = config?.stroke || '#cbd5e1'
        const fill = config?.fill || '#e5e7eb'
        const strokeWidth = Number(config?.strokeWidth || 1)
        const dash = config?.dashed ? (config?.dashPattern || '4 2') : undefined
        const rotation = Number(config?.rotation || 0)
        const r = Number(config?.cornerRadius || 12)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <g transform={`rotate(${rotation},50,50)`}>
              <rect x="5" y="5" width="90" height="90" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={dash} rx={r} ry={r} />
            </g>
          </svg>
        )
      }
      case 'ELLIPSE': {
        const stroke = config?.stroke || '#cbd5e1'
        const fill = config?.fill || '#e5e7eb'
        const strokeWidth = Number(config?.strokeWidth || 1)
        const dash = config?.dashed ? (config?.dashPattern || '4 2') : undefined
        const rotation = Number(config?.rotation || 0)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <g transform={`rotate(${rotation},50,50)`}>
              <ellipse cx="50" cy="50" rx="42" ry="32" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={dash} />
            </g>
          </svg>
        )
      }
      case 'LINE': {
        const color = config?.color || config?.stroke || '#94a3b8'
        const strokeWidth = Number(config?.strokeWidth || config?.thickness || 2)
        const dash = config?.dashed ? (config?.dashPattern || '4 2') : undefined
        const rotation = Number(config?.rotation || 0)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <g transform={`rotate(${rotation},50,50)`}>
              <line x1="5" y1="50" x2="95" y2="50" stroke={color} strokeWidth={strokeWidth} strokeDasharray={dash} />
            </g>
          </svg>
        )
      }
      case 'ARROW': {
        const color = config?.color || config?.stroke || '#94a3b8'
        const strokeWidth = Number(config?.strokeWidth || 2)
        const dash = config?.dashed ? (config?.dashPattern || '4 2') : undefined
        const rotation = Number(config?.rotation || 0)
        const headSize = Number(config?.headSize || 6)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <marker id="arrowhead" markerWidth={headSize} markerHeight={headSize} refX="0" refY="2" orient="auto">
                <polygon points={`0 0, 0 ${headSize}, ${headSize} ${headSize/2}`} fill={color} />
              </marker>
            </defs>
            <g transform={`rotate(${rotation},50,50)`}>
              <line x1="5" y1="50" x2="95" y2="50" stroke={color} strokeWidth={strokeWidth} strokeDasharray={dash} markerEnd="url(#arrowhead)" />
            </g>
          </svg>
        )
      }
      case 'TRIANGLE': {
        const stroke = config?.stroke || '#cbd5e1'
        const fill = config?.fill || '#e5e7eb'
        const strokeWidth = Number(config?.strokeWidth || 1)
        const dash = config?.dashed ? (config?.dashPattern || '4 2') : undefined
        const rotation = Number(config?.rotation || 0)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <g transform={`rotate(${rotation},50,50)`}>
              <polygon points="50,5 95,95 5,95" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={dash} />
            </g>
          </svg>
        )
      }
      case 'STAR': {
        const stroke = config?.stroke || '#cbd5e1'
        const fill = config?.fill || '#e5e7eb'
        const strokeWidth = Number(config?.strokeWidth || 1)
        const dash = config?.dashed ? (config?.dashPattern || '4 2') : undefined
        const rotation = Number(config?.rotation || 0)
        const pts = "50,5 61,38 95,38 67,58 76,91 50,72 24,91 33,58 5,38 39,38"
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <g transform={`rotate(${rotation},50,50)`}>
              <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={dash} />
            </g>
          </svg>
        )
      }
      case 'HEXAGON': {
        const stroke = config?.stroke || '#cbd5e1'
        const fill = config?.fill || '#e5e7eb'
        const strokeWidth = Number(config?.strokeWidth || 1)
        const dash = config?.dashed ? (config?.dashPattern || '4 2') : undefined
        const rotation = Number(config?.rotation || 0)
        const pts = "25,5 75,5 95,50 75,95 25,95 5,50"
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <g transform={`rotate(${rotation},50,50)`}>
              <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={dash} />
            </g>
          </svg>
        )
      }

      case 'ICON': {
        const sizePct = Number(config?.size || 80)
        const color = config?.color || '#1f2937'
        const style = (config?.style || 'outline').toLowerCase() // outline | fill | rounded
        // Custom SVG support
        if (config?.svgMarkup) {
          const px = Math.max(12, Math.round((sizePct / 100) * 96))
          let markup = String(config.svgMarkup)
          if (config?.recolorSvg) {
            try {
              // Replace non-'none' fill/stroke with currentColor to allow external color control
              markup = markup
                .replace(/fill="(?!none)[^"]*"/gi, 'fill="currentColor"')
                .replace(/stroke="(?!none)[^"]*"/gi, 'stroke="currentColor"')
              // Ensure root svg doesn't force its own color
              // (optional - keep as-is; most cases covered by replacements)
            } catch {}
          }
          return (
            <div className="w-full h-full flex items-center justify-center">
              <div style={{ width: px, height: px, color }} dangerouslySetInnerHTML={{ __html: markup }} />
            </div>
          )
        }
        const iconName: string = (config?.iconName || 'Star').toLowerCase()
        const map: Record<string, any> = {
          star: StarIcon,
          heart: Heart,
          home: Home,
          user: User,
          settings: SettingsIcon,
          bell: Bell,
          checkcircle: CheckCircle,
          alerttriangle: AlertTriangle,
          camera: Camera,
          cloud: Cloud,
          folder: Folder,
          mail: Mail,
          phone: Phone,
          play: PlayIcon,
          pause: PauseIcon,
          search: SearchIcon,
          plus: PlusIcon,
          minus: MinusIcon,
          x: XIcon,
          check: CheckIcon
        }
        const IconComp = map[iconName] || StarIcon
        const px = Math.max(12, Math.round((sizePct / 100) * 96))
        const roundedContainer = style === 'rounded'
        const outline = style === 'outline'
        const fill = style === 'fill'
        // Badge and shadow
        const showBadge = !!config?.showBadge
        const badgeColor = config?.badgeColor || (fill ? color + '22' : 'transparent')
        const badgePadding = Number(config?.badgePadding ?? 6)
        const badgeRounded = !!config?.badgeRounded || roundedContainer
        const shadowMap: Record<string, string> = {
          none: 'none',
          sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
          md: '0 4px 6px -1px rgba(0,0,0,0.1)',
          lg: '0 10px 15px -3px rgba(0,0,0,0.1)'
        }
        const boxShadow = shadowMap[(config?.shadow || 'none')] || 'none'
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div style={{ padding: badgePadding, borderRadius: badgeRounded ? '9999px' : undefined, background: showBadge ? badgeColor : (fill ? color + '22' : 'transparent'), border: outline ? `2px solid ${color}` : undefined, boxShadow }}>
              <IconComp width={px} height={px} color={color} fill={fill ? color : 'none'} />
            </div>
          </div>
        )
      }

      case 'FUNNEL':
        {
          const funnelData = (data && data.length ? data : [
            { stage: 'Visitors', value: 1000 },
            { stage: 'Signups', value: 600 },
            { stage: 'Trials', value: 300 },
            { stage: 'Customers', value: 120 }
          ]) as any[]
          const max = Math.max(...funnelData.map(d => Number(d[measures[0] || 'value'])))
          return (
            <div className="w-full h-full p-6">
              <div className="flex flex-col gap-4">
                {funnelData.map((d, i) => {
                  const v = Number(d[measures[0] || 'value'])
                  const pct = max > 0 ? (v / max) : 0
                  return (
                    <div key={i} className="w-full">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1" style={{ fontFamily: 'Roboto, sans-serif' }}>
                        <span>{d[dimensions[0] || 'stage']}</span>
                        <span>{v.toLocaleString()}</span>
                      </div>
                      <div className="h-8 bg-gray-100 rounded">
                        <div className="h-8 rounded bg-blue-500 transition-all" style={{ width: `${Math.max(8, Math.round(pct * 100))}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }

      case 'WATERFALL':
        {
          const wData = (data && data.length ? data : [
            { name: 'Start', value: 1000 },
            { name: 'Revenue', value: 400 },
            { name: 'Costs', value: -300 },
            { name: 'Other', value: 200 },
            { name: 'End', value: 1300 }
          ]) as any[]
          let running = 0
          const transformed = wData.map((d: any, i: number) => {
            const v = Number(d[measures[0] || 'value'])
            const prev = running
            running += v
            const start = v >= 0 ? prev : prev + v
            const end = v >= 0 ? prev + v : prev
            return { ...d, start, end }
          })
          const minY = Math.min(0, ...transformed.map(d => d.start), ...transformed.map(d => d.end))
          const maxY = Math.max(...transformed.map(d => d.start), ...transformed.map(d => d.end))
          return (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transformed} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={dimensions[0] || 'name'} />
                <YAxis domain={[minY, maxY]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="start" stackId="a" fill="transparent" isAnimationActive={false} />
                <Bar dataKey="diff" stackId="a" fill="#60a5fa">
                  {transformed.map((d: any, i: number) => (
                    <Cell key={i} fill={d.end >= d.start ? '#60a5fa' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )
        }

      case 'BOX_PLOT':
        {
          // Expect data as array of { group, min, q1, median, q3, max }
          const bData = (data && data.length ? data : [
            { group: 'A', min: 10, q1: 20, median: 35, q3: 50, max: 70 },
            { group: 'B', min: 5, q1: 15, median: 25, q3: 45, max: 60 }
          ]) as any[]
          const groups = bData.map(d => d[dimensions[0] || 'group'])
          const minVal = Math.min(...bData.map(d => d.min))
          const maxVal = Math.max(...bData.map(d => d.max))
          return (
            <div className="w-full h-full p-4">
              <svg viewBox={`0 0 ${groups.length * 100} 100`} className="w-full h-full">
                {bData.map((d, i) => {
                  const x = i * 100 + 50
                  const scale = (v: number) => 90 - ((v - minVal) / Math.max(1, maxVal - minVal)) * 80
                  const yMin = scale(d.min)
                  const yQ1 = scale(d.q1)
                  const yMed = scale(d.median)
                  const yQ3 = scale(d.q3)
                  const yMax = scale(d.max)
                  return (
                    <g key={i}>
                      {/* Whiskers */}
                      <line x1={x} y1={yMax} x2={x} y2={yQ3} stroke="#94a3b8" strokeWidth={2} />
                      <line x1={x} y1={yMin} x2={x} y2={yQ1} stroke="#94a3b8" strokeWidth={2} />
                      {/* Box */}
                      <rect x={x - 20} y={yQ3} width={40} height={Math.max(2, yQ1 - yQ3)} fill="#93c5fd" stroke="#60a5fa" />
                      {/* Median */}
                      <line x1={x - 20} y1={yMed} x2={x + 20} y2={yMed} stroke="#1d4ed8" strokeWidth={2} />
                      {/* Caps */}
                      <line x1={x - 10} y1={yMax} x2={x + 10} y2={yMax} stroke="#94a3b8" strokeWidth={2} />
                      <line x1={x - 10} y1={yMin} x2={x + 10} y2={yMin} stroke="#94a3b8" strokeWidth={2} />
                      {/* Label */}
                      <text x={x} y={98} textAnchor="middle" fontSize={8} fill="#64748b" style={{ fontFamily: 'Roboto, sans-serif' }}>{d[dimensions[0] || 'group']}</text>
                    </g>
                  )
                })}
              </svg>
            </div>
          )
        }

      case 'CHOROPLETH':
        return (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">Choropleth Map</div>
              <div className="text-sm text-muted-foreground">Choropleth map visualization not yet implemented</div>
            </div>
          </div>
        )

      case 'BUBBLE_MAP':
        return (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">Bubble Map</div>
              <div className="text-sm text-muted-foreground">Bubble map visualization not yet implemented</div>
            </div>
          </div>
        )

      case 'HORIZONTAL_BAR':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...commonProps} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey={dimensions[0] || 'name'} type="category" width={80} />
              <Tooltip />
              <Legend />
              {measures.map((measure, index) => (
                <Bar
                  key={measure}
                  dataKey={measure}
                  fill={COLORS[index % COLORS.length]}
                  onClick={handleDataPointClick}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case 'DONUT':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                innerRadius={40}
                fill="#8884d8"
                dataKey={measures[0] || 'value'}
                onClick={(e: any) => {/* noop or custom */}}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'HEATMAP': {
        // Expect grid-like data [{x: 'A', y: '1', value: 10}, ...]
        const src = (data && data.length ? data : [
          { x: 'A', y: '1', value: 10 }, { x: 'B', y: '1', value: 20 }, { x: 'C', y: '1', value: 5 },
          { x: 'A', y: '2', value: 12 }, { x: 'B', y: '2', value: 8 }, { x: 'C', y: '2', value: 18 },
          { x: 'A', y: '3', value: 3 }, { x: 'B', y: '3', value: 9 }, { x: 'C', y: '3', value: 22 }
        ]) as any[]
        const xs = Array.from(new Set(src.map(d => d[dimensions[0] || 'x'])))
        const ys = Array.from(new Set(src.map(d => d[dimensions[1] || 'y'])))
        const maxV = Math.max(...src.map(d => Number(d[measures[0] || 'value'])))
        const cellW = 100 / Math.max(1, xs.length)
        const cellH = 100 / Math.max(1, ys.length)
        const colorFor = (v: number) => {
          const t = maxV > 0 ? v / maxV : 0
          const r = Math.round(255 * t)
          const g = Math.round(140 * (1 - t))
          const b = 200 - Math.round(200 * t)
          return `rgb(${r},${g},${b})`
        }
        return (
          <div className="w-full h-full p-2">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {ys.map((yVal, yi) => (
                xs.map((xVal, xi) => {
                  const rec = src.find(d => d[dimensions[0] || 'x'] === xVal && d[dimensions[1] || 'y'] === yVal)
                  const v = Number(rec ? rec[measures[0] || 'value'] : 0)
                  return (
                    <rect key={`${xi}-${yi}`} x={xi*cellW + 2} y={yi*cellH + 2} width={cellW - 4} height={cellH - 4} fill={colorFor(v)} rx={2} />
                  )
                })
              ))}
            </svg>
          </div>
        )
      }

      case 'TREEMAP': {
        const treeData = (data && data.length ? data : [
          { name: 'A', size: 400 }, { name: 'B', size: 300 }, { name: 'C', size: 200 }, { name: 'D', size: 100 }
        ]) as any[]
        const treemapData = [{ name: 'root', children: treeData.map(d => ({ name: d[dimensions[0] || 'name'] || d.name, size: Number(d[measures[0] || 'size'] || d.size) })) }]
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ReTreemap data={treemapData} dataKey="size" nameKey="name" stroke="#fff" fill="#60a5fa" />
          </ResponsiveContainer>
        )
      }

      case 'BUBBLE_MAP': {
        // Plot bubbles on a normalized 2D plane from -180..180 (lng) and -90..90 (lat)
        const src = (data && data.length ? data : [
          { name: 'A', lat: 37, lng: -122, value: 30 },
          { name: 'B', lat: 51.5, lng: 0, value: 20 },
          { name: 'C', lat: 13.7, lng: 100.5, value: 25 }
        ]) as any[]
        const latKey = dimensions[0] || 'lat'
        const lngKey = dimensions[1] || 'lng'
        const valKey = measures[0] || 'value'
        const maxV = Math.max(...src.map(d => Number(d[valKey])))
        const rFor = (v: number) => 4 + 16 * (maxV > 0 ? v / maxV : 0)
        const xFor = (lng: number) => ((lng + 180) / 360) * 100
        const yFor = (lat: number) => (100 - ((lat + 90) / 180) * 100)
        return (
          <div className="w-full h-full p-2">
            <div className="text-[10px] text-gray-400 mb-1" style={{ fontFamily: 'Roboto, sans-serif' }}>Projected plane (not geo-accurate)</div>
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <rect x="0" y="0" width="100" height="100" fill="#f8fafc" stroke="#e5e7eb" />
              {src.map((d, i) => {
                const cx = xFor(Number(d[lngKey]))
                const cy = yFor(Number(d[latKey]))
                const r = rFor(Number(d[valKey]))
                return (
                  <g key={i}>
                    <circle cx={cx} cy={cy} r={r} fill="rgba(59,130,246,0.35)" stroke="#3b82f6" />
                    <title>{`${d.name || ''}\n${valKey}: ${d[valKey]}`}</title>
                  </g>
                )
              })}
            </svg>
          </div>
        )
      }

      case 'CHOROPLETH': {
        // Simple region grid choropleth
        const src = (data && data.length ? data : [
          { region: 'North', value: 30 }, { region: 'South', value: 15 }, { region: 'East', value: 22 }, { region: 'West', value: 10 }
        ]) as any[]
        const regKey = dimensions[0] || 'region'
        const valKey = measures[0] || 'value'
        const regs = src.map(d => String(d[regKey]))
        const maxV = Math.max(...src.map(d => Number(d[valKey])))
        const colorFor = (v: number) => {
          const t = maxV > 0 ? v / maxV : 0
          const r = 240 - Math.round(120 * t)
          const g = 249 - Math.round(150 * t)
          const b = 255 - Math.round(200 * t)
          return `rgb(${r},${g},${b})`
        }
        const layout = [
          ['North', 'East'],
          ['West', 'South']
        ]
        const cellW = 50, cellH = 50
        return (
          <div className="w-full h-full p-4">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {layout.map((row, ri) => row.map((name, ci) => {
                const rec = src.find(d => String(d[regKey]).toLowerCase() === name.toLowerCase())
                const v = Number(rec ? rec[valKey] : 0)
                return (
                  <g key={`${ri}-${ci}`}>
                    <rect x={ci*cellW} y={ri*cellH} width={cellW} height={cellH} fill={colorFor(v)} stroke="#e5e7eb" />
                    <text x={ci*cellW + 25} y={ri*cellH + 28} textAnchor="middle" fontSize={8} fill="#334155" style={{ fontFamily: 'Roboto, sans-serif' }}>{name}</text>
                  </g>
                )
              }))}
            </svg>
          </div>
        )
      }

      case 'PIVOT_TABLE':
        {
          // Simple pivot by first dimension, sum first measure
          const dim = dimensions[0] || 'category'
          const meas = measures[0] || 'value'
          const source = (data && data.length ? data : [
            { [dim]: 'A', [meas]: 10 },
            { [dim]: 'B', [meas]: 20 },
            { [dim]: 'A', [meas]: 15 },
            { [dim]: 'B', [meas]: 5 },
            { [dim]: 'C', [meas]: 12 },
          ]) as any[]
          const groups: Record<string, number> = {}
          source.forEach(r => { groups[r[dim]] = (groups[r[dim]] || 0) + Number(r[meas] || 0) })
          const rows = Object.entries(groups).map(([k, v]) => ({ [dim]: k, [meas]: v }))
          return (
            <div className="w-full h-full bg-white overflow-hidden">
              <div className="overflow-auto h-full">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium text-xs text-gray-700 uppercase tracking-wide" style={{ fontFamily: 'Roboto, sans-serif' }}>{dim}</th>
                      <th className="text-left p-3 font-medium text-xs text-gray-700 uppercase tracking-wide" style={{ fontFamily: 'Roboto, sans-serif' }}>{meas}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-3 text-sm" style={{ fontFamily: 'Roboto, sans-serif' }}>{String(r[dim])}</td>
                        <td className="p-3 text-sm" style={{ fontFamily: 'Roboto, sans-serif' }}>{String(r[meas])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        }

        case 'TABLE':
          const columns = dimensions.length > 0 ? dimensions : Object.keys(chartData[0] || {})

          return (
            <div className="w-full h-full bg-white overflow-hidden">
              <div className="overflow-auto h-full">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      {columns.map((col, index) => (
                        <th key={index} className="text-left p-3 font-medium text-xs text-gray-700 uppercase tracking-wide" style={{ fontFamily: 'Roboto, sans-serif' }}>
                          {col.charAt(0).toUpperCase() + col.slice(1)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.slice(0, 100).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b hover:bg-gray-50 transition-colors">
                        {columns.map((col, colIndex) => (
                          <td key={colIndex} className="p-3 text-sm" style={{ fontFamily: 'Roboto, sans-serif' }}>
                            {col === 'growth' ? (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                (row as any)[col]?.startsWith('+') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {(row as any)[col]}
                              </span>
                            ) : (
                              (row as any)[col] !== undefined ? String((row as any)[col]) : '-'
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {chartData.length > 100 && (
                  <div className="text-xs text-gray-500 p-3 text-center border-t border-gray-200" style={{ fontFamily: 'Roboto, sans-serif' }}>
                    Showing first 100 rows of {chartData.length} total
                  </div>
                )}
              </div>
            </div>
        )

      case 'AREA':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={dimensions[0] || 'name'} />
              <YAxis />
              <Tooltip />
              <Legend />
              {measures.map((measure, index) => (
                <Area
                  key={measure}
                  type="monotone"
                  dataKey={measure}
                  stackId="1"
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.6}
                  onClick={(e: any) => {/* noop or custom */}}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )

      case 'SCATTER':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={dimensions[0] || 'x'} />
              <YAxis dataKey={dimensions[1] || 'y'} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter
                dataKey={measures[0] || 'value'}
                fill={COLORS[0]}
                onClick={handleDataPointClick}
              />
            </ScatterChart>
          </ResponsiveContainer>
        )

      case 'RADAR':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey={dimensions[0] || 'subject'} />
              <PolarRadiusAxis />
              {measures.map((measure, index) => (
                <Radar
                  key={measure}
                  name={measure}
                  dataKey={measure}
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.6}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        )

      case 'GAUGE':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={data}>
              <RadialBar
                dataKey={measures[0] || 'value'}
                cornerRadius={10}
                fill={COLORS[0]}
              />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
        )

      default:
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <div className="text-lg font-medium">{chartType} Chart</div>
              <div className="text-sm">Chart type not implemented yet</div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className={`h-full ${className}`}>
      {renderChart()}
    </div>
  )
}
