# TypeScript Error Scanner (PowerShell)
# Scans the entire codebase for TypeScript errors and reports them

Write-Host "`n🔍 TypeScript Error Scanner`n" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Blue

$startTime = Get-Date

try {
    Write-Host "`n📋 Running TypeScript compiler...`n" -ForegroundColor Blue
    
    # Run TypeScript compiler
    $tscOutput = & npx tsc --noEmit --pretty false 2>&1 | Out-String
    
    # Check if there are errors
    if ($LASTEXITCODE -eq 0 -or $tscOutput -notmatch "error TS") {
        Write-Host "`n✅ No TypeScript errors found!`n" -ForegroundColor Green
    } else {
        Write-Host "`n❌ TypeScript errors found:`n" -ForegroundColor Red
        
        # Parse and display errors
        $errorLines = $tscOutput -split "`n" | Where-Object { $_ -match "error TS" }
        
        $errors = @{}
        foreach ($line in $errorLines) {
            if ($line -match "(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)") {
                $file = $matches[1]
                $lineNum = $matches[2]
                $col = $matches[3]
                $code = $matches[4]
                $message = $matches[5]
                
                if (-not $errors.ContainsKey($file)) {
                    $errors[$file] = @()
                }
                
                $errors[$file] += @{
                    Line = $lineNum
                    Column = $col
                    Code = $code
                    Message = $message
                }
            }
        }
        
        # Display errors grouped by file
        foreach ($file in ($errors.Keys | Sort-Object)) {
            Write-Host "`n📄 $file" -ForegroundColor Yellow
            $fileErrors = $errors[$file]
            
            for ($i = 0; $i -lt $fileErrors.Count; $i++) {
                $error = $fileErrors[$i]
                Write-Host "`n   Error $($i + 1):" -ForegroundColor Red
                Write-Host "   Line: $($error.Line), Column: $($error.Column)"
                Write-Host "   Code: $($error.Code)" -ForegroundColor Yellow
                Write-Host "   Message: $($error.Message)" -ForegroundColor Red
            }
        }
        
        Write-Host "`n" + ("=" * 60) -ForegroundColor Blue
        Write-Host "`n📊 Summary:" -ForegroundColor Cyan
        $totalErrors = ($errors.Values | Measure-Object -Property Count -Sum).Sum
        Write-Host "   Total errors: $totalErrors" -ForegroundColor Red
        Write-Host "   Files with errors: $($errors.Count)" -ForegroundColor Red
    }
    
    $duration = ((Get-Date) - $startTime).TotalSeconds
    Write-Host "`n⏱️  Scan completed in $([math]::Round($duration, 2))s" -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor Blue
    Write-Host ""
    
    if ($LASTEXITCODE -ne 0) {
        exit 1
    }
    
} catch {
    Write-Host "`n❌ Error running TypeScript compiler:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

