# 🗄️ Complete Database Guide

Comprehensive guide covering migrations, rollbacks, and seed data.

---

## 📋 Quick Start

### First Time Setup

```bash
# 1. Create database
createdb your_database_name

# 2. Set DATABASE_URL
export DATABASE_URL="postgresql+asyncpg://user:password@localhost/your_database_name"

# 3. Run migrations
pnpm migrate upgrade head

# 4. Seed development data
pnpm seed
```

### Daily Development

```bash
# After pulling changes with new migrations
pnpm migrate upgrade head

# If you need fresh data
pnpm seed
```

---

## 📚 Documentation Links

- **[Migration Guide](./DATABASE_MIGRATIONS.md)** - Complete migration documentation
- **[Seed Data Guide](./SEED_DATA.md)** - Seed data documentation
- **[Troubleshooting](./TROUBLESHOOTING.md#database-issues)** - Database troubleshooting

---

## 🔄 Common Workflows

### Creating a New Feature

```bash
# 1. Modify models
# Edit backend/app/models/your_model.py

# 2. Create migration
pnpm migrate create AddNewFeature

# 3. Review migration file
# Check backend/alembic/versions/xxx_add_new_feature.py

# 4. Test migration
pnpm migrate upgrade head

# 5. Test rollback
pnpm migrate downgrade -1
pnpm migrate upgrade head

# 6. Commit and push
git add backend/alembic/versions/
git commit -m "feat: add new feature migration"
git push
```

### Rolling Back a Bad Migration

```bash
# 1. Backup database
pg_dump $DATABASE_URL > backup.sql

# 2. Rollback migration
pnpm migrate downgrade -1

# 3. Fix migration file
# Edit backend/alembic/versions/xxx_bad_migration.py

# 4. Test fix
pnpm migrate upgrade head

# 5. Redeploy
```

### Resetting Development Database

```bash
# 1. Drop database
dropdb your_database_name

# 2. Create fresh database
createdb your_database_name

# 3. Run all migrations
pnpm migrate upgrade head

# 4. Seed data
pnpm seed
```

---

## 🎯 Migration Commands Cheat Sheet

```bash
# Create
pnpm migrate create MigrationName

# Apply
pnpm migrate upgrade          # All migrations
pnpm migrate upgrade +1       # One migration
pnpm migrate upgrade abc123  # To revision

# Rollback
pnpm migrate downgrade        # One migration
pnpm migrate downgrade -3     # Three migrations
pnpm migrate downgrade abc123 # To revision

# Status
pnpm migrate current          # Current revision
pnpm migrate history          # Migration history

# Seed
pnpm seed                     # Basic seed
pnpm seed:extended            # Extended seed
```

---

## ⚠️ Important Warnings

1. **Always backup before migrations in production**
2. **Never run seed scripts in production**
3. **Test migrations locally before production**
4. **Review migration files before applying**
5. **Keep migrations small and focused**

---

## 📞 Need Help?

- Check [Troubleshooting Guide](./TROUBLESHOOTING.md#database-issues)
- Review [Migration Guide](./DATABASE_MIGRATIONS.md)
- See [Seed Data Guide](./SEED_DATA.md)

---

**Last Updated**: 2025-01-25

