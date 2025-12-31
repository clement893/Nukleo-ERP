-- Script to fix alembic_version table when migration 051_change_responsable_to_people is missing
-- This migration was deleted but may still be referenced in the database

-- Check current state
SELECT * FROM alembic_version;

-- If the version is '051_change_responsable_to_people', update it to the last valid migration
-- Based on the migration chain, the last valid migration before 051 was 050_drop_clients_table
UPDATE alembic_version 
SET version_num = '050_drop_clients_table' 
WHERE version_num = '051_change_responsable_to_people';

-- Verify the update
SELECT * FROM alembic_version;

-- After running this script, you should be able to run: alembic upgrade head
