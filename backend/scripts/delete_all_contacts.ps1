# Script PowerShell pour supprimer tous les contacts
# Usage: .\delete_all_contacts.ps1

Write-Host "🗑️  Script de suppression de tous les contacts" -ForegroundColor Yellow
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "backend\scripts\delete_all_contacts.py")) {
    Write-Host "❌ Erreur: Ce script doit être exécuté depuis la racine du projet" -ForegroundColor Red
    exit 1
}

# Aller dans le répertoire backend
Set-Location backend

# Vérifier que Python est disponible
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python trouvé: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur: Python n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    exit 1
}

# Vérifier que les dépendances sont installées
Write-Host ""
Write-Host "📦 Vérification des dépendances..." -ForegroundColor Cyan

# Exécuter le script Python
Write-Host ""
Write-Host "🚀 Exécution du script de suppression..." -ForegroundColor Cyan
Write-Host ""

python scripts\delete_all_contacts.py

# Retourner au répertoire racine
Set-Location ..

Write-Host ""
Write-Host "✅ Script terminé" -ForegroundColor Green
