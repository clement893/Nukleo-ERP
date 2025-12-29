# ⚡ Batch Workflow Quick Reference

Quick reference guide for executing batches in the fix plan.

---

## 🔄 Standard Workflow (Copy-Paste Ready)

### 1. Start Batch

```bash
# Navigate to project root
cd /path/to/modele-final-1

# Pull latest changes
git pull origin main

# Verify current state
cd apps/web
pnpm type-check
pnpm build

# Create feature branch (optional)
git checkout -b fix/batch-[N]-[name]
```

### 2. Make Changes

- Follow batch plan instructions
- Make incremental commits
- Test frequently

### 3. Verify Changes

```bash
# Type check
cd apps/web
pnpm type-check

# Build check
pnpm build

# Run tests (if applicable)
pnpm test

# Check for linting errors
pnpm lint
```

### 4. Commit & Push

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "fix: [batch name] - [description]

- Change 1
- Change 2
- Change 3"

# Push to repository
git push origin main
# OR if using feature branch:
git push origin fix/batch-[N]-[name]
```

### 5. Update Progress

- Update `BATCH_FIX_PLAN.md` - Mark batch as completed
- Update `BATCH_PROGRESS_REPORTS.md` - Add progress report
- Update this document if workflow changes

---

## 🚨 If Build Fails

### Step 1: Don't Panic
```bash
# Check what failed
pnpm type-check 2>&1 | tail -20
pnpm build 2>&1 | tail -20
```

### Step 2: Fix the Issue
- Review error messages
- Fix the problem
- Test again

### Step 3: If Can't Fix Immediately
```bash
# Revert changes
git status
git diff
git restore .  # or git checkout -- .

# Document the issue
# Update batch plan with blocker
```

---

## ✅ Verification Checklist (Before Each Commit)

- [ ] TypeScript compiles: `pnpm type-check`
- [ ] Build succeeds: `pnpm build`
- [ ] Tests pass: `pnpm test` (if applicable)
- [ ] No linting errors: `pnpm lint`
- [ ] Changes committed: `git status` shows clean
- [ ] Changes pushed: `git log` shows commit on remote

---

## 📝 Commit Message Template

```
fix: [batch number] - [batch name]

[Brief description of what was fixed]

Changes:
- Specific change 1
- Specific change 2
- Specific change 3

Fixes: [issue reference if applicable]
```

### Examples

```
fix: batch 1 - component variant type errors

Fix TypeScript errors for Alert, Button, and Stack components
by correcting variant prop types.

Changes:
- Alert variant "danger" → "error"
- Button variants "success"/"warning" → "outline"/"ghost"
- Stack gap prop numeric → gapValue with CSS strings

Fixes: TypeScript compilation errors
```

```
refactor: batch 3 - replace console with logger

Replace console statements in production code with logger utility
for consistent logging.

Changes:
- Replace console.warn → logger.warn
- Replace console.error → logger.error
- Keep console.log in test/story files

Files modified: 20 production files
```

---

## 🔍 Quick Commands Reference

### Type Checking
```bash
cd apps/web
pnpm type-check
```

### Building
```bash
cd apps/web
pnpm build
```

### Testing
```bash
cd apps/web
pnpm test
# Or specific test
pnpm test path/to/test
```

### Linting
```bash
cd apps/web
pnpm lint
```

### Git Status
```bash
git status
git diff
git log --oneline -5
```

### Find Issues
```bash
# Find console statements
grep -r "console\." apps/web/src --exclude-dir=node_modules --exclude="*.test.*" --exclude="*.stories.*"

# Find any types
grep -r ": any" apps/web/src --exclude-dir=node_modules | wc -l

# Find TODOs
grep -r "TODO\|FIXME" apps/web/src --exclude-dir=node_modules
```

---

## 📊 Progress Tracking Commands

### Count Files Changed
```bash
git diff --name-only HEAD~1
git diff --stat HEAD~1
```

### Count Lines Changed
```bash
git diff --stat HEAD~1
```

### View Recent Commits
```bash
git log --oneline --graph -10
```

---

## 🎯 Batch-Specific Commands

### Batch 2: Variable Scope
```bash
# Find variable scope issues
grep -r "catch.*{" apps/web/src --include="*.tsx" --include="*.ts" -A 5 | grep -B 2 "const\|let"
```

### Batch 3: Console Statements
```bash
# Find console statements in production code
find apps/web/src -name "*.ts" -o -name "*.tsx" | \
  grep -v test | grep -v stories | \
  xargs grep -l "console\." | \
  xargs grep "console\."
```

### Batch 4-6: Type Safety
```bash
# Count any types
grep -r ": any\|as any" apps/web/src --exclude-dir=node_modules | wc -l

# Find error: any
grep -r "catch.*error.*any" apps/web/src --exclude-dir=node_modules

# Find as any
grep -r "as any" apps/web/src --exclude-dir=node_modules
```

### Batch 7: Security
```bash
# Check subprocess usage
grep -r "subprocess" backend/app --include="*.py"
```

### Batch 9: TODOs
```bash
# List all TODOs
grep -rn "TODO\|FIXME" apps/web/src backend/app --exclude-dir=node_modules
```

---

## 🚀 Quick Start for Next Batch

```bash
# 1. Update status
git pull origin main

# 2. Verify current state
cd apps/web && pnpm type-check && pnpm build && cd ../..

# 3. Read batch plan
cat BATCH_FIX_PLAN.md | grep -A 50 "Batch [N]:"

# 4. Start working
# ... make changes ...

# 5. Verify
cd apps/web && pnpm type-check && pnpm build && cd ../..

# 6. Commit
git add .
git commit -m "fix: batch [N] - [name]"
git push origin main

# 7. Update progress
# Edit BATCH_PROGRESS_REPORTS.md
```

---

## 📋 Daily Checklist

- [ ] Pull latest changes
- [ ] Verify current build state
- [ ] Work on current batch
- [ ] Test frequently
- [ ] Commit changes
- [ ] Push to repository
- [ ] Update progress reports
- [ ] Document any blockers

---

## 🆘 Troubleshooting

### TypeScript Errors
```bash
# Clear TypeScript cache
rm -rf apps/web/.next
rm -rf apps/web/node_modules/.cache
pnpm type-check
```

### Build Errors
```bash
# Clean build
rm -rf apps/web/.next
pnpm build
```

### Git Issues
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# See what changed
git diff HEAD~1
```

---

**Last Updated:** 2025-12-29
