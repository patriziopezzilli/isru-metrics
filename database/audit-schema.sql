-- =====================================================
-- AUDIT TABLE - Simple audit logging for localStorage data
-- Tabella semplice per audit asincrono del localStorage
-- =====================================================

-- Crea tabella audit_localStorage se non esiste
CREATE TABLE IF NOT EXISTS audit_localstorage (
    id BIGSERIAL PRIMARY KEY,
    
    -- Timestamp
    client_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    server_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- User info
    username VARCHAR(100),
    session_id VARCHAR(100) NOT NULL,
    
    -- Client info
    url TEXT,
    user_agent TEXT,
    client_ip INET,
    app_version VARCHAR(20),
    
    -- localStorage data
    localStorage_data JSONB NOT NULL,
    localStorage_size INTEGER,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indici per query efficienti
CREATE INDEX IF NOT EXISTS audit_localstorage_timestamp_idx ON audit_localstorage (server_timestamp DESC);
CREATE INDEX IF NOT EXISTS audit_localstorage_username_idx ON audit_localstorage (username);
CREATE INDEX IF NOT EXISTS audit_localstorage_session_idx ON audit_localstorage (session_id);
CREATE INDEX IF NOT EXISTS audit_localstorage_data_gin_idx ON audit_localstorage USING GIN (localStorage_data);

-- View per analisi rapide
CREATE OR REPLACE VIEW audit_stats AS
SELECT 
    DATE(server_timestamp) as audit_date,
    COUNT(*) as total_audits,
    COUNT(DISTINCT username) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions,
    AVG(localStorage_size) as avg_storage_size,
    MAX(localStorage_size) as max_storage_size
FROM audit_localstorage 
GROUP BY DATE(server_timestamp)
ORDER BY audit_date DESC;

-- View per analisi utenti
CREATE OR REPLACE VIEW user_audit_summary AS
SELECT 
    username,
    COUNT(*) as audit_count,
    MIN(server_timestamp) as first_seen,
    MAX(server_timestamp) as last_seen,
    AVG(localStorage_size) as avg_storage_size,
    
    -- Estrai dati interessanti dal JSON
    COUNT(CASE WHEN localStorage_data ? 'isru-username' THEN 1 END) as has_username_count,
    COUNT(CASE WHEN localStorage_data ? 'friends-league' THEN 1 END) as has_friends_count,
    
    -- Conta le chiavi medie
    AVG(jsonb_array_length(jsonb_object_keys(localStorage_data))) as avg_keys_count
    
FROM audit_localstorage 
WHERE username IS NOT NULL
GROUP BY username
ORDER BY last_seen DESC;

-- Funzione per pulire audit vecchi (opzionale)
CREATE OR REPLACE FUNCTION cleanup_old_audit_data(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_localstorage 
    WHERE server_timestamp < (CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    INSERT INTO audit_localstorage (
        client_timestamp, username, session_id, url, 
        localStorage_data, localStorage_size
    ) VALUES (
        CURRENT_TIMESTAMP, 'system', 'cleanup', 'system/cleanup',
        jsonb_build_object('action', 'cleanup', 'deleted_records', deleted_count, 'days_kept', days_to_keep),
        0
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- QUERY DI ESEMPIO PER ANALISI
-- =====================================================

-- Audit recenti
-- SELECT * FROM audit_localstorage ORDER BY server_timestamp DESC LIMIT 10;

-- Statistiche giornaliere
-- SELECT * FROM audit_stats LIMIT 30;

-- Utenti più attivi
-- SELECT * FROM user_audit_summary ORDER BY audit_count DESC LIMIT 10;

-- Cerca utenti con friends-league
-- SELECT username, server_timestamp, localStorage_data->'friends-league' as friends
-- FROM audit_localstorage 
-- WHERE localStorage_data ? 'friends-league' 
-- ORDER BY server_timestamp DESC;

-- Dimensioni localStorage nel tempo
-- SELECT 
--     DATE(server_timestamp) as date,
--     AVG(localStorage_size) as avg_size,
--     MAX(localStorage_size) as max_size,
--     COUNT(*) as audits
-- FROM audit_localstorage 
-- GROUP BY DATE(server_timestamp) 
-- ORDER BY date DESC;

-- Pulizia audit più vecchi di 60 giorni
-- SELECT cleanup_old_audit_data(60);
