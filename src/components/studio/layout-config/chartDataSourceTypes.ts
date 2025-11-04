import { PlacedWidget } from './widgets'

export interface Attribute {
  id: string
  name: string
  display_name: string
  type: string
}

export interface DataModel {
  id: string
  name: string
  display_name: string
}

export interface ChartDataSourceConfigProps {
  widget: PlacedWidget
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
  spaceId?: string
}

export interface ChartDimension {
  key: string
  label: string
  required?: boolean
  multiple?: boolean
}

