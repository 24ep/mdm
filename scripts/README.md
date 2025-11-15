# TypeScript Error Scanner Scripts

This directory contains scripts to scan the codebase for TypeScript errors.

## Usage

### Node.js Script (Cross-platform)

```bash
# Run the scanner
npm run scan:ts

# Or directly
node scripts/scan-typescript-errors.js
```

### PowerShell Script (Windows)

```powershell
# Run the PowerShell version
.\scripts\scan-typescript-errors.ps1
```

## Features

The scanner will:

1. ✅ Run TypeScript compiler (`tsc --noEmit`)
2. ✅ Parse all TypeScript errors
3. ✅ Group errors by file
4. ✅ Display errors with line numbers, error codes, and messages
5. ✅ Provide a summary with error counts
6. ✅ Scan for common issues (any types, @ts-ignore, etc.)
7. ✅ Exit with proper error codes for CI/CD

## Output

The script provides:

- **Error Details**: File path, line number, column, error code, and message
- **Summary**: Total error count and files affected
- **Error Code Breakdown**: Count of each error type
- **Common Issues**: Warnings about `any` types, `@ts-ignore` comments, etc.

## Integration

### CI/CD

Add to your CI pipeline:

```yaml
# GitHub Actions example
- name: Check TypeScript
  run: npm run scan:ts
```

### Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
npm run scan:ts
```

## Exit Codes

- `0`: No errors found
- `1`: Errors found (for CI/CD integration)

