-- Script SQL pour créer le pipeline MAIN avec toutes les étapes
-- Ce script peut être exécuté directement dans PostgreSQL

-- Vérifier si le pipeline MAIN existe déjà
DO $$
DECLARE
    pipeline_uuid UUID;
    first_user_id INTEGER;
    stage_order INTEGER := 0;
BEGIN
    -- Vérifier si le pipeline MAIN existe déjà
    SELECT id INTO pipeline_uuid FROM pipelines WHERE name = 'MAIN';
    
    IF pipeline_uuid IS NOT NULL THEN
        RAISE NOTICE 'Pipeline MAIN existe déjà (ID: %)', pipeline_uuid;
        RETURN;
    END IF;
    
    -- Récupérer le premier utilisateur comme créateur
    SELECT id INTO first_user_id FROM users LIMIT 1;
    
    IF first_user_id IS NULL THEN
        RAISE EXCEPTION 'Aucun utilisateur trouvé. Veuillez créer un utilisateur d''abord.';
    END IF;
    
    -- Générer un UUID pour le pipeline
    pipeline_uuid := gen_random_uuid();
    
    -- Créer le pipeline MAIN
    INSERT INTO pipelines (id, name, description, is_default, is_active, created_by_id, created_at, updated_at)
    VALUES (
        pipeline_uuid,
        'MAIN',
        'Pipeline principal pour la gestion des opportunités commerciales',
        true,
        true,
        first_user_id,
        NOW(),
        NOW()
    );
    
    -- Créer toutes les étapes
    INSERT INTO pipeline_stages (id, pipeline_id, name, description, color, "order", created_at, updated_at) VALUES
        (gen_random_uuid(), pipeline_uuid, '00 - Idées de projet', 'Étape: 00 - Idées de projet', '#94A3B8', 0, NOW(), NOW()),
        (gen_random_uuid(), pipeline_uuid, '00 - Idées de contact', 'Étape: 00 - Idées de contact', '#94A3B8', 1, NOW(), NOW()),
        (gen_random_uuid(), pipeline_uuid, '01 - Suivi /Emails', 'Étape: 01 - Suivi /Emails', '#3B82F6', 2, NOW(), NOW()),
        (gen_random_uuid(), pipeline_uuid, '02 - Leads', 'Étape: 02 - Leads', '#3B82F6', 3, NOW(), NOW()),
        (gen_random_uuid(), pipeline_uuid, '03 - Rencontre booké', 'Étape: 03 - Rencontre booké', '#8B5CF6', 4, NOW(), NOW()),
        (gen_random_uuid(), pipeline_uuid, '04 - En discussion', 'Étape: 04 - En discussion', '#8B5CF6', 5, NOW(), NOW()),
        (gen_random_uuid(), pipeline_uuid, '05 - Proposal to do', 'Étape: 05 - Proposal to do', '#F59E0B', 6, NOW(), NOW()),
        (gen_random_uuid(), pipeline_uuid, '06 - Proposal sent', 'Étape: 06 - Proposal sent', '#F59E0B', 7, NOW(), NOW()),
        (gen_random_uuid(), pipeline_uuid, '07 - Contract to do', 'Étape: 07 - Contract to do', '#EF4444', 8, NOW(), NOW()),
        (gen_random_uuid(), pipeline_uuid, '08 - Contract sent', 'Étape: 08 - Contract sent', '#EF4444', 9, NOW(), NOW()),
        (gen_random_uuid(), pipeline_uuid, '09 - Closed Won', 'Étape: 09 - Closed Won', '#10B981', 10, NOW(), NOW()),
        (gen_random_uuid(), pipeline_uuid, 'Closed Lost', 'Étape: Closed Lost', '#6B7280', 11, NOW(), NOW()),
        (gen_random_uuid(), pipeline_uuid, 'En attente ou Silence radio', 'Étape: En attente ou Silence radio', '#FBBF24', 12, NOW(), NOW()),
        (gen_random_uuid(), pipeline_uuid, 'Renouvellement à venir', 'Étape: Renouvellement à venir', '#10B981', 13, NOW(), NOW()),
        (gen_random_uuid(), pipeline_uuid, 'Renouvellements potentiels', 'Étape: Renouvellements potentiels', '#10B981', 14, NOW(), NOW());
    
    RAISE NOTICE 'Pipeline MAIN créé avec succès (ID: %)', pipeline_uuid;
    RAISE NOTICE '15 étapes créées';
END $$;
