-- =====================================================
-- MIGRATION SCRIPT: LocalStorage to Database
-- Script per migrare i dati dal localStorage al database
-- =====================================================

-- Questo script definisce le stored procedures per migrare i dati
-- dal localStorage (JSON) alle tabelle del database

-- =====================================================
-- 1. FUNZIONE PER MIGRARE UTENTE DAL LOCALSTORAGE
-- =====================================================

CREATE OR REPLACE FUNCTION migrate_user_from_localstorage(
    p_username VARCHAR(50),
    p_display_name VARCHAR(100) DEFAULT NULL,
    p_email VARCHAR(255) DEFAULT NULL,
    p_preferences JSONB DEFAULT '{}'
)
RETURNS BIGINT AS $$
DECLARE
    user_id BIGINT;
BEGIN
    -- Inserisci o aggiorna utente
    INSERT INTO users (username, display_name, email, preferences, first_login_at, last_seen_at)
    VALUES (p_username, p_display_name, p_email, p_preferences, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (username) 
    DO UPDATE SET 
        display_name = COALESCE(EXCLUDED.display_name, users.display_name),
        email = COALESCE(EXCLUDED.email, users.email),
        preferences = users.preferences || EXCLUDED.preferences,
        last_seen_at = CURRENT_TIMESTAMP
    RETURNING id INTO user_id;
    
    -- Log della migrazione
    INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
    VALUES (user_id, 'user_migrated', 'user', user_id, '{"source": "localStorage"}');
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. FUNZIONE PER MIGRARE GOALS DAL LOCALSTORAGE
-- =====================================================

CREATE OR REPLACE FUNCTION migrate_goals_from_localstorage(
    p_user_id BIGINT,
    p_goals_json JSONB
)
RETURNS INTEGER AS $$
DECLARE
    goal_item JSONB;
    goal_id BIGINT;
    migrated_count INTEGER := 0;
BEGIN
    -- Itera su ogni goal nel JSON
    FOR goal_item IN SELECT * FROM jsonb_array_elements(p_goals_json)
    LOOP
        -- Inserisci goal
        INSERT INTO user_goals (
            user_id, 
            target_position, 
            target_date, 
            created_at, 
            achieved_at, 
            is_active,
            notes
        ) VALUES (
            p_user_id,
            (goal_item->>'targetPosition')::INTEGER,
            CASE 
                WHEN goal_item->>'targetDate' IS NOT NULL 
                THEN (goal_item->>'targetDate')::TIMESTAMP WITH TIME ZONE::DATE
                ELSE NULL 
            END,
            CASE 
                WHEN goal_item->>'createdAt' IS NOT NULL 
                THEN (goal_item->>'createdAt')::TIMESTAMP WITH TIME ZONE
                ELSE CURRENT_TIMESTAMP 
            END,
            CASE 
                WHEN goal_item->>'achievedAt' IS NOT NULL 
                THEN (goal_item->>'achievedAt')::TIMESTAMP WITH TIME ZONE
                ELSE NULL 
            END,
            COALESCE((goal_item->>'isActive')::BOOLEAN, FALSE),
            'Migrated from localStorage'
        ) RETURNING id INTO goal_id;
        
        migrated_count := migrated_count + 1;
        
        -- Log della migrazione
        INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
        VALUES (p_user_id, 'goal_migrated', 'goal', goal_id, 
                jsonb_build_object('source', 'localStorage', 'original_data', goal_item));
    END LOOP;
    
    RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. FUNZIONE PER MIGRARE PROGRESS HISTORY
-- =====================================================

CREATE OR REPLACE FUNCTION migrate_progress_from_localstorage(
    p_user_id BIGINT,
    p_progress_json JSONB
)
RETURNS INTEGER AS $$
DECLARE
    progress_item JSONB;
    active_goal_id BIGINT;
    migrated_count INTEGER := 0;
BEGIN
    -- Ottieni l'ID del goal attivo
    SELECT id INTO active_goal_id 
    FROM user_goals 
    WHERE user_id = p_user_id AND is_active = TRUE 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Se non c'è un goal attivo, creane uno di default
    IF active_goal_id IS NULL THEN
        INSERT INTO user_goals (user_id, target_position, is_active, notes)
        VALUES (p_user_id, 1000, TRUE, 'Default goal created during migration')
        RETURNING id INTO active_goal_id;
    END IF;
    
    -- Itera su ogni record di progresso nel JSON
    FOR progress_item IN SELECT * FROM jsonb_array_elements(p_progress_json)
    LOOP
        -- Inserisci record di progresso
        INSERT INTO goal_progress_history (
            goal_id,
            user_id,
            current_position,
            score,
            recorded_at,
            source,
            metadata
        ) VALUES (
            active_goal_id,
            p_user_id,
            CASE 
                WHEN progress_item->>'currentPosition' IS NOT NULL 
                THEN (progress_item->>'currentPosition')::INTEGER
                ELSE NULL 
            END,
            CASE 
                WHEN progress_item->>'score' IS NOT NULL 
                THEN (progress_item->>'score')::INTEGER
                ELSE NULL 
            END,
            CASE 
                WHEN progress_item->>'date' IS NOT NULL 
                THEN (progress_item->>'date')::TIMESTAMP WITH TIME ZONE
                ELSE CURRENT_TIMESTAMP 
            END,
            'localStorage_migration',
            progress_item
        );
        
        migrated_count := migrated_count + 1;
    END LOOP;
    
    RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. FUNZIONE PER MIGRARE FRIENDS LEAGUE
-- =====================================================

CREATE OR REPLACE FUNCTION migrate_friends_league_from_localstorage(
    p_owner_user_id BIGINT,
    p_friends_json JSONB,
    p_league_name VARCHAR(100) DEFAULT 'My Friends League'
)
RETURNS BIGINT AS $$
DECLARE
    league_id BIGINT;
    friend_item JSONB;
    friend_user_id BIGINT;
    migrated_members INTEGER := 0;
BEGIN
    -- Crea o trova la lega
    INSERT INTO leagues (name, description, created_by, is_private, invite_code)
    VALUES (
        p_league_name,
        'Migrated from localStorage friends league',
        p_owner_user_id,
        TRUE,
        'MIGRATED' || extract(epoch from CURRENT_TIMESTAMP)::TEXT
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO league_id;
    
    -- Se la lega esiste già, ottieni l'ID
    IF league_id IS NULL THEN
        SELECT id INTO league_id 
        FROM leagues 
        WHERE created_by = p_owner_user_id 
        ORDER BY created_at DESC 
        LIMIT 1;
    END IF;
    
    -- Aggiungi il proprietario come membro
    INSERT INTO league_memberships (league_id, user_id, role)
    VALUES (league_id, p_owner_user_id, 'owner')
    ON CONFLICT (league_id, user_id) DO NOTHING;
    
    -- Itera su ogni amico nel JSON
    FOR friend_item IN SELECT * FROM jsonb_array_elements(p_friends_json)
    LOOP
        -- Cerca o crea l'utente amico
        SELECT id INTO friend_user_id 
        FROM users 
        WHERE username = (friend_item->>'username');
        
        -- Se l'amico non esiste, crealo
        IF friend_user_id IS NULL THEN
            friend_user_id := migrate_user_from_localstorage(
                (friend_item->>'username'),
                (friend_item->>'displayName'),
                NULL,
                friend_item - 'username' - 'displayName'
            );
        END IF;
        
        -- Aggiungi l'amico alla lega
        INSERT INTO league_memberships (league_id, user_id, role)
        VALUES (league_id, friend_user_id, 'member')
        ON CONFLICT (league_id, user_id) DO NOTHING;
        
        migrated_members := migrated_members + 1;
    END LOOP;
    
    -- Log della migrazione
    INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
    VALUES (p_owner_user_id, 'league_migrated', 'league', league_id, 
            jsonb_build_object(
                'source', 'localStorage',
                'migrated_members', migrated_members,
                'original_data', p_friends_json
            ));
    
    RETURN league_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. FUNZIONE MASTER PER MIGRAZIONE COMPLETA
-- =====================================================

CREATE OR REPLACE FUNCTION migrate_complete_localstorage_data(
    p_migration_data JSONB
)
RETURNS JSONB AS $$
DECLARE
    user_id BIGINT;
    goals_migrated INTEGER := 0;
    progress_migrated INTEGER := 0;
    league_id BIGINT;
    migration_result JSONB;
BEGIN
    -- 1. Migra utente
    user_id := migrate_user_from_localstorage(
        (p_migration_data->>'username'),
        (p_migration_data->>'displayName'),
        (p_migration_data->>'email'),
        COALESCE(p_migration_data->'preferences', '{}'::jsonb)
    );
    
    -- 2. Migra goals se presenti
    IF p_migration_data ? 'goals' AND jsonb_array_length(p_migration_data->'goals') > 0 THEN
        goals_migrated := migrate_goals_from_localstorage(
            user_id,
            p_migration_data->'goals'
        );
    END IF;
    
    -- 3. Migra progress history se presente
    IF p_migration_data ? 'progressHistory' AND jsonb_array_length(p_migration_data->'progressHistory') > 0 THEN
        progress_migrated := migrate_progress_from_localstorage(
            user_id,
            p_migration_data->'progressHistory'
        );
    END IF;
    
    -- 4. Migra friends league se presente
    IF p_migration_data ? 'friendsLeague' AND jsonb_array_length(p_migration_data->'friendsLeague') > 0 THEN
        league_id := migrate_friends_league_from_localstorage(
            user_id,
            p_migration_data->'friendsLeague',
            COALESCE((p_migration_data->>'leagueName'), 'My Friends League')
        );
    END IF;
    
    -- 5. Migra cache e preferenze
    IF p_migration_data ? 'cache' THEN
        INSERT INTO user_app_preferences (user_id, preference_key, preference_value)
        VALUES (user_id, 'localStorage_cache', p_migration_data->'cache')
        ON CONFLICT (user_id, preference_key) 
        DO UPDATE SET preference_value = EXCLUDED.preference_value;
    END IF;
    
    -- Costruisci risultato
    migration_result := jsonb_build_object(
        'success', true,
        'user_id', user_id,
        'username', (p_migration_data->>'username'),
        'goals_migrated', goals_migrated,
        'progress_records_migrated', progress_migrated,
        'league_id', league_id,
        'migration_timestamp', CURRENT_TIMESTAMP
    );
    
    -- Log master della migrazione
    INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
    VALUES (user_id, 'complete_migration', 'user', user_id, migration_result);
    
    RETURN migration_result;
    
EXCEPTION WHEN OTHERS THEN
    -- In caso di errore, ritorna dettagli
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'error_detail', SQLSTATE,
        'migration_timestamp', CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. FUNZIONI HELPER PER EXPORT/BACKUP
-- =====================================================

-- Funzione per esportare tutti i dati di un utente (per backup)
CREATE OR REPLACE FUNCTION export_user_data(p_user_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'user', row_to_json(u),
        'goals', COALESCE(goals_array.goals, '[]'::jsonb),
        'progress', COALESCE(progress_array.progress, '[]'::jsonb),
        'leagues', COALESCE(leagues_array.leagues, '[]'::jsonb),
        'preferences', COALESCE(prefs_array.preferences, '[]'::jsonb),
        'export_timestamp', CURRENT_TIMESTAMP
    ) INTO result
    FROM users u
    LEFT JOIN (
        SELECT user_id, jsonb_agg(to_jsonb(g)) as goals
        FROM user_goals g
        WHERE user_id = p_user_id
        GROUP BY user_id
    ) goals_array ON u.id = goals_array.user_id
    LEFT JOIN (
        SELECT user_id, jsonb_agg(to_jsonb(p)) as progress
        FROM goal_progress_history p
        WHERE user_id = p_user_id
        GROUP BY user_id
    ) progress_array ON u.id = progress_array.user_id
    LEFT JOIN (
        SELECT lm.user_id, jsonb_agg(
            jsonb_build_object(
                'league', to_jsonb(l),
                'membership', to_jsonb(lm)
            )
        ) as leagues
        FROM league_memberships lm
        JOIN leagues l ON lm.league_id = l.id
        WHERE lm.user_id = p_user_id AND lm.is_active = TRUE
        GROUP BY lm.user_id
    ) leagues_array ON u.id = leagues_array.user_id
    LEFT JOIN (
        SELECT user_id, jsonb_agg(to_jsonb(p)) as preferences
        FROM user_app_preferences p
        WHERE user_id = p_user_id
        GROUP BY user_id
    ) prefs_array ON u.id = prefs_array.user_id
    WHERE u.id = p_user_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. ESEMPI DI UTILIZZO
-- =====================================================

-- Esempio di JSON per migrazione completa:
/*
SELECT migrate_complete_localstorage_data('{
    "username": "patriziopezzilli",
    "displayName": "Patrizio Pezzilli",
    "email": "patrizio@example.com",
    "goals": [
        {
            "id": "goal1",
            "targetPosition": 100,
            "targetDate": "2024-12-31",
            "createdAt": "2024-08-01T10:00:00Z",
            "isActive": true
        }
    ],
    "progressHistory": [
        {
            "currentPosition": 150,
            "score": 2500,
            "date": "2024-08-20T10:00:00Z"
        },
        {
            "currentPosition": 145,
            "score": 2600,
            "date": "2024-08-21T10:00:00Z"
        }
    ],
    "friendsLeague": [
        {
            "username": "friend1",
            "displayName": "Friend One"
        },
        {
            "username": "friend2",
            "displayName": "Friend Two"
        }
    ],
    "preferences": {
        "theme": "dark",
        "notifications": true
    },
    "cache": {
        "lastSync": "2024-08-24T10:00:00Z"
    }
}'::jsonb);
*/

-- Esempio per esportare dati utente:
/*
SELECT export_user_data(1);
*/
