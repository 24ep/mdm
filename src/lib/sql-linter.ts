/**
 * SQL Linting System
 * Provides comprehensive SQL validation and linting rules
 */

export type LintSeverity = 'error' | 'warning' | 'info'
export type LintRuleCategory = 'security' | 'performance' | 'style' | 'best-practice' | 'safety'

export interface LintRule {
  id: string
  name: string
  description: string
  category: LintRuleCategory
  severity: LintSeverity
  enabled: boolean
  check: (sql: string, context?: any) => LintIssue[]
}

export interface LintIssue {
  ruleId: string
  ruleName: string
  severity: LintSeverity
  message: string
  line?: number
  column?: number
  suggestion?: string
  category: LintRuleCategory
}

export interface LintResult {
  valid: boolean
  issues: LintIssue[]
  score: number // 0-100
  summary: {
    errors: number
    warnings: number
    info: number
  }
}

class SQLLinter {
  private rules: Map<string, LintRule> = new Map()

  constructor() {
    this.initializeRules()
  }

  private initializeRules() {
    // Security Rules
    this.addRule({
      id: 'no-drop-table',
      name: 'No DROP TABLE',
      description: 'DROP TABLE statements are not allowed',
      category: 'security',
      severity: 'error',
      enabled: true,
      check: (sql) => {
        const issues: LintIssue[] = []
        if (/DROP\s+TABLE/i.test(sql)) {
          issues.push({
            ruleId: 'no-drop-table',
            ruleName: 'No DROP TABLE',
            severity: 'error',
            message: 'DROP TABLE statements are not allowed for security reasons',
            suggestion: 'Use ALTER TABLE to modify schema instead',
            category: 'security'
          })
        }
        return issues
      }
    })

    this.addRule({
      id: 'no-drop-database',
      name: 'No DROP DATABASE',
      description: 'DROP DATABASE statements are not allowed',
      category: 'security',
      severity: 'error',
      enabled: true,
      check: (sql) => {
        const issues: LintIssue[] = []
        if (/DROP\s+DATABASE/i.test(sql)) {
          issues.push({
            ruleId: 'no-drop-database',
            ruleName: 'No DROP DATABASE',
            severity: 'error',
            message: 'DROP DATABASE statements are not allowed',
            suggestion: 'Contact database administrator for database operations',
            category: 'security'
          })
        }
        return issues
      }
    })

    this.addRule({
      id: 'no-truncate',
      name: 'No TRUNCATE',
      description: 'TRUNCATE statements are not allowed',
      category: 'security',
      severity: 'error',
      enabled: true,
      check: (sql) => {
        const issues: LintIssue[] = []
        if (/TRUNCATE/i.test(sql)) {
          issues.push({
            ruleId: 'no-truncate',
            ruleName: 'No TRUNCATE',
            severity: 'error',
            message: 'TRUNCATE statements are not allowed',
            suggestion: 'Use DELETE with WHERE clause for safer data removal',
            category: 'security'
          })
        }
        return issues
      }
    })

    this.addRule({
      id: 'no-delete-without-where',
      name: 'No DELETE without WHERE',
      description: 'DELETE statements must include a WHERE clause',
      category: 'safety',
      severity: 'error',
      enabled: true,
      check: (sql) => {
        const issues: LintIssue[] = []
        const deleteMatch = sql.match(/DELETE\s+FROM\s+(\w+)(?:\s+WHERE)?/i)
        if (deleteMatch && !/WHERE/i.test(sql.substring(sql.indexOf(deleteMatch[0])))) {
          issues.push({
            ruleId: 'no-delete-without-where',
            ruleName: 'No DELETE without WHERE',
            severity: 'error',
            message: 'DELETE statements must include a WHERE clause to prevent accidental data loss',
            suggestion: 'Add a WHERE clause to specify which rows to delete',
            category: 'safety'
          })
        }
        return issues
      }
    })

    this.addRule({
      id: 'no-update-without-where',
      name: 'No UPDATE without WHERE',
      description: 'UPDATE statements should include a WHERE clause',
      category: 'safety',
      severity: 'warning',
      enabled: true,
      check: (sql) => {
        const issues: LintIssue[] = []
        const updateMatch = sql.match(/UPDATE\s+(\w+)(?:\s+SET)?/i)
        if (updateMatch && !/WHERE/i.test(sql.substring(sql.indexOf(updateMatch[0])))) {
          issues.push({
            ruleId: 'no-update-without-where',
            ruleName: 'No UPDATE without WHERE',
            severity: 'warning',
            message: 'UPDATE statements should include a WHERE clause to prevent updating all rows',
            suggestion: 'Add a WHERE clause to specify which rows to update',
            category: 'safety'
          })
        }
        return issues
      }
    })

    // Performance Rules
    this.addRule({
      id: 'select-star',
      name: 'Avoid SELECT *',
      description: 'Avoid using SELECT * in production queries',
      category: 'performance',
      severity: 'warning',
      enabled: true,
      check: (sql) => {
        const issues: LintIssue[] = []
        if (/\bSELECT\s+\*\s+FROM/i.test(sql)) {
          issues.push({
            ruleId: 'select-star',
            ruleName: 'Avoid SELECT *',
            severity: 'warning',
            message: 'Using SELECT * can impact performance and expose unnecessary data',
            suggestion: 'Specify only the columns you need',
            category: 'performance'
          })
        }
        return issues
      }
    })

    this.addRule({
      id: 'missing-index-hint',
      name: 'Missing Index Hint',
      description: 'Queries with WHERE clauses should consider using indexes',
      category: 'performance',
      severity: 'info',
      enabled: true,
      check: (sql) => {
        const issues: LintIssue[] = []
        if (/WHERE/i.test(sql) && !/INDEX|USING/i.test(sql)) {
          // This is just informational, not a real issue
          // In a real system, you'd check if indexes exist
        }
        return issues
      }
    })

    this.addRule({
      id: 'no-limit-on-large-query',
      name: 'Large Query without LIMIT',
      description: 'Queries without LIMIT may return large result sets',
      category: 'performance',
      severity: 'warning',
      enabled: true,
      check: (sql) => {
        const issues: LintIssue[] = []
        if (/SELECT/i.test(sql) && !/LIMIT/i.test(sql) && !/COUNT|SUM|AVG|MAX|MIN|GROUP\s+BY/i.test(sql)) {
          issues.push({
            ruleId: 'no-limit-on-large-query',
            ruleName: 'Large Query without LIMIT',
            severity: 'warning',
            message: 'Consider adding a LIMIT clause to prevent large result sets',
            suggestion: 'Add LIMIT clause: LIMIT 100',
            category: 'performance'
          })
        }
        return issues
      }
    })

    // Best Practice Rules
    this.addRule({
      id: 'use-explicit-joins',
      name: 'Use Explicit JOINs',
      description: 'Prefer explicit JOIN syntax over implicit joins',
      category: 'best-practice',
      severity: 'info',
      enabled: true,
      check: (sql) => {
        const issues: LintIssue[] = []
        if (/FROM\s+\w+\s*,\s*\w+/i.test(sql) && !/JOIN/i.test(sql)) {
          issues.push({
            ruleId: 'use-explicit-joins',
            ruleName: 'Use Explicit JOINs',
            severity: 'info',
            message: 'Consider using explicit JOIN syntax for better readability',
            suggestion: 'Replace comma-separated tables with explicit JOIN clauses',
            category: 'best-practice'
          })
        }
        return issues
      }
    })

    this.addRule({
      id: 'use-parameterized-queries',
      name: 'Use Parameterized Queries',
      description: 'Avoid string concatenation in SQL queries',
      category: 'security',
      severity: 'warning',
      enabled: true,
      check: (sql) => {
        const issues: LintIssue[] = []
        // Check for potential SQL injection patterns
        const suspiciousPatterns = [
          /\$\{.*\}/, // Template literals
          /\+.*\+/, // String concatenation
          /'[^']*'\s*\+/ // String concatenation with quotes
        ]
        
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(sql)) {
            issues.push({
              ruleId: 'use-parameterized-queries',
              ruleName: 'Use Parameterized Queries',
              severity: 'warning',
              message: 'Avoid string concatenation in SQL queries to prevent SQL injection',
              suggestion: 'Use parameterized queries or prepared statements',
              category: 'security'
            })
            break
          }
        }
        return issues
      }
    })

    // Style Rules
    this.addRule({
      id: 'consistent-case',
      name: 'Consistent Case',
      description: 'SQL keywords should be in consistent case',
      category: 'style',
      severity: 'info',
      enabled: true,
      check: (sql) => {
        const issues: LintIssue[] = []
        const keywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'INSERT', 'UPDATE', 'DELETE']
        const hasUpper = keywords.some(kw => sql.includes(kw))
        const hasLower = keywords.some(kw => sql.includes(kw.toLowerCase()))
        
        if (hasUpper && hasLower) {
          issues.push({
            ruleId: 'consistent-case',
            ruleName: 'Consistent Case',
            severity: 'info',
            message: 'SQL keywords should use consistent casing',
            suggestion: 'Use either all uppercase or all lowercase for keywords',
            category: 'style'
          })
        }
        return issues
      }
    })

    this.addRule({
      id: 'trailing-whitespace',
      name: 'No Trailing Whitespace',
      description: 'Remove trailing whitespace',
      category: 'style',
      severity: 'info',
      enabled: true,
      check: (sql) => {
        const issues: LintIssue[] = []
        const lines = sql.split('\n')
        lines.forEach((line, index) => {
          if (line.trim() !== line && line.endsWith(' ')) {
            issues.push({
              ruleId: 'trailing-whitespace',
              ruleName: 'No Trailing Whitespace',
              severity: 'info',
              message: `Line ${index + 1} has trailing whitespace`,
              line: index + 1,
              suggestion: 'Remove trailing spaces',
              category: 'style'
            })
          }
        })
        return issues
      }
    })
  }

  addRule(rule: LintRule) {
    this.rules.set(rule.id, rule)
  }

  removeRule(ruleId: string) {
    this.rules.delete(ruleId)
  }

  getRule(ruleId: string): LintRule | undefined {
    return this.rules.get(ruleId)
  }

  getAllRules(): LintRule[] {
    return Array.from(this.rules.values())
  }

  enableRule(ruleId: string) {
    const rule = this.rules.get(ruleId)
    if (rule) {
      rule.enabled = true
    }
  }

  disableRule(ruleId: string) {
    const rule = this.rules.get(ruleId)
    if (rule) {
      rule.enabled = false
    }
  }

  lint(sql: string, context?: any): LintResult {
    const issues: LintIssue[] = []
    
    // Get all enabled rules
    const enabledRules = Array.from(this.rules.values()).filter(rule => rule.enabled)
    
    // Run each rule
    for (const rule of enabledRules) {
      try {
        const ruleIssues = rule.check(sql, context)
        issues.push(...ruleIssues)
      } catch (error) {
        console.error(`Error running lint rule ${rule.id}:`, error)
      }
    }

    // Calculate score (100 - errors*10 - warnings*5 - info*1, minimum 0)
    const errors = issues.filter(i => i.severity === 'error').length
    const warnings = issues.filter(i => i.severity === 'warning').length
    const info = issues.filter(i => i.severity === 'info').length
    
    const score = Math.max(0, 100 - (errors * 10) - (warnings * 5) - (info * 1))

    return {
      valid: errors === 0,
      issues,
      score,
      summary: {
        errors,
        warnings,
        info
      }
    }
  }

  lintWithCustomRules(sql: string, ruleIds: string[], context?: any): LintResult {
    const issues: LintIssue[] = []
    
    for (const ruleId of ruleIds) {
      const rule = this.rules.get(ruleId)
      if (rule && rule.enabled) {
        try {
          const ruleIssues = rule.check(sql, context)
          issues.push(...ruleIssues)
        } catch (error) {
          console.error(`Error running lint rule ${ruleId}:`, error)
        }
      }
    }

    const errors = issues.filter(i => i.severity === 'error').length
    const warnings = issues.filter(i => i.severity === 'warning').length
    const info = issues.filter(i => i.severity === 'info').length
    
    const score = Math.max(0, 100 - (errors * 10) - (warnings * 5) - (info * 1))

    return {
      valid: errors === 0,
      issues,
      score,
      summary: {
        errors,
        warnings,
        info
      }
    }
  }
}

// Export singleton instance
export const sqlLinter = new SQLLinter()

