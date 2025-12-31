-- Script to clear all data from clients table
-- This should be run before applying migration 050_drop_clients_table

-- Delete all records from clients table
DELETE FROM clients;

-- Note: The migration will drop the table entirely, so this is just a safety measure
-- to ensure no data remains before dropping the table structure.
