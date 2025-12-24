# 🧹 Code Cleanup Plan

Comprehensive plan to remove obsolete and useless code from the codebase.

**Created:** 2025-01-XX  
**Total Lines of Code:** ~121,302  
**Estimated Cleanup:** ~4,500-5,000 lines

---

## 📊 Current Issues Summary

| Issue Type | Count | Priority | Estimated Impact |
|------------|-------|----------|------------------|
| Commented Code | 4,306 lines | Medium | Medium |
| Console Statements | 98 instances | High | Low |
| TODO/FIXME Comments | 258 instances | Medium | Low |
| Unused Files | 9 files | Medium | Medium |
| Duplicate Patterns | 180 instances | Low | Low |
| Empty/Minimal Files | 32 files | Low | Low |

---

## 🎯 Phase 1: High Priority (Week 1)

### 1.1 Replace Console Statements with Logger

**Goal:** Replace all `console.*` statements with proper logger calls

**Files Affected:**
- `apps/web/src/app/api/**/*.ts` (API routes)
- `apps/web/src/components/**/*.tsx` (Components)
- `apps/web/src/app/**/*.tsx` (Pages)

**Actions:**
1. ✅ Identify all console statements
2. ✅ Replace `console.log()` → `logger.info()`
3. ✅ Replace `console.error()` → `logger.error()`
4. ✅ Replace `console.warn()` → `logger.warn()`
5. ✅ Replace `console.debug()` → `logger.debug()`
6. ✅ Remove console statements in production code paths
7. ✅ Keep console statements only in development/debug code

**Verification:**
```bash
# After cleanup, verify no console statements remain
grep -r "console\." apps/web/src --exclude-dir=node_modules
```

**Estimated Time:** 2-3 hours  
**Risk:** Low (logger is already set up)

---

### 1.2 Remove Obsolete Example/Demo Files

**Goal:** Remove files that are clearly obsolete or unused

**Files to Remove:**
- [ ] `apps/web/src/components/ui/examples.tsx` (if exists and unused)
- [ ] `apps/web/src/components/rbac/RBACDemo.tsx` (if only demo, not used)
- [ ] `apps/web/src/components/theme/ComponentGallery.tsx` (if unused)

**Actions:**
1. ✅ Verify files are not imported anywhere
2. ✅ Check if files are referenced in documentation
3. ✅ Remove files if confirmed unused
4. ✅ Update any documentation referencing removed files

**Verification:**
```bash
# Check if files are imported
grep -r "examples\|RBACDemo\|ComponentGallery" apps/web/src
```

**Estimated Time:** 1 hour  
**Risk:** Low (verify before removal)

---

## 🎯 Phase 2: Medium Priority (Week 2)

### 2.1 Review and Clean Commented Code

**Goal:** Remove obsolete commented code blocks

**Strategy:**
1. ✅ Identify large commented blocks (>10 lines)
2. ✅ Check git history to see if code is recent
3. ✅ Remove code that's clearly obsolete
4. ✅ Keep code that's temporarily disabled for debugging
5. ✅ Convert important comments to proper documentation

**Actions:**
- Review commented code in:
  - Component files
  - API routes
  - Utility functions
  - Configuration files

**Verification:**
```bash
# Find large commented blocks
grep -r "^[[:space:]]*//.*[a-zA-Z]" apps/web/src | wc -l
```

**Estimated Time:** 4-6 hours  
**Risk:** Medium (need careful review)

---

### 2.2 Address TODO/FIXME Comments

**Goal:** Complete, remove, or convert TODOs to issues

**Categories:**
1. **Complete:** Implement the TODO
2. **Remove:** If no longer needed
3. **Convert:** Create GitHub issue if significant work
4. **Document:** If it's a known limitation

**Actions:**
1. ✅ List all TODO/FIXME comments
2. ✅ Categorize each TODO
3. ✅ Complete quick fixes (< 30 min)
4. ✅ Create issues for larger tasks
5. ✅ Remove obsolete TODOs
6. ✅ Document known limitations

**Verification:**
```bash
# After cleanup, verify TODOs are addressed
grep -r "TODO\|FIXME" apps/web/src --exclude-dir=node_modules
```

**Estimated Time:** 6-8 hours  
**Risk:** Low (can be done incrementally)

---

### 2.3 Verify Unused Component Files

**Goal:** Determine if unused components should be kept or removed

**Files to Review:**
- [ ] `apps/web/src/components/admin/InvitationManagement.tsx`
- [ ] `apps/web/src/components/admin/RoleManagement.tsx`
- [ ] `apps/web/src/components/admin/TeamManagement.tsx`
- [ ] `apps/web/src/components/i18n/LocaleSwitcher.tsx`
- [ ] `apps/web/src/components/layout/InternalLayout.tsx`
- [ ] `apps/web/src/components/subscriptions/PricingSection.tsx`

**Actions:**
1. ✅ Check if components are used in:
   - Admin pages
   - Future features (keep if planned)
   - Documentation/examples
2. ✅ If unused but planned: Add to roadmap
3. ✅ If unused and not planned: Remove
4. ✅ If used but not detected: Fix imports

