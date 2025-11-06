/**
 * Data Masking and Security System
 * Provides data masking for sensitive information
 */

export type MaskingStrategy = 
  | 'full'           // Replace with fixed string
  | 'partial'        // Show only first/last N characters
  | 'hash'           // Hash the value
  | 'redact'         // Replace with [REDACTED]
  | 'null'           // Replace with null
  | 'email'          // Mask email addresses
  | 'phone'          // Mask phone numbers
  | 'ssn'            // Mask SSN
  | 'credit-card'    // Mask credit card numbers

export interface MaskingRule {
  id?: string
  name: string
  description?: string
  tableName?: string
  columnName?: string
  pattern?: RegExp | string
  strategy: MaskingStrategy
  options?: {
    visibleChars?: number // For partial masking
    maskChar?: string     // Character to use for masking
    prefix?: string       // Prefix to add
    suffix?: string       // Suffix to add
  }
  enabled: boolean
  spaceId?: string
}

export interface MaskingContext {
  userId?: string
  userRole?: string
  spaceId?: string
  environment?: 'production' | 'development' | 'staging'
}

class DataMasking {
  private rules: MaskingRule[] = []
  private initialized = false

  async initialize() {
    if (this.initialized) return

    try {
      // Create masking_rules table
      await query(`
        CREATE TABLE IF NOT EXISTS public.masking_rules (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          table_name TEXT,
          column_name TEXT,
          pattern TEXT,
          strategy TEXT NOT NULL,
          options JSONB,
          enabled BOOLEAN NOT NULL DEFAULT true,
          space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_masking_rules_enabled ON public.masking_rules(enabled);
        CREATE INDEX IF NOT EXISTS idx_masking_rules_space_id ON public.masking_rules(space_id);
        CREATE INDEX IF NOT EXISTS idx_masking_rules_table_column ON public.masking_rules(table_name, column_name);
      `)

      // Load rules from database
      await this.loadRules()

      this.initialized = true
      console.log('✅ Data masking system initialized')
    } catch (error) {
      console.error('❌ Failed to initialize data masking:', error)
    }
  }

