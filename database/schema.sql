-- =====================================================
-- ISRU METRICS DATABASE SCHEMA
-- Database relazionale per ISRU League App
-- =====================================================

-- 1. TABELLA UTENTI - Informazioni base degli utenti
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    -- Metadati utente
    first_login_at TIMESTAMP WITH TIME ZONE,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}', -- Per preferenze UI, theme, etc.
    
    -- Indici
    CONSTRAINT users_username_check CHECK (length(username) >= 3)
);

-- 2. TABELLA SESSIONI - Per gestire autenticazione e sessioni
CREATE TABLE user_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- 3. TABELLA GOALS - Obiettivi degli utenti
CREATE TABLE user_goals (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_position INTEGER NOT NULL,
    target_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    achieved_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    
    -- Validazioni
    CONSTRAINT user_goals_target_position_check CHECK (target_position > 0),
    CONSTRAINT user_goals_target_date_check CHECK (target_date IS NULL OR target_date >= CURRENT_DATE)
);

-- 4. TABELLA PROGRESS HISTORY - Storico progressi verso gli obiettivi
CREATE TABLE goal_progress_history (
    id BIGSERIAL PRIMARY KEY,
    goal_id BIGINT NOT NULL REFERENCES user_goals(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_position INTEGER,
    score INTEGER,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'api', 'sync'
    
    -- Metadati del record
    metadata JSONB DEFAULT '{}' -- Per dati extra come rank change, streak info, etc.
);

-- 5. TABELLA LEAGUES - Leghe/gruppi di amici
CREATE TABLE leagues (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_private BOOLEAN DEFAULT TRUE,
    invite_code VARCHAR(50) UNIQUE, -- Per inviti via codice
    
    -- Configurazioni della lega
    settings JSONB DEFAULT '{
        "allow_public_join": false,
        "max_members": 50,
        "auto_remove_inactive": false
    }'
);

-- 6. TABELLA LEAGUE MEMBERSHIPS - Appartenenza alle leghe
CREATE TABLE league_memberships (
    id BIGSERIAL PRIMARY KEY,
    league_id BIGINT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(20) DEFAULT 'member', -- 'owner', 'admin', 'member'
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Prevenire duplicati
    UNIQUE(league_id, user_id)
);

-- 7. TABELLA CACHE API - Cache centralizzata per API calls
CREATE TABLE api_cache (
    id BIGSERIAL PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    cache_type VARCHAR(50) NOT NULL, -- 'profile', 'streak', 'leaderboard', etc.
    
    -- Metadati cache
    metadata JSONB DEFAULT '{}' -- Per source, version, etc.
);

-- 8. TABELLA ACTIVITY STREAKS - Cache per activity streaks
CREATE TABLE activity_streaks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_id INTEGER NOT NULL,
    streak_data JSONB NOT NULL,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Evita duplicati per user+activity per giorno
    cache_date DATE DEFAULT CURRENT_DATE,
    UNIQUE(user_id, activity_id, cache_date)
);

-- 9. TABELLA USER PREFERENCES - Preferenze specifiche app
CREATE TABLE user_app_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, preference_key)
);

-- 10. TABELLA AUDIT LOG - Per tracking delle operazioni
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- 'login', 'goal_created', 'league_joined', etc.
    entity_type VARCHAR(50), -- 'user', 'goal', 'league', etc.
    entity_id BIGINT,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDICI PER PERFORMANCE
-- =====================================================

-- Indici per users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_last_seen ON users(last_seen_at);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Indici per user_sessions
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- Indici per user_goals
CREATE INDEX idx_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_goals_active ON user_goals(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_goals_target_date ON user_goals(target_date);

-- Indici per goal_progress_history
CREATE INDEX idx_progress_goal_id ON goal_progress_history(goal_id);
CREATE INDEX idx_progress_user_id ON goal_progress_history(user_id);
CREATE INDEX idx_progress_recorded_at ON goal_progress_history(recorded_at);

-- Indici per leagues
CREATE INDEX idx_leagues_created_by ON leagues(created_by);
CREATE INDEX idx_leagues_invite_code ON leagues(invite_code);

-- Indici per league_memberships
CREATE INDEX idx_memberships_league_id ON league_memberships(league_id);
CREATE INDEX idx_memberships_user_id ON league_memberships(user_id);
CREATE INDEX idx_memberships_active ON league_memberships(league_id, user_id) WHERE is_active = TRUE;

-- Indici per api_cache
CREATE INDEX idx_cache_key ON api_cache(cache_key);
CREATE INDEX idx_cache_user_id ON api_cache(user_id);
CREATE INDEX idx_cache_expires ON api_cache(expires_at);
CREATE INDEX idx_cache_type ON api_cache(cache_type);

-- Indici per activity_streaks
CREATE INDEX idx_streaks_user_activity ON activity_streaks(user_id, activity_id);
CREATE INDEX idx_streaks_expires ON activity_streaks(expires_at);
CREATE INDEX idx_streaks_date ON activity_streaks(cache_date);

-- Indici per user_app_preferences
CREATE INDEX idx_preferences_user_key ON user_app_preferences(user_id, preference_key);

-- Indici per audit_log
CREATE INDEX idx_audit_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);

