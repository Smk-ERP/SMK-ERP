-- Seed demo users for The Signmaker ERP
-- Run this in Supabase SQL Editor AFTER running supabase-schema.sql

-- Clear existing users first (safe to re-run)
DELETE FROM "User";

-- Insert all 12 demo users (one per role)
INSERT INTO "User" ("id", "email", "fullName", "role", "language", "active", "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'owner@signmaker.la',      'Somsak Vongphachanh',    'OWNER',              'lo', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'admin@signmaker.la',      'Vilasack Sayyalath',     'ADMIN_MANAGER',      'lo', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'salesmgr@signmaker.la',   'Bouasone Phetmany',      'SALES_MANAGER',      'lo', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'sales1@signmaker.la',     'Khamla Sengdara',        'SALES_STAFF',        'lo', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'prodmgr@signmaker.la',    'Tongkham Vorachit',      'PRODUCTION_MANAGER', 'lo', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'designer@signmaker.la',   'Mali Phommavong',        'DESIGNER',           'lo', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'prod1@signmaker.la',      'Bounthavy Soulivong',    'PRODUCTION_STAFF',   'lo', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'qc@signmaker.la',         'Phonexay Inthavong',     'QC_STAFF',           'lo', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'installer@signmaker.la',  'Khamphone Vannasy',      'INSTALLER',          'lo', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'finance@signmaker.la',    'Latda Sengsoulin',       'FINANCE',            'lo', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'stock@signmaker.la',      'Souksavanh Phanthamaly', 'STOCK',              'lo', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'hr@signmaker.la',         'Noy Phimmasone',         'HR',                 'lo', true, NOW(), NOW());

-- Verify
SELECT email, "fullName", role FROM "User" ORDER BY "createdAt";
