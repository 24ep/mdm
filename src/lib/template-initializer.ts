import { TemplateManager } from './template-manager'
import { TemplateGenerator } from './template-generator'
import { DataModel } from './template-generator'

interface InitializationStatus {
  isInitialized: boolean
  lastInitialized: string
  version: string
}

const INITIALIZATION_KEY = 'space_studio_initialized'
const INITIALIZATION_VERSION = '1.0.0'

export class TemplateInitializer {
  /**
   * Check if templates have been initialized
   */
  static isInitialized(): boolean {
    if (typeof window === 'undefined') return false
    
    try {
      const status = localStorage.getItem(INITIALIZATION_KEY)
      if (!status) return false
      
      const parsed: InitializationStatus = JSON.parse(status)
      return parsed.isInitialized && parsed.version === INITIALIZATION_VERSION
    } catch {
      return false
    }
  }

  /**
   * Mark templates as initialized
   */
  static markAsInitialized(): void {
    if (typeof window === 'undefined') return
    
    const status: InitializationStatus = {
      isInitialized: true,
      lastInitialized: new Date().toISOString(),
      version: INITIALIZATION_VERSION
    }
    
    localStorage.setItem(INITIALIZATION_KEY, JSON.stringify(status))
  }

  /**
   * Initialize prebuilt templates for common data models
   */
  static async initializePrebuiltTemplates(): Promise<void> {
    if (this.isInitialized()) {
      console.log('Templates already initialized')
      return
    }

    console.log('Initializing prebuilt templates...')

    try {
      // Common data models that should have templates
      const commonDataModels: DataModel[] = [
        {
          id: 'users',
          name: 'users',
          display_name: 'Users',
          description: 'User accounts and profiles',
          table_name: 'users',
          attributes: [
            { id: '1', name: 'name', display_name: 'Name', type: 'TEXT', required: true, unique: false },
            { id: '2', name: 'email', display_name: 'Email', type: 'EMAIL', required: true, unique: true },
            { id: '3', name: 'phone', display_name: 'Phone', type: 'PHONE', required: false, unique: false },
            { id: '4', name: 'role', display_name: 'Role', type: 'SELECT', required: false, unique: false },
            { id: '5', name: 'created_at', display_name: 'Created', type: 'DATETIME', required: false, unique: false },
            { id: '6', name: 'updated_at', display_name: 'Updated', type: 'DATETIME', required: false, unique: false }
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'companies',
          name: 'companies',
          display_name: 'Companies',
          description: 'Company information and details',
          table_name: 'companies',
          attributes: [
            { id: '1', name: 'name', display_name: 'Company Name', type: 'TEXT', required: true, unique: false },
            { id: '2', name: 'industry', display_name: 'Industry', type: 'SELECT', required: false, unique: false },
            { id: '3', name: 'website', display_name: 'Website', type: 'URL', required: false, unique: false },
            { id: '4', name: 'employees', display_name: 'Employee Count', type: 'NUMBER', required: false, unique: false },
            { id: '5', name: 'created_at', display_name: 'Created', type: 'DATETIME', required: false, unique: false }
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'orders',
          name: 'orders',
          display_name: 'Orders',
          description: 'Customer orders and transactions',
          table_name: 'orders',
          attributes: [
            { id: '1', name: 'order_number', display_name: 'Order Number', type: 'TEXT', required: true, unique: true },
            { id: '2', name: 'customer_id', display_name: 'Customer', type: 'RELATION', required: true, unique: false },
            { id: '3', name: 'total_amount', display_name: 'Total Amount', type: 'DECIMAL', required: true, unique: false },
            { id: '4', name: 'status', display_name: 'Status', type: 'SELECT', required: true, unique: false },
            { id: '5', name: 'order_date', display_name: 'Order Date', type: 'DATE', required: true, unique: false },
            { id: '6', name: 'created_at', display_name: 'Created', type: 'DATETIME', required: false, unique: false }
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'products',
          name: 'products',
          display_name: 'Products',
          description: 'Product catalog and inventory',
          table_name: 'products',
          attributes: [
            { id: '1', name: 'name', display_name: 'Product Name', type: 'TEXT', required: true, unique: false },
            { id: '2', name: 'sku', display_name: 'SKU', type: 'TEXT', required: true, unique: true },
            { id: '3', name: 'price', display_name: 'Price', type: 'DECIMAL', required: true, unique: false },
            { id: '4', name: 'category', display_name: 'Category', type: 'SELECT', required: false, unique: false },
            { id: '5', name: 'stock_quantity', display_name: 'Stock Quantity', type: 'NUMBER', required: false, unique: false },
            { id: '6', name: 'description', display_name: 'Description', type: 'LONG_TEXT', required: false, unique: false },
            { id: '7', name: 'created_at', display_name: 'Created', type: 'DATETIME', required: false, unique: false }
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'events',
          name: 'events',
          display_name: 'Events',
          description: 'Calendar events and schedules',
          table_name: 'events',
          attributes: [
            { id: '1', name: 'title', display_name: 'Event Title', type: 'TEXT', required: true, unique: false },
            { id: '2', name: 'description', display_name: 'Description', type: 'LONG_TEXT', required: false, unique: false },
            { id: '3', name: 'start_date', display_name: 'Start Date', type: 'DATETIME', required: true, unique: false },
            { id: '4', name: 'end_date', display_name: 'End Date', type: 'DATETIME', required: true, unique: false },
            { id: '5', name: 'location', display_name: 'Location', type: 'TEXT', required: false, unique: false },
            { id: '6', name: 'status', display_name: 'Status', type: 'SELECT', required: false, unique: false },
            { id: '7', name: 'created_at', display_name: 'Created', type: 'DATETIME', required: false, unique: false }
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      // Generate Entity Table template for each data model
      for (const dataModel of commonDataModels) {
        try {
          const template = TemplateGenerator.generateEntityTableTemplate(dataModel)
          await TemplateManager.saveTemplate(template)
          console.log(`Generated Entity Table template for ${dataModel.display_name}`)
        } catch (error) {
          console.error(`Failed to generate template for ${dataModel.display_name}:`, error)
        }
      }

      // Mark as initialized
      this.markAsInitialized()
      console.log('Prebuilt templates initialized successfully')
      
    } catch (error) {
      console.error('Failed to initialize prebuilt templates:', error)
      throw error
    }
  }

  /**
   * Reset initialization status (for development/testing)
   */
  static resetInitialization(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(INITIALIZATION_KEY)
  }

  /**
   * Get initialization status
   */
  static getInitializationStatus(): InitializationStatus | null {
    if (typeof window === 'undefined') return null
    
    try {
      const status = localStorage.getItem(INITIALIZATION_KEY)
      return status ? JSON.parse(status) : null
    } catch {
      return null
    }
  }
}
