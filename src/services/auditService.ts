// =====================================================
// AUDIT SERVICE - Async localStorage Audit to Database
// Servizio per audit asincrono del localStorage (solo scrittura)
// =====================================================

// =====================================================
// TIPI E INTERFACCE
// =====================================================

export interface AuditData {
    timestamp: string;
    user_agent: string;
    url: string;
    username?: string;
    localStorage_data: {
        [key: string]: any;
    };
    localStorage_size: number;
    app_version?: string;
    session_id: string;
}

export interface AuditOptions {
    includeAllKeys?: boolean;  // Include tutte le chiavi localStorage o solo quelle ISRU
    maxDataSize?: number;      // Limite dimensioni dati (in caratteri)
    onSuccess?: () => void;    // Callback successo
    onError?: (error: any) => void; // Callback errore
}

// =====================================================
// AUDIT SERVICE CLASS
// =====================================================

export class AuditService {
    private static readonly AUDIT_ENDPOINT = '/api/audit'; // Cambiato a MongoDB Atlas
    private static readonly MAX_RETRIES = 3;
    private static readonly RETRY_DELAY = 1000; // 1 secondo

    // Throttling per evitare spam
    private static lastAuditTime: number = 0;
    private static lastAuditUsername: string | null = null;
    private static readonly AUDIT_COOLDOWN = 30 * 60 * 1000; // 30 minuti

    /**
     * Invia audit asincrono del localStorage al database
     */
    static async auditLocalStorage(options: AuditOptions = {}): Promise<void> {
        try {
            // 1. Verifica che ci sia un username
            const username = localStorage.getItem('isru-username');
            if (!username || username.trim() === '') {
                if (options.onSuccess) options.onSuccess();
                return;
            }

            // 2. Throttling intelligente
            const now = Date.now();
            const timeSinceLastAudit = now - this.lastAuditTime;
            const sameUser = this.lastAuditUsername === username;

            // Se stesso utente e meno di 30 minuti fa, salta
            if (sameUser && timeSinceLastAudit < this.AUDIT_COOLDOWN) {
                const remainingTime = Math.ceil((this.AUDIT_COOLDOWN - timeSinceLastAudit) / 60000);
                if (options.onSuccess) options.onSuccess();
                return;
            }

            // Aggiorna tracking
            this.lastAuditTime = now;
            this.lastAuditUsername = username;

            // Raccogli dati audit
            const auditData = this.collectAuditData(options);

            // Invia in modo asincrono (non blocca UI)
            this.sendAuditAsync(auditData, options);
            
        } catch (error) {
            console.warn('⚠️ Audit collection failed:', error);
            if (options.onError) {
                options.onError(error);
            }
        }
    }

    /**
     * Raccoglie i dati per l'audit
     */
    private static collectAuditData(options: AuditOptions): AuditData {
        const now = new Date().toISOString();
        const sessionId = this.generateSessionId();
        
        // Raccogli dati localStorage
        const localStorageData: { [key: string]: any } = {};
        let totalSize = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            
            // Filtra chiavi se richiesto
            if (!options.includeAllKeys && !this.isIsruRelatedKey(key)) {
                continue;
            }
            
            const value = localStorage.getItem(key);
            if (value) {
                totalSize += value.length;
                
                // Limita dimensioni se specificato
                if (options.maxDataSize && totalSize > options.maxDataSize) {
                    localStorageData[key] = '[TRUNCATED - Too large]';
                } else {
                    try {
                        // Prova a parsare come JSON
                        localStorageData[key] = JSON.parse(value);
                    } catch {
                        // Se non è JSON, mantieni come stringa
                        localStorageData[key] = value;
                    }
                }
            }
        }
        
        // Estrai username se presente
        const username = localStorage.getItem('isru-username') || undefined;
        
