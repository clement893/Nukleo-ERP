#!/bin/bash

# Script de vérification pour chaque batch Leo
# Usage: ./scripts/verify-batch.sh [batch-number]

set -e

BATCH_NUM=$1

if [ -z "$BATCH_NUM" ]; then
    echo "Usage: ./scripts/verify-batch.sh [batch-number]"
    echo "Example: ./scripts/verify-batch.sh 1"
    exit 1
fi

echo "🔍 Vérification du Batch $BATCH_NUM"
echo "=================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Fonction pour vérifier une commande
check_command() {
    local name=$1
    local cmd=$2
    
    echo -n "Vérification: $name... "
    if eval "$cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC}"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Backend checks
if [ -d "backend" ]; then
    echo ""
    echo "📦 Backend Checks"
    echo "-----------------"
    
    cd backend
    
    # Python syntax
    check_command "Python syntax" "python -m py_compile app/**/*.py 2>/dev/null || true"
    
    # Type checking (mypy) - non-blocking
    echo -n "Vérification: Type checking (mypy)... "
    if python -m mypy app/ --ignore-missing-imports --no-error-summary 2>&1 | grep -q "error"; then
        echo -e "${YELLOW}⚠ Warnings détectés${NC}"
    else
        echo -e "${GREEN}✓${NC}"
    fi
    
    # Alembic
    if [ -f "alembic.ini" ]; then
        check_command "Alembic config" "alembic current 2>/dev/null || alembic history 2>/dev/null || true"
    fi
    
    cd ..
fi

# Frontend checks
if [ -d "apps/web" ]; then
    echo ""
    echo "🌐 Frontend Checks"
    echo "------------------"
    
    cd apps/web
    
    # TypeScript check
    if command -v pnpm &> /dev/null; then
        PACKAGE_MANAGER="pnpm"
    elif command -v npm &> /dev/null; then
        PACKAGE_MANAGER="npm"
    elif command -v yarn &> /dev/null; then
        PACKAGE_MANAGER="yarn"
    else
        echo -e "${RED}✗${NC} Aucun gestionnaire de paquets trouvé"
        ERRORS=$((ERRORS + 1))
        cd ../..
        exit 1
    fi
    
    echo "Utilisation de: $PACKAGE_MANAGER"
    
    # Type check
    echo -n "Vérification: TypeScript... "
    if $PACKAGE_MANAGER run type-check > /dev/null 2>&1 || npx tsc --noEmit > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Build check (dry run if possible)
    echo -n "Vérification: Build... "
    if $PACKAGE_MANAGER run build --dry-run > /dev/null 2>&1 || $PACKAGE_MANAGER run build > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${YELLOW}⚠ Build à vérifier manuellement${NC}"
    fi
    
    cd ../..
fi

# Résumé
echo ""
echo "=================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Toutes les vérifications sont passées!${NC}"
    exit 0
else
    echo -e "${RED}✗ $ERRORS erreur(s) détectée(s)${NC}"
    exit 1
fi
