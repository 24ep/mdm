'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { sql } from '@codemirror/lang-sql'
import { autocompletion } from '@codemirror/autocomplete'
import { EditorView } from '@codemirror/view'
import { oneDark } from '@codemirror/theme-one-dark'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { createSQLAutocomplete, fetchDatabaseSchema } from '@/lib/sql-autocomplete'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import 'highlight.js/styles/github-dark.css'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  height?: string
  placeholder?: string
  readOnly?: boolean
  theme?: 'dark' | 'light'
  options?: {
    fontSize?: number
    fontFamily?: string
    tabSize?: number
    wordWrap?: boolean
    showLineNumbers?: boolean
    showGutter?: boolean
    enableBracketMatching?: boolean
    enableAutoIndent?: boolean
    enableFindReplace?: boolean
    enableCodeFolding?: boolean
    enableMinimap?: boolean
    enableAutoComplete?: boolean
    enableSyntaxValidation?: boolean
    enableErrorHighlighting?: boolean
    enableIntelliSense?: boolean
    enableSnippets?: boolean
    enableBracketPairColorization?: boolean
    enableIndentGuides?: boolean
    enableWordHighlight?: boolean
    enableCurrentLineHighlight?: boolean
    enableSelectionHighlight?: boolean
  }
  className?: string
}