        return {
            timestamp: now,
            user_agent: navigator.userAgent,
            url: window.location.href,
            username,
            localStorage_data: localStorageData,
            localStorage_size: totalSize,
            app_version: this.getAppVersion(),
            session_id: sessionId
        };
    }

    /**
     * Invia audit al database in modo asincrono
     */
    private static async sendAuditAsync(auditData: AuditData, options: AuditOptions): Promise<void> {
        // Non await - esegui in background
        this.sendWithRetry(auditData, options, 0);
    }

    /**
     * Invia con retry automatico
     */
    private static async sendWithRetry(
        auditData: AuditData, 
        options: AuditOptions, 
        attempt: number
    ): Promise<void> {
        try {
            const response = await fetch(this.AUDIT_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(auditData)
            });
            
            if (response.ok) {
                if (options.onSuccess) {
                    options.onSuccess();
                }
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
        } catch (error) {
            console.warn(`⚠️ Audit send failed (attempt ${attempt + 1}):`, error);
            
            // Retry se non abbiamo raggiunto il limite
            if (attempt < this.MAX_RETRIES - 1) {
                setTimeout(() => {
                    this.sendWithRetry(auditData, options, attempt + 1);
                }, this.RETRY_DELAY * (attempt + 1)); // Exponential backoff
            } else {
                console.warn('⚠️ Audit failed after all retries. Service may be unavailable, but user not blocked.');

                // Graceful degradation - don't block user experience
                if (options.onSuccess) {
                    options.onSuccess();
                }

                // Still call onError for logging purposes
                if (options.onError) {
                    options.onError(error);
                }
            }
        }
    }

    /**
     * Verifica se una chiave è relativa a ISRU
     */
    private static isIsruRelatedKey(key: string): boolean {
        const isruKeys = [
            'isru-username',
            'friends-league',
            'goal',
            'progress',
            'cache',
            'streak',
            'migration'
        ];
        
        return isruKeys.some(pattern => key.toLowerCase().includes(pattern.toLowerCase()));
    }

    /**
     * Genera un session ID unico
     */
    private static generateSessionId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Ottiene la versione dell'app (se disponibile)
     */
    private static getAppVersion(): string | undefined {
        // Cerca la versione in vari posti
        try {
            // Da package.json se disponibile
            return process.env.REACT_APP_VERSION || 
                   process.env.npm_package_version || 
                   '1.0.0';
        } catch {
            return undefined;
        }
    }

    /**
     * Audit all'avvio dell'app (chiamata automatica)
     */
    static auditOnAppStart(): void {
        // Attendi che l'app sia caricata
        if (document.readyState === 'complete') {
            this.performStartupAudit();
        } else {
            window.addEventListener('load', () => {
                this.performStartupAudit();
            });
        }
    }

    /**
     * Esegue audit all'avvio
     */
    private static performStartupAudit(): void {
        // Piccolo delay per assicurarsi che tutto sia caricato
        setTimeout(() => {
            this.auditLocalStorage({
                includeAllKeys: false, // Solo chiavi ISRU
                maxDataSize: 50000,    // Max 50KB
                onSuccess: () => {
                },
                onError: (error) => {
                    console.warn('📊 Startup audit failed:', error);
                }
            });
        }, 2000); // 2 secondi dopo il caricamento
    }

    /**
     * Audit quando cambia il localStorage (opzionale)
     */
    static auditOnStorageChange(): void {
        window.addEventListener('storage', () => {
            this.auditLocalStorage({
                includeAllKeys: false,
                maxDataSize: 50000
            });
        });
    }

    /**
     * Audit manuale (per debug)
     */
    static auditNow(includeAll: boolean = false): void {
        this.auditLocalStorage({
            includeAllKeys: includeAll,
            maxDataSize: 100000,
            onSuccess: () => {
            },
            onError: (error) => {
                console.error('📊 Manual audit failed:', error);
            }
        });
    }

    /**
     * Ottieni statistiche localStorage (senza invio)
     */
    static getLocalStorageStats(): {
        totalKeys: number;
        isruKeys: number;
        totalSize: number;
        hasUsername: boolean;
        hasFriends: boolean;
    } {
        let totalKeys = 0;
        let isruKeys = 0;
        let totalSize = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                totalKeys++;
                const value = localStorage.getItem(key);
                if (value) {
                    totalSize += value.length;
                }
                
                if (this.isIsruRelatedKey(key)) {
                    isruKeys++;
                }
            }
        }
        
        return {
            totalKeys,
            isruKeys,
            totalSize,
            hasUsername: !!localStorage.getItem('isru-username'),
            hasFriends: !!localStorage.getItem('friends-league')
        };
    }
}

// =====================================================
// AUTO-INIZIALIZZAZIONE
// =====================================================

// Inizializza audit automatico quando il modulo viene importato
if (typeof window !== 'undefined') {
    // Audit all'avvio dell'app
    AuditService.auditOnAppStart();
    
    // Opzionale: audit quando cambia localStorage
    // AuditService.auditOnStorageChange();
}

// =====================================================
// EXPORT DEFAULT
// =====================================================

export default AuditService;