-- =====================================================
-- TRIGGER PER AUTO-UPDATE TIMESTAMPS
-- =====================================================

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Applica trigger a tabelle che hanno updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON user_app_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VISTE UTILI
-- =====================================================

-- Vista per goals attivi con progresso
CREATE VIEW active_goals_with_progress AS
SELECT 
    g.id as goal_id,
    g.user_id,
    u.username,
    g.target_position,
    g.target_date,
    g.created_at as goal_created_at,
    p.current_position,
    p.score,
    p.recorded_at as last_progress_update,
    CASE 
        WHEN g.target_date IS NOT NULL 
        THEN g.target_date - CURRENT_DATE 
        ELSE NULL 
    END as days_remaining
FROM user_goals g
JOIN users u ON g.user_id = u.id
LEFT JOIN LATERAL (
    SELECT current_position, score, recorded_at
    FROM goal_progress_history 
    WHERE goal_id = g.id 
    ORDER BY recorded_at DESC 
    LIMIT 1
) p ON true
WHERE g.is_active = TRUE;

-- Vista per league summary
CREATE VIEW league_summary AS
SELECT 
    l.id as league_id,
    l.name,
    l.description,
    creator.username as created_by_username,
    l.created_at,
    COUNT(lm.user_id) as member_count,
    ARRAY_AGG(u.username ORDER BY lm.joined_at) as members
FROM leagues l
JOIN users creator ON l.created_by = creator.id
LEFT JOIN league_memberships lm ON l.id = lm.league_id AND lm.is_active = TRUE
LEFT JOIN users u ON lm.user_id = u.id
GROUP BY l.id, l.name, l.description, creator.username, l.created_at;

-- =====================================================
-- FUNZIONI UTILITY
-- =====================================================

-- Funzione per pulire cache scaduta
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM api_cache WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    DELETE FROM activity_streaks WHERE expires_at < CURRENT_TIMESTAMP;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Funzione per ottenere statistiche utente
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id BIGINT)
RETURNS TABLE(
    total_goals INTEGER,
    active_goals INTEGER,
    achieved_goals INTEGER,
    leagues_count INTEGER,
    last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM user_goals WHERE user_id = p_user_id),
        (SELECT COUNT(*)::INTEGER FROM user_goals WHERE user_id = p_user_id AND is_active = TRUE),
        (SELECT COUNT(*)::INTEGER FROM user_goals WHERE user_id = p_user_id AND achieved_at IS NOT NULL),
        (SELECT COUNT(*)::INTEGER FROM league_memberships WHERE user_id = p_user_id AND is_active = TRUE),
        (SELECT MAX(recorded_at) FROM goal_progress_history WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DATI DI ESEMPIO PER TESTING
-- =====================================================

-- Inserisci alcuni utenti di test
INSERT INTO users (username, display_name, email, first_login_at, last_seen_at) VALUES
('patriziopezzilli', 'Patrizio Pezzilli', 'patrizio@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('testuser1', 'Test User 1', 'test1@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('testuser2', 'Test User 2', 'test2@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Crea una lega di esempio
INSERT INTO leagues (name, description, created_by, invite_code) VALUES
('Friends League', 'Lega tra amici per ISRU Camp', 1, 'FRIENDS2024');

-- Aggiungi membri alla lega
INSERT INTO league_memberships (league_id, user_id, role) VALUES
(1, 1, 'owner'),
(1, 2, 'member'),
(1, 3, 'member');

-- Crea goal di esempio
INSERT INTO user_goals (user_id, target_position, target_date) VALUES
(1, 100, CURRENT_DATE + INTERVAL '30 days'),
(2, 50, CURRENT_DATE + INTERVAL '60 days');

-- =====================================================
-- COMMENTI E DOCUMENTAZIONE
-- =====================================================

COMMENT ON TABLE users IS 'Tabella principale utenti con informazioni base e metadati';
COMMENT ON TABLE user_sessions IS 'Gestione sessioni e autenticazione utenti';
COMMENT ON TABLE user_goals IS 'Obiettivi di posizione degli utenti';
COMMENT ON TABLE goal_progress_history IS 'Storico dei progressi verso gli obiettivi';
COMMENT ON TABLE leagues IS 'Leghe/gruppi di amici per competizioni';
COMMENT ON TABLE league_memberships IS 'Appartenenza degli utenti alle leghe';
COMMENT ON TABLE api_cache IS 'Cache centralizzata per API calls';
COMMENT ON TABLE activity_streaks IS 'Cache specializzata per activity streaks con reset giornaliero';
COMMENT ON TABLE user_app_preferences IS 'Preferenze specifiche dell app per ogni utente';
COMMENT ON TABLE audit_log IS 'Log delle operazioni per auditing e debugging';

COMMENT ON FUNCTION clean_expired_cache() IS 'Funzione di manutenzione per pulire cache scaduta';
COMMENT ON FUNCTION get_user_stats(BIGINT) IS 'Ottiene statistiche aggregate per un utente';

COMMENT ON VIEW active_goals_with_progress IS 'Vista che combina goals attivi con ultimo progresso registrato';
COMMENT ON VIEW league_summary IS 'Vista riassuntiva delle leghe con conteggio membri';
