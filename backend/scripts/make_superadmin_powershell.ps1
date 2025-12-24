# PowerShell script to make clement@nukleo.com superadmin using .NET PostgreSQL driver
# This script uses Npgsql via .NET if available, or falls back to other methods

$ErrorActionPreference = "Stop"

$databaseUrl = "postgresql://postgres:bTRLXBaKUIQoowlcuBgVfBYoqSwkhzRA@crossover.proxy.rlwy.net:59208/railway"
$email = "clement@nukleo.com"

# Parse connection string
if ($databaseUrl -match "postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)") {
    $dbUser = $matches[1]
    $dbPassword = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]
} else {
    Write-Host "❌ Invalid database URL format" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Making '$email' superadmin..." -ForegroundColor Cyan
Write-Host "📊 Connecting to: ${dbHost}:${dbPort}/${dbName}" -ForegroundColor Gray
Write-Host ""

# SQL commands
$sqlCommands = @"
-- Ensure superadmin role exists
INSERT INTO roles (name, slug, description, is_system, is_active, created_at, updated_at)
VALUES ('Super Admin', 'superadmin', 'Super administrator with full system access', true, true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Add superadmin role to user
INSERT INTO user_roles (user_id, role_id, created_at)
SELECT u.id, r.id, NOW()
FROM users u
CROSS JOIN roles r
WHERE u.email = '$email'
  AND r.slug = 'superadmin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Verify
SELECT 
    u.email,
    u.id as user_id,
    r.name as role_name,
    r.slug as role_slug,
    ur.created_at as role_assigned_at
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = '$email' AND r.slug = 'superadmin';
"@

# Try to use psql if available
if (Get-Command psql -ErrorAction SilentlyContinue) {
    Write-Host "Using psql..." -ForegroundColor Yellow
    $sqlCommands | psql "host=$dbHost port=$dbPort dbname=$dbName user=$dbUser password=$dbPassword" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Success! User '$email' is now a superadmin." -ForegroundColor Green
        exit 0
    }
}

# Try to download and use psql from PostgreSQL installer
$psqlPath = "$env:TEMP\psql.exe"
if (-not (Test-Path $psqlPath)) {
    Write-Host "⚠️  psql not found. Attempting to use alternative method..." -ForegroundColor Yellow
    
    # Try using Python if available in the backend environment
    $pythonPath = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonPath) {
        Write-Host "Trying Python script..." -ForegroundColor Yellow
        $pythonScript = @"
import asyncio
import asyncpg
import sys

async def main():
    conn = await asyncpg.connect(
        host='$dbHost',
        port=$dbPort,
        user='$dbUser',
        password='$dbPassword',
        database='$dbName',
        ssl='require'
    )
    
    email = '$email'
    
    # Ensure superadmin role
    await conn.execute('''
        INSERT INTO roles (name, slug, description, is_system, is_active, created_at, updated_at)
        VALUES ('Super Admin', 'superadmin', 'Super administrator with full system access', true, true, NOW(), NOW())
        ON CONFLICT (slug) DO NOTHING
    ''')
    
    # Add role to user
    result = await conn.execute('''
        INSERT INTO user_roles (user_id, role_id, created_at)
        SELECT u.id, r.id, NOW()
        FROM users u
        CROSS JOIN roles r
        WHERE u.email = \$1 AND r.slug = 'superadmin'
        ON CONFLICT (user_id, role_id) DO NOTHING
    ''', email)
    
    # Verify
    row = await conn.fetchrow('''
        SELECT u.email, u.id, r.name, r.slug, ur.created_at
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE u.email = \$1 AND r.slug = 'superadmin'
    ''', email)
    
    if row:
        print(f"✅ Success! {row['email']} is now a {row['name']}")
    else:
        print("⚠️  Could not verify")
    
    await conn.close()

asyncio.run(main())
"@
        $pythonScript | python
        if ($LASTEXITCODE -eq 0) {
            exit 0
        }
    }
}

# Fallback: Output SQL for manual execution
Write-Host "`n⚠️  Could not execute automatically. Please execute this SQL manually:" -ForegroundColor Yellow
Write-Host "`n$sqlCommands" -ForegroundColor White
Write-Host "`nOr use Railway Dashboard > Database > Query tab" -ForegroundColor Cyan
exit 1