  private async loadRules() {
    try {
      const { query } = await import('./db')
      const result = await query(`
        SELECT * FROM public.masking_rules WHERE enabled = true
      `)

      this.rules = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        tableName: row.table_name,
        columnName: row.column_name,
        pattern: row.pattern ? new RegExp(row.pattern) : undefined,
        strategy: row.strategy as MaskingStrategy,
        options: row.options,
        enabled: row.enabled,
        spaceId: row.space_id
      }))
    } catch (error) {
      console.error('❌ Failed to load masking rules:', error)
    }
  }

  maskValue(value: any, context?: MaskingContext): any {
    if (value === null || value === undefined) {
      return value
    }

    const stringValue = String(value)

    // Check if user has permission to see unmasked data
    if (this.canSeeUnmaskedData(context)) {
      return value
    }

    // Find applicable rules
    const applicableRules = this.rules.filter(rule => {
      if (!rule.enabled) return false
      if (rule.spaceId && context?.spaceId && rule.spaceId !== context.spaceId) return false
      if (rule.pattern) {
        const regex = rule.pattern instanceof RegExp ? rule.pattern : new RegExp(rule.pattern)
        return regex.test(stringValue)
      }
      return true
    })

    // Apply first matching rule
    if (applicableRules.length > 0) {
      const rule = applicableRules[0]
      return this.applyMaskingStrategy(stringValue, rule)
    }

    return value
  }

  maskRow(row: Record<string, any>, tableName: string, context?: MaskingContext): Record<string, any> {
    const maskedRow = { ...row }

    for (const [columnName, value] of Object.entries(row)) {
      // Check for column-specific rules
      const columnRule = this.rules.find(rule => 
        rule.enabled &&
        rule.tableName === tableName &&
        rule.columnName === columnName &&
        (!rule.spaceId || !context?.spaceId || rule.spaceId === context.spaceId)
      )

      if (columnRule) {
        maskedRow[columnName] = this.applyMaskingStrategy(String(value), columnRule)
      } else {
        // Apply pattern-based rules
        maskedRow[columnName] = this.maskValue(value, context)
      }
    }

    return maskedRow
  }

  maskResultSet(data: any[], tableName?: string, context?: MaskingContext): any[] {
    if (!tableName) {
      return data.map(row => {
        const maskedRow: any = {}
        for (const [key, value] of Object.entries(row)) {
          maskedRow[key] = this.maskValue(value, context)
        }
        return maskedRow
      })
    }

    return data.map(row => this.maskRow(row, tableName, context))
  }

  private applyMaskingStrategy(value: string, rule: MaskingRule): string {
    const options = rule.options || {}
    const maskChar = options.maskChar || '*'
    const visibleChars = options.visibleChars || 0

    switch (rule.strategy) {
      case 'full':
        return maskChar.repeat(Math.min(value.length, 8))

      case 'partial':
        if (value.length <= visibleChars) {
          return maskChar.repeat(value.length)
        }
        const visible = value.substring(0, visibleChars)
        const masked = maskChar.repeat(value.length - visibleChars)
        return visible + masked

      case 'hash':
        // Simple hash - in production, use proper hashing
        return `hash_${value.substring(0, 4)}${maskChar.repeat(8)}`

      case 'redact':
        return '[REDACTED]'

      case 'null':
        return null

      case 'email':
        const emailParts = value.split('@')
        if (emailParts.length === 2) {
          const [local, domain] = emailParts
          const maskedLocal = local.length > 2 
            ? local.substring(0, 2) + maskChar.repeat(Math.max(0, local.length - 2))
            : maskChar.repeat(local.length)
          return `${maskedLocal}@${domain}`
        }
        return maskChar.repeat(value.length)

      case 'phone':
        // Mask phone: +1 (555) ***-****
        const digits = value.replace(/\D/g, '')
        if (digits.length >= 10) {
          return `+${digits.substring(0, 1)} (${digits.substring(1, 4)}) ***-****`
        }
        return maskChar.repeat(value.length)

      case 'ssn':
        // Mask SSN: ***-**-1234
        const ssnDigits = value.replace(/\D/g, '')
        if (ssnDigits.length === 9) {
          return `***-**-${ssnDigits.substring(5)}`
        }
        return maskChar.repeat(value.length)

      case 'credit-card':
        // Mask credit card: ****-****-****-1234
        const cardDigits = value.replace(/\D/g, '')
        if (cardDigits.length >= 4) {
          const last4 = cardDigits.substring(cardDigits.length - 4)
          return `****-****-****-${last4}`
        }
        return maskChar.repeat(value.length)

      default:
        return value
    }
  }

  private canSeeUnmaskedData(context?: MaskingContext): boolean {
    if (!context) return false

    // In production, check user permissions
    // For now, allow admins to see unmasked data
    if (context.userRole === 'ADMIN' || context.userRole === 'SUPER_ADMIN') {
      return true
    }

    // Allow in development
    if (context.environment === 'development') {
      return true
    }

    return false
  }

  async createMaskingRule(rule: Omit<MaskingRule, 'id'>): Promise<string> {
    await this.initialize()

    try {
      const { query } = await import('./db')
      const result = await query(`
        INSERT INTO public.masking_rules (
          name, description, table_name, column_name, pattern,
          strategy, options, enabled, space_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        rule.name,
        rule.description || null,
        rule.tableName || null,
        rule.columnName || null,
        rule.pattern ? (rule.pattern instanceof RegExp ? rule.pattern.source : rule.pattern) : null,
        rule.strategy,
        rule.options ? JSON.stringify(rule.options) : null,
        rule.enabled,
        rule.spaceId || null
      ])

      const ruleId = result.rows[0]?.id
      await this.loadRules() // Reload rules
      return ruleId
    } catch (error) {
      console.error('❌ Failed to create masking rule:', error)
      throw error
    }
  }

  async getMaskingRules(spaceId?: string): Promise<MaskingRule[]> {
    await this.initialize()

    try {
      const { query } = await import('./db')
      const conditions: string[] = []
      const params: any[] = []
      let paramIndex = 1

      if (spaceId) {
        conditions.push(`(space_id = $${paramIndex++} OR space_id IS NULL)`)
        params.push(spaceId)
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      const result = await query(`
        SELECT * FROM public.masking_rules ${whereClause} ORDER BY created_at DESC
      `, params)

      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        tableName: row.table_name,
        columnName: row.column_name,
        pattern: row.pattern ? new RegExp(row.pattern) : undefined,
        strategy: row.strategy as MaskingStrategy,
        options: row.options,
        enabled: row.enabled,
        spaceId: row.space_id
      }))
    } catch (error) {
      console.error('❌ Failed to get masking rules:', error)
      return []
    }
  }

  async updateMaskingRule(ruleId: string, updates: Partial<MaskingRule>): Promise<boolean> {
    await this.initialize()

    try {
      const { query } = await import('./db')
      const updatesList: string[] = []
      const params: any[] = []
      let paramIndex = 1

      if (updates.name !== undefined) {
        updatesList.push(`name = $${paramIndex++}`)
        params.push(updates.name)
      }
      if (updates.description !== undefined) {
        updatesList.push(`description = $${paramIndex++}`)
        params.push(updates.description)
      }
      if (updates.tableName !== undefined) {
        updatesList.push(`table_name = $${paramIndex++}`)
        params.push(updates.tableName)
      }
      if (updates.columnName !== undefined) {
        updatesList.push(`column_name = $${paramIndex++}`)
        params.push(updates.columnName)
      }
      if (updates.strategy !== undefined) {
        updatesList.push(`strategy = $${paramIndex++}`)
        params.push(updates.strategy)
      }
      if (updates.options !== undefined) {
        updatesList.push(`options = $${paramIndex++}`)
        params.push(JSON.stringify(updates.options))
      }
      if (updates.enabled !== undefined) {
        updatesList.push(`enabled = $${paramIndex++}`)
        params.push(updates.enabled)
      }
      if (updates.spaceId !== undefined) {
        updatesList.push(`space_id = $${paramIndex++}`)
        params.push(updates.spaceId)
      }

      updatesList.push(`updated_at = NOW()`)
      params.push(ruleId)

      await query(`
        UPDATE public.masking_rules
        SET ${updatesList.join(', ')}
        WHERE id = $${paramIndex}
      `, params)

      await this.loadRules() // Reload rules
      return true
    } catch (error) {
      console.error('❌ Failed to update masking rule:', error)
      throw error
    }
  }

  async deleteMaskingRule(ruleId: string): Promise<boolean> {
    await this.initialize()

    try {
      const { query } = await import('./db')
      await query('DELETE FROM public.masking_rules WHERE id = $1', [ruleId])
      await this.loadRules() // Reload rules
      return true
    } catch (error) {
      console.error('❌ Failed to delete masking rule:', error)
      throw error
    }
  }
}

// Export singleton instance
export const dataMasking = new DataMasking()

// Helper function for query import
async function query(sql: string, params?: any[]) {
  const { query: dbQuery } = await import('./db')
  return dbQuery(sql, params)
}

