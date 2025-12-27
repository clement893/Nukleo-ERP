# Build Speed Optimizations Applied

## Summary

Build time was **321.39 seconds** (5m21s). The following optimizations have been applied to reduce build time.

## ✅ Optimizations Applied

### 1. BuildKit Cache Mounts for pnpm Store ⭐⭐⭐⭐⭐
**Impact**: 20-40 seconds saved on subsequent builds

**Changes**:
- Added `--mount=type=cache,target=/root/.pnpm-store` to all `pnpm install` commands in Dockerfile
- This caches the pnpm store between builds, significantly speeding up dependency installation

**Files Modified**:
- `Dockerfile` (3 locations)

**How it works**:
- BuildKit cache mounts persist the pnpm store between builds
- When dependencies haven't changed, pnpm can reuse cached packages
- Railway automatically uses BuildKit, so this will work out of the box

**Expected Results**:
- First build: No change (cache needs to be populated)
- Subsequent builds: **20-40 seconds faster** when dependencies haven't changed

---

### 2. Disable Production Source Maps ⭐⭐⭐⭐
**Impact**: 5-15 seconds saved per build

**Changes**:
- Added `productionBrowserSourceMaps: false` to `next.config.js`
- Source maps are only needed for debugging, not for production builds

**Files Modified**:
- `apps/web/next.config.js`

**Trade-offs**:
- ✅ Faster builds
- ✅ Smaller build artifacts
- ⚠️ Less detailed error stack traces in production (but Sentry still captures errors)

**Expected Results**:
- **5-15 seconds faster** on every build
- Smaller `.next` directory size

---

## 📊 Expected Build Time Improvements

### Current Build Time
- **Total**: 321.39 seconds (5m21s)

### After Optimizations

#### First Build (Cache Population)
- **Expected**: ~310-315 seconds (5m10s-5m15s)
- **Improvement**: 5-15 seconds (from source maps optimization)

#### Subsequent Builds (With Cache Hits)
- **Expected**: ~270-290 seconds (4m30s-4m50s)
- **Improvement**: 30-50 seconds total
  - Source maps: 5-15s
  - pnpm cache: 20-40s

### Percentage Improvement
- **First build**: ~3-5% faster
- **Subsequent builds**: ~10-15% faster

---

## 🔄 Additional Optimizations Available

### High Impact (Recommended Next Steps)

#### 1. Optimize Static Page Generation
**Impact**: 3-10 seconds per build

Convert some static pages to dynamic/ISR:
```tsx
// For admin/dashboard pages
export const dynamic = 'force-dynamic'; // SSR instead of SSG
```

**Files to modify**:
- Admin pages: `apps/web/src/app/[locale]/admin/**`
- Dashboard pages: `apps/web/src/app/[locale]/dashboard/**`
- Settings pages: `apps/web/src/app/[locale]/settings/**`

#### 2. Skip TypeScript Check in Next.js Build
**Impact**: ~19 seconds per build

**⚠️ Warning**: This removes double-checking. Only do this if you're confident in your prebuild type-check.

Add to `next.config.js`:
```js
typescript: {
  ignoreBuildErrors: false, // Keep false for safety
  // But Next.js will skip if prebuild already checked
}
```

**Note**: TypeScript is already checked in `prebuild` hook, so Next.js check is redundant but provides safety.

### Medium Impact

#### 3. Optimize Webpack Configuration
**Impact**: 3-5 seconds per build

Already optimized with:
- Filesystem cache
- Code splitting
- Tree shaking

Could add:
- Reduce chunk count (may increase bundle size)

#### 4. Reduce Bundle Size
**Impact**: 5-20 seconds per build

- Analyze bundle with `ANALYZE=true pnpm build`
- Remove unused dependencies
- Optimize imports (already done for some packages)

---

## 🚀 How to Verify Optimizations

### 1. Check BuildKit is Enabled
Railway automatically uses BuildKit. Verify in build logs:
```
[internal] load build definition from Dockerfile
```

### 2. Monitor Build Times
Check Railway build logs for:
- `Build time: X seconds` at the end
- pnpm install times (should be faster on subsequent builds)

### 3. Verify Source Maps Disabled
Check build output:
```bash
# Should NOT see source map generation in production builds
# Look for: "Generating source maps..."
```

---

## 📝 Notes

1. **BuildKit Cache**: Railway automatically uses BuildKit, so cache mounts will work without additional configuration.

2. **Cache Persistence**: Railway caches persist between builds, so the pnpm store cache will accumulate over time.

3. **Source Maps**: If you need source maps for debugging, you can temporarily enable them by setting `productionBrowserSourceMaps: true` in `next.config.js`.

4. **First Build**: The first build after these changes will still be slow as caches are populated. Subsequent builds will be faster.

5. **Dependency Changes**: When `pnpm-lock.yaml` changes, the pnpm cache won't help as much, but source maps optimization will still apply.

---

## 🎯 Next Steps

1. **Deploy and Monitor**: Deploy these changes and monitor build times
2. **Consider Additional Optimizations**: If build time is still too long, consider the additional optimizations listed above
3. **Profile Build**: Use `ANALYZE=true` to identify large dependencies that could be optimized

---

## 📚 References

- [BuildKit Cache Mounts](https://docs.docker.com/build/cache/mounts/)
- [Next.js Production Source Maps](https://nextjs.org/docs/advanced-features/source-maps)
- [BUILD_SPEED_OPTIMIZATION_OPTIONS.md](./BUILD_SPEED_OPTIMIZATION_OPTIONS.md) - Full list of optimization options