export function CodeEditor({
  value,
  onChange,
  language = 'sql',
  height = '300px',
  placeholder,
  readOnly = false,
  theme = 'light',
  options = {},
  className = ''
}: CodeEditorProps) {
  const [dbSchema, setDbSchema] = useState<any>(null)
  const [sqlAutocomplete, setSqlAutocomplete] = useState<any>(null)
  
  // For SQL language, use CodeMirror with proper autocomplete
  const isSQL = language.toLowerCase() === 'sql'
  
  // Fetch database schema for SQL autocomplete
  useEffect(() => {
    if (isSQL && options.enableAutoComplete !== false) {
      fetchDatabaseSchema().then(schema => {
        setDbSchema(schema)
        const autocomplete = createSQLAutocomplete(schema, 'postgresql')
        setSqlAutocomplete(autocomplete)
      }).catch(err => {
        console.error('Failed to load database schema:', err)
      })
    }
  }, [isSQL, options.enableAutoComplete])

  // Memoize SQL extensions to avoid recreating them on every render
  const sqlExtensions = useMemo(() => {
    if (!isSQL) return []
    
    // Check if sql function is available
    if (typeof sql !== 'function') {
      console.warn('SQL extension not available, falling back to basic editor')
      return [
        EditorView.lineWrapping,
        EditorView.theme({
          '&': {
            fontSize: options.fontSize || 14,
            fontFamily: options.fontFamily || 'Monaco, Menlo, "Ubuntu Mono", monospace',
            height: height === '100%' ? '100%' : undefined,
            minHeight: height === '100%' ? undefined : height
          },
          '.cm-content': {
            padding: '8px',
            minHeight: height === '100%' ? '100%' : height
          },
          '.cm-scroller': {
            overflow: 'auto'
          }
        })
      ]
    }
    
    try {
      const sqlExtension = sql({ dialect: 'postgresql', upperCaseKeywords: true })
      
      // Define syntax highlighting styles
      const highlightStyle = HighlightStyle.define([
        { tag: tags.keyword, color: '#0077aa', fontWeight: 'bold' },
        { tag: tags.string, color: '#669900' },
        { tag: tags.comment, color: '#999988', fontStyle: 'italic' },
        { tag: tags.number, color: '#990055' },
        { tag: tags.definition(tags.variableName), color: '#0077aa' },
        { tag: tags.variableName, color: theme === 'dark' ? '#e6e6e6' : '#1a1a1a' },
        { tag: tags.operator, color: '#a67f59' },
        { tag: tags.typeName, color: '#0077aa' },
        { tag: tags.propertyName, color: '#0077aa' },
        { tag: tags.function(tags.variableName), color: '#6f42c1' },
        { tag: tags.className, color: '#0077aa' },
      ])
      
      // Configure autocomplete - always include it
      // If we have custom autocomplete, use it; otherwise use default SQL autocomplete
      const autocompleteExtension = sqlAutocomplete 
        ? autocompletion({ 
            override: [sqlAutocomplete],
            activateOnTyping: true,
            maxRenderedOptions: 10,
            defaultKeymap: true
          })
        : autocompletion({
            activateOnTyping: true,
            maxRenderedOptions: 10,
            defaultKeymap: true
          })
      
      return [
        sqlExtension, // Language extension first for syntax highlighting
        autocompleteExtension, // Autocomplete extension
        syntaxHighlighting(highlightStyle), // Explicit syntax highlighting
        EditorView.lineWrapping,
        EditorView.theme({
          '&': {
            fontSize: options.fontSize || 14,
            fontFamily: options.fontFamily || 'Monaco, Menlo, "Ubuntu Mono", monospace',
            height: height === '100%' ? '100%' : undefined,
            minHeight: height === '100%' ? undefined : height
          },
          '.cm-content': {
            padding: '8px',
            minHeight: height === '100%' ? '100%' : height
          },
          '.cm-scroller': {
            overflow: 'auto'
          }
        })
      ]
    } catch (error) {
      console.error('Error initializing SQL extensions:', error)
      return [
        EditorView.lineWrapping,
        EditorView.theme({
          '&': {
            fontSize: options.fontSize || 14,
            fontFamily: options.fontFamily || 'Monaco, Menlo, "Ubuntu Mono", monospace',
            height: height === '100%' ? '100%' : undefined,
            minHeight: height === '100%' ? undefined : height
          },
          '.cm-content': {
            padding: '8px',
            minHeight: height === '100%' ? '100%' : height
          },
          '.cm-scroller': {
            overflow: 'auto'
          }
        })
      ]
    }
  }, [isSQL, sqlAutocomplete, options.fontSize, options.fontFamily, height, theme])

  // If SQL language, use CodeMirror with proper autocomplete
  if (isSQL) {
    return (
      <div className={`w-full ${className}`} style={{ height }}>
        <CodeMirror
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          height={height}
          theme={theme === 'dark' ? oneDark : undefined}
          extensions={sqlExtensions}
          basicSetup={{
            lineNumbers: options.showLineNumbers !== false,
            highlightActiveLine: true,
            bracketMatching: options.enableBracketMatching !== false,
            closeBrackets: true,
            autocompletion: options.enableAutoComplete !== false,
            searchKeymap: true,
            history: true,
            indentOnInput: true,
            defaultKeymap: true,
            foldGutter: options.enableCodeFolding !== false,
            tabSize: options.tabSize || 2
          }}
        />
      </div>
    )
  }

  // For other languages, use the existing custom implementation
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const [lineNumbers, setLineNumbers] = useState<string[]>([])
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 })
  const [selectedText, setSelectedText] = useState('')
  const [showFindReplace, setShowFindReplace] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [findResults, setFindResults] = useState<number[]>([])
  const [currentFindIndex, setCurrentFindIndex] = useState(0)
  const [foldedLines, setFoldedLines] = useState<Set<number>>(new Set())
  const [highlightedCode, setHighlightedCode] = useState<string>('')
  const [syntaxErrors, setSyntaxErrors] = useState<Array<{line: number, column: number, message: string, severity: 'error' | 'warning' | 'info'}>>([])
  const [autoCompleteSuggestions, setAutoCompleteSuggestions] = useState<string[]>([])
  const [showAutoComplete, setShowAutoComplete] = useState(false)
  const [autoCompletePosition, setAutoCompletePosition] = useState({top: 0, left: 0})
  const [currentWord, setCurrentWord] = useState('')
  const [bracketPairs, setBracketPairs] = useState<Array<{open: number, close: number, type: string}>>([])
  const [wordOccurrences, setWordOccurrences] = useState<number[]>([])
  const [currentLineHighlight, setCurrentLineHighlight] = useState<number>(1)
  const [codeSnippets, setCodeSnippets] = useState<Array<{trigger: string, content: string, description: string}>>([])
  const [showSnippets, setShowSnippets] = useState(false)
  const [snippetSuggestions, setSnippetSuggestions] = useState<Array<{trigger: string, content: string, description: string}>>([])

  // Syntax highlighting using highlight.js
  const highlightSyntax = useCallback((code: string, lang: string) => {
    if (!code) return ''

    try {
      // Map language names to highlight.js language identifiers
      const languageMap: { [key: string]: string } = {
        'sql': 'sql',
        'javascript': 'javascript',
        'js': 'javascript',
        'python': 'python',
        'py': 'python',
        'html': 'html',
        'css': 'css',
        'json': 'json',
        'xml': 'xml',
        'yaml': 'yaml',
        'yml': 'yaml',
        'markdown': 'markdown',
        'md': 'markdown',
        'bash': 'bash',
        'shell': 'bash',
        'typescript': 'typescript',
        'ts': 'typescript',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'csharp': 'csharp',
        'php': 'php',
        'ruby': 'ruby',
        'go': 'go',
        'rust': 'rust',
        'swift': 'swift',
        'kotlin': 'kotlin',
        'scala': 'scala',
        'r': 'r',
        'matlab': 'matlab',
        'dart': 'dart',
        'dart': 'dart'
      }

      const hljsLang = languageMap[lang.toLowerCase()] || 'plaintext'
      
      if (hljsLang === 'plaintext') {
        return code
      }

      const highlighted = hljs.highlight(code, { language: hljsLang })
      return highlighted.value
    } catch (error) {
      console.warn('Syntax highlighting failed:', error)
      return code
    }
  }, [])

  // Auto-completion functionality with database and data model snippets
  const getAutoCompleteSuggestions = useCallback((word: string, language: string) => {
    const suggestions: { [key: string]: string[] } = {
      sql: [
        'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP',
        'TABLE', 'INDEX', 'VIEW', 'PROCEDURE', 'FUNCTION', 'TRIGGER', 'DATABASE', 'SCHEMA',
        'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'ON', 'AS', 'AND', 'OR', 'NOT', 'IN',
        'EXISTS', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'ORDER', 'BY', 'GROUP', 'HAVING',
        'UNION', 'DISTINCT', 'LIMIT', 'OFFSET', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
        'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'UPPER', 'LOWER', 'LENGTH', 'SUBSTRING', 'CONCAT',
        // Database and Data Model specific
        'users', 'spaces', 'data_models', 'attributes', 'entities', 'entity_types', 'values',
        'relationships', 'notifications', 'user_roles', 'space_permissions', 'data_model_spaces',
        'attribute_values', 'entity_attributes', 'model_relationships', 'space_associations'
      ],
      javascript: [
        'function', 'var', 'let', 'const', 'if', 'else', 'for', 'while', 'do', 'switch', 'case',
        'break', 'continue', 'return', 'try', 'catch', 'finally', 'throw', 'new', 'this',
        'class', 'extends', 'import', 'export', 'default', 'async', 'await', 'promise',
        'console', 'log', 'error', 'warn', 'info', 'debug', 'setTimeout', 'setInterval',
        'document', 'window', 'navigator', 'location', 'history', 'localStorage', 'sessionStorage'
      ],
      python: [
        'def', 'class', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally',
        'import', 'from', 'as', 'return', 'yield', 'lambda', 'with', 'as', 'pass', 'break',
        'continue', 'raise', 'assert', 'del', 'global', 'nonlocal', 'and', 'or', 'not',
        'in', 'is', 'True', 'False', 'None', 'print', 'len', 'str', 'int', 'float', 'list',
        'dict', 'tuple', 'set', 'range', 'enumerate', 'zip', 'map', 'filter', 'reduce'
      ],
      html: [
        'html', 'head', 'body', 'title', 'meta', 'link', 'script', 'style', 'div', 'span',
        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'ul', 'ol', 'li', 'table',
        'tr', 'td', 'th', 'form', 'input', 'button', 'textarea', 'select', 'option',
        'class', 'id', 'src', 'href', 'alt', 'title', 'style', 'onclick', 'onload'
      ],
      css: [
        'color', 'background', 'font', 'margin', 'padding', 'border', 'width', 'height',
        'display', 'position', 'top', 'left', 'right', 'bottom', 'z-index', 'opacity',
        'transform', 'transition', 'animation', 'flex', 'grid', 'float', 'clear',
        'text-align', 'text-decoration', 'line-height', 'letter-spacing', 'word-spacing'
      ]
    }

    const langSuggestions = suggestions[language.toLowerCase()] || []
    return langSuggestions.filter(suggestion => 
      suggestion.toLowerCase().startsWith(word.toLowerCase())
    ).slice(0, 10)
  }, [])

  // Syntax validation
  const validateSyntax = useCallback((code: string, language: string) => {
    const errors: Array<{line: number, column: number, message: string, severity: 'error' | 'warning' | 'info'}> = []
    
    if (language === 'sql') {
      // Basic SQL validation
      const lines = code.split('\n')
      lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim()
        
        // Check for unmatched quotes
        const singleQuotes = (line.match(/'/g) || []).length
        const doubleQuotes = (line.match(/"/g) || []).length
        
        if (singleQuotes % 2 !== 0) {
          errors.push({
            line: lineIndex + 1,
            column: line.indexOf("'") + 1,
            message: 'Unmatched single quote',
            severity: 'error'
          })
        }
        
        if (doubleQuotes % 2 !== 0) {
          errors.push({
            line: lineIndex + 1,
            column: line.indexOf('"') + 1,
            message: 'Unmatched double quote',
            severity: 'error'
          })
        }
        
        // Check for basic SQL syntax
        if (trimmedLine.startsWith('SELECT') && !trimmedLine.includes('FROM')) {
          errors.push({
            line: lineIndex + 1,
            column: 1,
            message: 'SELECT statement should have FROM clause',
            severity: 'warning'
          })
        }
      })
    } else if (language === 'javascript') {
      // Basic JavaScript validation
      const lines = code.split('\n')
      lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim()
        
        // Check for unmatched brackets
        const openBrackets = (line.match(/[{[\(]/g) || []).length
        const closeBrackets = (line.match(/[}\]\)]/g) || []).length
        
        if (openBrackets !== closeBrackets) {
          errors.push({
            line: lineIndex + 1,
            column: 1,
            message: 'Unmatched brackets',
            severity: 'error'
          })
        }
        
        // Check for missing semicolons (basic)
        if (trimmedLine && !trimmedLine.endsWith(';') && !trimmedLine.endsWith('{') && !trimmedLine.endsWith('}')) {
          if (trimmedLine.includes('=') || trimmedLine.includes('return')) {
            errors.push({
              line: lineIndex + 1,
              column: trimmedLine.length,
              message: 'Consider adding semicolon',
              severity: 'info'
            })
          }
        }
      })
    }
    
    return errors
  }, [])

  // Bracket matching
  const findBracketPairs = useCallback((code: string) => {
    const pairs: Array<{open: number, close: number, type: string}> = []
    const stack: Array<{pos: number, type: string}> = []
    const bracketMap: { [key: string]: string } = {
      '(': ')',
      '[': ']',
      '{': '}',
      '<': '>'
    }
    
    for (let i = 0; i < code.length; i++) {
      const char = code[i]
      
      if (['(', '[', '{', '<'].includes(char)) {
        stack.push({ pos: i, type: char })
      } else if ([')', ']', '}', '>'].includes(char)) {
        const lastOpen = stack.pop()
        if (lastOpen && bracketMap[lastOpen.type] === char) {
          pairs.push({
            open: lastOpen.pos,
            close: i,
            type: lastOpen.type + char
          })
        }
      }
    }
    
    return pairs
  }, [])

  // Word highlighting
  const findWordOccurrences = useCallback((code: string, word: string) => {
    const occurrences: number[] = []
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    let match
    
    while ((match = regex.exec(code)) !== null) {
      occurrences.push(match.index)
    }
    
    return occurrences
  }, [])

  // Code snippets for database and data model operations
  const getCodeSnippets = useCallback((language: string) => {
    const snippets: Array<{trigger: string, content: string, description: string}> = [
      // Database Operations
      {
        trigger: 'db-create',
        content: `CREATE DATABASE \${1:database_name}
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;`,
        description: 'Create Database'
      },
      {
        trigger: 'db-drop',
        content: `DROP DATABASE IF EXISTS \${1:database_name};`,
        description: 'Drop Database'
      },
      {
        trigger: 'db-backup',
        content: `-- Backup database
mysqldump -u \${1:username} -p \${2:database_name} > \${3:backup_file.sql}`,
        description: 'Database Backup'
      },
      
      // Data Model Operations
      {
        trigger: 'model-create',
        content: `CREATE TABLE \${1:table_name} (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`,
        description: 'Create Data Model Table'
      },
      {
        trigger: 'model-alter',
        content: `ALTER TABLE \${1:table_name} 
ADD COLUMN \${2:column_name} \${3:data_type} \${4:constraints};`,
        description: 'Alter Data Model'
      },
      {
        trigger: 'model-index',
        content: `CREATE INDEX idx_\${1:index_name} ON \${2:table_name} (\${3:column_name});`,
        description: 'Create Index'
      },
      
      // Entity Operations
      {
        trigger: 'entity-select',
        content: `SELECT 
    e.id,
    e.name,
    e.description,
    et.name as entity_type,
    e.created_at
FROM entities e
JOIN entity_types et ON e.entity_type_id = et.id
WHERE e.space_id = \${1:space_id}
ORDER BY e.created_at DESC;`,
        description: 'Select Entities with Type'
      },
      {
        trigger: 'entity-insert',
        content: `INSERT INTO entities (name, description, entity_type_id, space_id, created_by)
VALUES (\${1:'entity_name'}, \${2:'description'}, \${3:entity_type_id}, \${4:space_id}, \${5:user_id});`,
        description: 'Insert Entity'
      },
      {
        trigger: 'entity-update',
        content: `UPDATE entities 
SET name = \${1:'new_name'}, 
    description = \${2:'new_description'},
    updated_at = CURRENT_TIMESTAMP
WHERE id = \${3:entity_id};`,
        description: 'Update Entity'
      },
      
      // Attribute Operations
      {
        trigger: 'attr-select',
        content: `SELECT 
    a.id,
    a.name,
    a.data_type,
    a.is_required,
    a.default_value,
    av.value as attribute_value
FROM attributes a
LEFT JOIN attribute_values av ON a.id = av.attribute_id
WHERE a.data_model_id = \${1:data_model_id}
ORDER BY a.name;`,
        description: 'Select Attributes with Values'
      },
      {
        trigger: 'attr-insert',
        content: `INSERT INTO attributes (name, data_type, is_required, default_value, data_model_id)
VALUES (\${1:'attribute_name'}, \${2:'VARCHAR'}, \${3:true}, \${4:NULL}, \${5:data_model_id});`,
        description: 'Insert Attribute'
      },
      
      // Space Operations
      {
        trigger: 'space-select',
        content: `SELECT 
    s.id,
    s.name,
    s.slug,
    s.description,
    COUNT(dm.id) as model_count,
    s.created_at
FROM spaces s
LEFT JOIN data_models dm ON s.id = dm.space_id
WHERE s.id = \${1:space_id}
GROUP BY s.id;`,
        description: 'Select Space with Model Count'
      },
      {
        trigger: 'space-join',
        content: `SELECT 
    s.name as space_name,
    dm.name as model_name,
    COUNT(e.id) as entity_count
FROM spaces s
JOIN data_models dm ON s.id = dm.space_id
LEFT JOIN entities e ON dm.id = e.data_model_id
WHERE s.id = \${1:space_id}
GROUP BY s.id, dm.id;`,
        description: 'Space with Models and Entities'
      },
      
      // Relationship Operations
      {
        trigger: 'rel-select',
        content: `SELECT 
    r.id,
    r.name,
    r.description,
    e1.name as source_entity,
    e2.name as target_entity,
    r.relationship_type
FROM relationships r
JOIN entities e1 ON r.source_entity_id = e1.id
JOIN entities e2 ON r.target_entity_id = e2.id
WHERE r.data_model_id = \${1:data_model_id};`,
        description: 'Select Relationships'
      },
      
      // User and Permission Operations
      {
        trigger: 'user-select',
        content: `SELECT 
    u.id,
    u.email,
    u.name,
    ur.role,
    sp.permission_level,
    s.name as space_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN space_permissions sp ON u.id = sp.user_id
LEFT JOIN spaces s ON sp.space_id = s.id
WHERE u.id = \${1:user_id};`,
        description: 'Select User with Roles and Permissions'
      },
      
      // Analytics Queries
      {
        trigger: 'analytics-models',
        content: `SELECT 
    s.name as space_name,
    COUNT(dm.id) as total_models,
    COUNT(e.id) as total_entities,
    COUNT(a.id) as total_attributes
FROM spaces s
LEFT JOIN data_models dm ON s.id = dm.space_id
LEFT JOIN entities e ON dm.id = e.data_model_id
LEFT JOIN attributes a ON dm.id = a.data_model_id
GROUP BY s.id, s.name
ORDER BY total_models DESC;`,
        description: 'Analytics: Models per Space'
      },
      {
        trigger: 'analytics-usage',
        content: `SELECT 
    DATE(created_at) as date,
    COUNT(*) as entity_count,
    COUNT(DISTINCT data_model_id) as models_used
FROM entities
WHERE created_at >= DATE_SUB(NOW(), INTERVAL \${1:30} DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;`,
        description: 'Analytics: Usage Over Time'
      }
    ]
    
    return snippets
  }, [])

  // Generate line numbers and highlighted code
  useEffect(() => {
    const lines = value.split('\n')
    const numbers = lines.map((_, index) => (index + 1).toString())
    setLineNumbers(numbers)
    
    // Generate syntax highlighted code using highlight.js
    const highlighted = highlightSyntax(value, language)
    setHighlightedCode(highlighted)
    
    // Validate syntax if enabled
    if (options.enableSyntaxValidation) {
      const errors = validateSyntax(value, language)
      setSyntaxErrors(errors)
    }
    
    // Find bracket pairs if enabled
    if (options.enableBracketMatching) {
      const pairs = findBracketPairs(value)
      setBracketPairs(pairs)
    }
    
    // Update current line highlight
    setCurrentLineHighlight(cursorPosition.line)
    
    // Initialize code snippets
    if (options.enableSnippets) {
      const snippets = getCodeSnippets(language)
      setCodeSnippets(snippets)
    }
  }, [value, language, highlightSyntax, validateSyntax, findBracketPairs, getCodeSnippets, options.enableSyntaxValidation, options.enableBracketMatching, options.enableSnippets, cursorPosition.line])

  // Update cursor position
  const updateCursorPosition = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const textBeforeCursor = value.substring(0, start)
      const lines = textBeforeCursor.split('\n')
      const line = lines.length
      const column = lines[lines.length - 1].length + 1
      setCursorPosition({ line, column })
      
      // Update selected text
      if (start !== end) {
        setSelectedText(value.substring(start, end))
      } else {
        setSelectedText('')
      }
    }
  }

  // Find and replace functionality
  const findTextInCode = useCallback((searchText: string) => {
    if (!searchText) {
      setFindResults([])
      setCurrentFindIndex(0)
      return
    }
    
    const results: number[] = []
    const lines = value.split('\n')
    let currentIndex = 0
    
    lines.forEach((line, lineIndex) => {
      const lineStart = currentIndex
      const lineEnd = currentIndex + line.length
      
      let searchIndex = line.indexOf(searchText)
      while (searchIndex !== -1) {
        results.push(lineStart + searchIndex)
        searchIndex = line.indexOf(searchText, searchIndex + 1)
      }
      
      currentIndex = lineEnd + 1 // +1 for newline
    })
    
    setFindResults(results)
    setCurrentFindIndex(0)
  }, [value])

  const replaceTextInCode = useCallback((searchText: string, replaceText: string) => {
    const newValue = value.replace(new RegExp(searchText, 'g'), replaceText)
    onChange(newValue)
    findTextInCode(searchText)
  }, [value, onChange, findTextInCode])

  const goToNextFind = () => {
    if (findResults.length > 0) {
      const nextIndex = (currentFindIndex + 1) % findResults.length
      setCurrentFindIndex(nextIndex)
      selectTextAtPosition(findResults[nextIndex], findText.length)
    }
  }

  const goToPreviousFind = () => {
    if (findResults.length > 0) {
      const prevIndex = currentFindIndex === 0 ? findResults.length - 1 : currentFindIndex - 1
      setCurrentFindIndex(prevIndex)
      selectTextAtPosition(findResults[prevIndex], findText.length)
    }
  }

  const selectTextAtPosition = (start: number, length: number) => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(start, start + length)
    }
  }

  // Code folding functionality
  const toggleLineFold = (lineNumber: number) => {
    const newFoldedLines = new Set(foldedLines)
    if (newFoldedLines.has(lineNumber)) {
      newFoldedLines.delete(lineNumber)
    } else {
      newFoldedLines.add(lineNumber)
    }
    setFoldedLines(newFoldedLines)
  }

  // Keyboard shortcuts
  const handleKeyboardShortcuts = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+F for find
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault()
      setShowFindReplace(true)
      return
    }
    
    // Ctrl+H for find and replace
    if (e.ctrlKey && e.key === 'h') {
      e.preventDefault()
      setShowFindReplace(true)
      return
    }
    
    // Ctrl+Shift+P for snippets
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      e.preventDefault()
      setShowSnippets(true)
      const snippets = getCodeSnippets(language)
      setSnippetSuggestions(snippets)
      return
    }
    
    // Ctrl+A for select all
    if (e.ctrlKey && e.key === 'a') {
      e.preventDefault()
      if (textareaRef.current) {
        textareaRef.current.select()
      }
      return
    }
    
    // Ctrl+Z for undo (basic implementation)
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault()
      // Note: This is a basic implementation. For full undo/redo, you'd need a history stack
      return
    }
    
    // Ctrl+Y for redo
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault()
      return
    }
    
    // Ctrl+D for duplicate line
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = value.substring(start, end)
      const newValue = value.substring(0, end) + selectedText + value.substring(end)
      onChange(newValue)
      return
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle keyboard shortcuts first
    handleKeyboardShortcuts(e)
    
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const tabSize = options.tabSize || 2
      const spaces = ' '.repeat(tabSize)
      const newValue = value.substring(0, start) + spaces + value.substring(end)
      onChange(newValue)
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + tabSize
        updateCursorPosition()
      }, 0)
    } else if (e.key === 'Enter') {
      // Auto-indent on new line
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const textBeforeCursor = value.substring(0, start)
      const lines = textBeforeCursor.split('\n')
      const currentLine = lines[lines.length - 1]
      const indent = currentLine.match(/^(\s*)/)?.[1] || ''
      
      setTimeout(() => {
        const newValue = value.substring(0, start) + '\n' + indent + value.substring(start)
        onChange(newValue)
        textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length
        updateCursorPosition()
      }, 0)
    } else if (e.key === 'ArrowDown' && showAutoComplete && autoCompleteSuggestions.length > 0) {
      e.preventDefault()
      // Handle auto-complete navigation
    } else if (e.key === 'ArrowUp' && showAutoComplete && autoCompleteSuggestions.length > 0) {
      e.preventDefault()
      // Handle auto-complete navigation
    } else if (e.key === 'Escape') {
      setShowAutoComplete(false)
    } else if (options.enableAutoComplete && (e.key === ' ' || e.key === '.' || e.key === '(')) {
      // Trigger auto-completion
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const textBeforeCursor = value.substring(0, start)
      const words = textBeforeCursor.split(/\s+/)
      const currentWord = words[words.length - 1]
      
      if (currentWord.length > 1) {
        const suggestions = getAutoCompleteSuggestions(currentWord, language)
        if (suggestions.length > 0) {
          setAutoCompleteSuggestions(suggestions)
          setCurrentWord(currentWord)
          setShowAutoComplete(true)
          
          // Calculate position for auto-complete dropdown
          const rect = textarea.getBoundingClientRect()
          setAutoCompletePosition({
            top: rect.top + 20,
            left: rect.left + 10
          })
        }
      }
    } else if (options.enableSnippets && e.key === 'Tab') {
      // Check for snippet triggers
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const textBeforeCursor = value.substring(0, start)
      const lines = textBeforeCursor.split('\n')
      const currentLine = lines[lines.length - 1]
      
      // Look for snippet triggers
      const matchingSnippet = codeSnippets.find(snippet => 
        currentLine.trim().endsWith(snippet.trigger)
      )
      
      if (matchingSnippet) {
        e.preventDefault()
        const beforeTrigger = currentLine.substring(0, currentLine.lastIndexOf(matchingSnippet.trigger))
        const afterCursor = value.substring(start)
        const newValue = value.substring(0, start - matchingSnippet.trigger.length) + 
                        matchingSnippet.content + afterCursor
        onChange(newValue)
        
        setTimeout(() => {
          textarea.focus()
          updateCursorPosition()
        }, 0)
        return
      }
    } else {
      updateCursorPosition()
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop
    }
  }

  const handleSelectionChange = () => {
    updateCursorPosition()
  }

  const getFontSize = () => {
    return options.fontSize || 14
  }

  const getFontFamily = () => {
    return options.fontFamily || 'Monaco, Menlo, "Ubuntu Mono", monospace'
  }

  const getTabSize = () => {
    return options.tabSize || 2
  }

  const showLineNumbers = options.showLineNumbers !== false

  const isFullHeight = height === '100%'
  return (
    <div className={`w-full ${isFullHeight ? 'h-full flex flex-col' : ''} ${className} overflow-hidden`}>
      {/* Editor Header */}
      <div className={`flex items-center justify-between px-3 py-2 text-xs border-b ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700 text-gray-300' 
          : 'bg-gray-50 border-gray-200 text-gray-600'
      }`}>
        <div className="flex items-center gap-4">
          <span className="font-medium">{language.toUpperCase()}</span>
          {!readOnly && (
            <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
          )}
          {selectedText && (
            <span className="text-blue-600">{selectedText.length} chars selected</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>{value.length} chars</span>
          <span>•</span>
          <span>{lineNumbers.length} lines</span>
          {options.enableFindReplace && (
            <button
              onClick={() => setShowFindReplace(!showFindReplace)}
              className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
            >
              Find
            </button>
          )}
        </div>
      </div>

      {/* Find & Replace Panel */}
      {showFindReplace && options.enableFindReplace && (
        <div className={`px-3 py-2 border-b ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Find..."
              value={findText}
              onChange={(e) => {
                setFindText(e.target.value)
                findTextInCode(e.target.value)
              }}
              className={`px-2 py-1 text-xs border rounded ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-gray-100' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              className={`px-2 py-1 text-xs border rounded ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-gray-100' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <button
              onClick={goToPreviousFind}
              disabled={findResults.length === 0}
              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-50 rounded"
            >
              ↑
            </button>
            <button
              onClick={goToNextFind}
              disabled={findResults.length === 0}
              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-50 rounded"
            >
              ↓
            </button>
            <span className="text-xs text-gray-500">
              {findResults.length > 0 ? `${currentFindIndex + 1}/${findResults.length}` : '0/0'}
            </span>
            <button
              onClick={() => replaceTextInCode(findText, replaceText)}
              disabled={!findText || !replaceText}
              className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 disabled:opacity-50 rounded"
            >
              Replace All
            </button>
            <button
              onClick={() => setShowFindReplace(false)}
              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className={`flex ${isFullHeight ? 'flex-1 min-h-0' : ''}`}>
        {/* Line Numbers */}
        {showLineNumbers && (
          <div 
            ref={lineNumbersRef}
            className={`${
              theme === 'dark' 
                ? 'bg-gray-900 border-r border-gray-700 text-gray-500' 
                : 'bg-gray-50 border-r border-gray-200 text-gray-500'
            } px-2 py-3 text-xs select-none ${isFullHeight ? 'overflow-y-auto' : 'overflow-hidden'}`}
            style={{ 
              fontFamily: getFontFamily(),
              fontSize: getFontSize(),
              ...(isFullHeight ? {} : { minHeight: height }),
              width: '50px'
            }}
          >
            {lineNumbers.map((num, index) => {
              const lineNum = index + 1
              const hasError = syntaxErrors.some(error => error.line === lineNum)
              const hasWarning = syntaxErrors.some(error => error.line === lineNum && error.severity === 'warning')
              
              return (
                <div 
                  key={index} 
                  className={`text-right flex items-center justify-between ${
                    lineNum === cursorPosition.line ? 'text-blue-600 font-medium' : ''
                  } ${hasError ? 'text-red-500' : hasWarning ? 'text-yellow-500' : ''}`}
                >
                  <span>{num}</span>
                  {hasError && <span className="text-red-500">●</span>}
                  {hasWarning && <span className="text-yellow-500">●</span>}
                </div>
              )
            })}
          </div>
        )}
        
        {/* Code Editor */}
        <div className={`flex-1 relative ${isFullHeight ? 'min-h-0' : ''}`}>
          {/* Syntax Highlighting Overlay */}
          <div 
            className={`absolute inset-0 pointer-events-none p-0 ${isFullHeight ? 'overflow-y-auto' : 'overflow-hidden'} ${
              theme === 'dark' 
                ? 'bg-gray-900' 
                : 'bg-white'
            }`}
            style={{
              fontFamily: getFontFamily(),
              fontSize: getFontSize(),
              ...(isFullHeight ? {} : { minHeight: height }),
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              wordWrap: options.wordWrap ? 'break-word' : 'normal'
            }}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
          
          {/* Code Snippets dropdown */}
          {showSnippets && options.enableSnippets && snippetSuggestions.length > 0 && (
            <div 
              className={`absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto ${
                theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
              }`}
              style={{
                top: '50px',
                left: '10px',
                minWidth: '300px'
              }}
            >
              <div className="p-2 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Code Snippets</span>
                  <button
                    onClick={() => setShowSnippets(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {snippetSuggestions.map((snippet, index) => (
                <div
                  key={index}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 border-b border-gray-100 ${
                    theme === 'dark' ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-blue-100 text-gray-900'
                  }`}
                  onClick={() => {
                    // Insert snippet
                    const textarea = textareaRef.current
                    if (textarea) {
                      const start = textarea.selectionStart
                      const end = textarea.selectionEnd
                      const newValue = value.substring(0, start) + snippet.content + value.substring(end)
                      onChange(newValue)
                      
                      setTimeout(() => {
                        textarea.focus()
                        updateCursorPosition()
                      }, 0)
                    }
                    setShowSnippets(false)
                  }}
                >
                  <div className="font-medium">{snippet.trigger}</div>
                  <div className="text-xs text-gray-500">{snippet.description}</div>
                </div>
              ))}
            </div>
          )}

          {/* Auto-completion dropdown */}
          {showAutoComplete && options.enableAutoComplete && autoCompleteSuggestions.length > 0 && (
            <div 
              className={`absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto ${
                theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
              }`}
              style={{
                top: autoCompletePosition.top,
                left: autoCompletePosition.left,
                minWidth: '200px'
              }}
            >
              {autoCompleteSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 ${
                    theme === 'dark' ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-blue-100 text-gray-900'
                  }`}
                  onClick={() => {
                    // Insert suggestion
                    const textarea = textareaRef.current
                    if (textarea) {
                      const start = textarea.selectionStart
                      const end = textarea.selectionEnd
                      const beforeCursor = value.substring(0, start - currentWord.length)
                      const afterCursor = value.substring(end)
                      const newValue = beforeCursor + suggestion + afterCursor
                      onChange(newValue)
                      
                      setTimeout(() => {
                        textarea.focus()
                        textarea.selectionStart = textarea.selectionEnd = start - currentWord.length + suggestion.length
                        updateCursorPosition()
                      }, 0)
                    }
                    setShowAutoComplete(false)
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
          
          {/* Error tooltips */}
          {syntaxErrors.map((error, index) => (
            <div
              key={index}
              className={`absolute z-40 px-2 py-1 text-xs rounded shadow-lg ${
                error.severity === 'error' 
                  ? 'bg-red-100 text-red-800 border border-red-300' 
                  : error.severity === 'warning'
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : 'bg-blue-100 text-blue-800 border border-blue-300'
              }`}
              style={{
                top: `${(error.line - 1) * 20 + 12}px`,
                left: `${error.column * 8 + 60}px`
              }}
            >
              {error.message}
            </div>
          ))}
          
          {/* Transparent textarea for input */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              updateCursorPosition()
            }}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            onSelect={handleSelectionChange}
            onKeyUp={handleSelectionChange}
            onMouseUp={handleSelectionChange}
            placeholder={placeholder}
            readOnly={readOnly}
            className={`w-full h-full resize-none border-0 focus:ring-0 focus:outline-none p-0 relative z-10 ${
              theme === 'dark' 
                ? 'bg-transparent text-transparent placeholder-gray-500 caret-white' 
                : 'bg-transparent text-transparent placeholder-gray-400 caret-gray-900'
            }`}
            style={{
              fontFamily: getFontFamily(),
              fontSize: getFontSize(),
              ...(isFullHeight ? { height: '100%' } : { minHeight: height }),
              tabSize: getTabSize(),
              wordWrap: options.wordWrap ? 'break-word' : 'normal',
              lineHeight: '1.5'
            }}
          />
        </div>
      </div>
    </div>
  )
}
