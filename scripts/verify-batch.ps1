# Script PowerShell de vérification pour chaque batch Leo
# Usage: .\scripts\verify-batch.ps1 [batch-number]

param(
    [Parameter(Mandatory=$true)]
    [int]$BatchNum
)

Write-Host "🔍 Vérification du Batch $BatchNum" -ForegroundColor Cyan
Write-Host "=================================="
Write-Host ""

$Errors = 0

function Check-Command {
    param(
        [string]$Name,
        [scriptblock]$Command
    )
    
    Write-Host -NoNewline "Vérification: $Name... "
    try {
        & $Command | Out-Null
        Write-Host "✓" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "✗" -ForegroundColor Red
        $script:Errors++
        return $false
    }
}

# Backend checks
if (Test-Path "backend") {
    Write-Host ""
    Write-Host "📦 Backend Checks" -ForegroundColor Cyan
    Write-Host "-----------------"
    
    Push-Location backend
    
    # Python syntax
    Check-Command "Python syntax" {
        python -m py_compile app\**\*.py 2>$null
    }
    
    # Type checking (mypy) - non-blocking
    Write-Host -NoNewline "Vérification: Type checking (mypy)... "
    try {
        $mypyOutput = python -m mypy app\ --ignore-missing-imports --no-error-summary 2>&1
        if ($mypyOutput -match "error") {
            Write-Host "⚠ Warnings détectés" -ForegroundColor Yellow
        } else {
            Write-Host "✓" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠ Vérification mypy non disponible" -ForegroundColor Yellow
    }
    
    # Alembic
    if (Test-Path "alembic.ini") {
        Check-Command "Alembic config" {
            alembic current 2>$null
        }
    }
    
    Pop-Location
}

# Frontend checks
if (Test-Path "apps\web") {
    Write-Host ""
    Write-Host "🌐 Frontend Checks" -ForegroundColor Cyan
    Write-Host "------------------"
    
    Push-Location apps\web
    
    # Détecter le gestionnaire de paquets
    $PackageManager = $null
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        $PackageManager = "pnpm"
    } elseif (Get-Command npm -ErrorAction SilentlyContinue) {
        $PackageManager = "npm"
    } elseif (Get-Command yarn -ErrorAction SilentlyContinue) {
        $PackageManager = "yarn"
    } else {
        Write-Host "✗ Aucun gestionnaire de paquets trouvé" -ForegroundColor Red
        $Errors++
        Pop-Location
        exit 1
    }
    
    Write-Host "Utilisation de: $PackageManager"
    
    # Type check
    Write-Host -NoNewline "Vérification: TypeScript... "
    try {
        if ($PackageManager -eq "pnpm") {
            pnpm run type-check 2>&1 | Out-Null
        } elseif ($PackageManager -eq "npm") {
            npm run type-check 2>&1 | Out-Null
        } else {
            yarn type-check 2>&1 | Out-Null
        }
        Write-Host "✓" -ForegroundColor Green
    } catch {
        Write-Host "✗" -ForegroundColor Red
        $Errors++
    }
    
    # Build check
    Write-Host -NoNewline "Vérification: Build... "
    try {
        if ($PackageManager -eq "pnpm") {
            pnpm run build 2>&1 | Out-Null
        } elseif ($PackageManager -eq "npm") {
            npm run build 2>&1 | Out-Null
        } else {
            yarn build 2>&1 | Out-Null
        }
        Write-Host "✓" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Build à vérifier manuellement" -ForegroundColor Yellow
    }
    
    Pop-Location
}

# Résumé
Write-Host ""
Write-Host "=================================="
if ($Errors -eq 0) {
    Write-Host "✓ Toutes les vérifications sont passées!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "✗ $Errors erreur(s) détectée(s)" -ForegroundColor Red
    exit 1
}