**Verification:**
```bash
# Check actual usage
grep -r "InvitationManagement\|RoleManagement\|TeamManagement" apps/web/src
```

**Estimated Time:** 2-3 hours  
**Risk:** Medium (verify usage carefully)

---

## 🎯 Phase 3: Low Priority (Week 3-4)

### 3.1 Refactor Duplicate Code Patterns

**Goal:** Identify and refactor duplicate code

**Actions:**
1. ✅ Identify duplicate function patterns
2. ✅ Extract common logic to utilities
3. ✅ Create shared components/hooks
4. ✅ Update all usages

**Estimated Time:** 8-12 hours  
**Risk:** Medium (requires testing)

---

### 3.2 Clean Empty/Minimal Files

**Goal:** Remove or complete empty files

**Actions:**
1. ✅ List all files with < 10 lines
2. ✅ Check if files are placeholders
3. ✅ Remove if obsolete
4. ✅ Complete if needed

**Estimated Time:** 1-2 hours  
**Risk:** Low

---

### 3.3 Check Unused Dependencies

**Goal:** Remove unused npm packages

**Actions:**
1. ✅ Install depcheck: `pnpm add -D depcheck`
2. ✅ Run: `npx depcheck`
3. ✅ Review unused dependencies
4. ✅ Remove confirmed unused packages
5. ✅ Verify build still works

**Estimated Time:** 1-2 hours  
**Risk:** Low (can test after removal)

---

## 📋 Execution Checklist

### Pre-Cleanup
- [ ] Create backup branch: `git checkout -b cleanup/remove-obsolete-code`
- [ ] Run full test suite: `pnpm test`
- [ ] Verify build works: `pnpm build`
- [ ] Document current state

### Phase 1 (High Priority)
- [ ] Replace console statements with logger
- [ ] Remove obsolete example files
- [ ] Test after changes
- [ ] Commit: `git commit -m "refactor: replace console statements with logger"`

### Phase 2 (Medium Priority)
- [ ] Review and remove commented code
- [ ] Address TODO/FIXME comments
- [ ] Verify unused component files
- [ ] Test after changes
- [ ] Commit: `git commit -m "refactor: remove obsolete code and address TODOs"`

### Phase 3 (Low Priority)
- [ ] Refactor duplicate patterns
- [ ] Clean empty files
- [ ] Remove unused dependencies
- [ ] Test after changes
- [ ] Commit: `git commit -m "refactor: clean up duplicate code and dependencies"`

### Post-Cleanup
- [ ] Run full test suite: `pnpm test`
- [ ] Verify build: `pnpm build`
- [ ] Check bundle size: `pnpm analyze`
- [ ] Review code coverage
- [ ] Update documentation if needed
- [ ] Create PR for review

---

## 🧪 Testing Strategy

After each phase:
1. ✅ Run unit tests: `pnpm test`
2. ✅ Run E2E tests: `pnpm test:e2e`
3. ✅ Verify build: `pnpm build`
4. ✅ Check for TypeScript errors: `pnpm type-check`
5. ✅ Manual testing of affected features

---

## 📊 Success Metrics

**Before Cleanup:**
- Commented code: 4,306 lines
- Console statements: 98 instances
- TODO/FIXME: 258 comments
- Unused files: 9 files

**After Cleanup (Target):**
- Commented code: < 500 lines (90% reduction)
- Console statements: 0 in production code
- TODO/FIXME: < 50 (80% reduction)
- Unused files: 0 (all verified or removed)

**Code Quality Improvements:**
- Cleaner codebase
- Better maintainability
- Reduced confusion
- Improved performance (smaller bundle)

---

## ⚠️ Risk Mitigation

1. **Backup:** Always work in a feature branch
2. **Incremental:** Clean up in small, testable chunks
3. **Verification:** Test after each phase
4. **Documentation:** Document why code is removed
5. **Review:** Get code review before merging

---

## 📅 Timeline

| Phase | Duration | Start Date | End Date |
|-------|----------|------------|----------|
| Phase 1 | 1 week | TBD | TBD |
| Phase 2 | 1 week | TBD | TBD |
| Phase 3 | 2 weeks | TBD | TBD |
| **Total** | **4 weeks** | | |

---

## 🔍 Tools & Commands

### Find Console Statements
```bash
grep -r "console\." apps/web/src --exclude-dir=node_modules
```

### Find TODO Comments
```bash
grep -r "TODO\|FIXME" apps/web/src --exclude-dir=node_modules
```

### Find Commented Code
```bash
grep -r "^[[:space:]]*//" apps/web/src --exclude-dir=node_modules | wc -l
```

### Check Unused Dependencies
```bash
npx depcheck
```

### Find Unused Files
```bash
# Use TypeScript compiler
pnpm type-check --noEmit
```

---

## 📝 Notes

- This cleanup should be done incrementally
- Each phase should be tested before moving to next
- Keep a log of what was removed and why
- Update this plan as work progresses

---

**Last Updated:** 2025-01-XX  
**Status:** Planning Phase

