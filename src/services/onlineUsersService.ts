import { OnlineUserStats, UserSession } from '../types';

class OnlineUsersService {
  private static instance: OnlineUsersService;
  private sessionId: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private onlineStats: OnlineUserStats = {
    currentOnline: 0,
    peakToday: 0,
    totalVisitsToday: 0,
    lastUpdated: new Date()
  };

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeSession();
  }

  static getInstance(): OnlineUsersService {
    if (!OnlineUsersService.instance) {
      OnlineUsersService.instance = new OnlineUsersService();
    }
    return OnlineUsersService.instance;
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private initializeSession() {
    // Simula la registrazione della sessione
    this.updateLocalActivity();
    this.startHeartbeat();
    
    // Pulisci al chiudere la pagina
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });

    // Aggiorna attività su interazioni
    ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
      document.addEventListener(event, this.throttledActivityUpdate, { passive: true });
    });
  }

  private throttledActivityUpdate = this.throttle(() => {
    this.updateLocalActivity();
  }, 30000); // Aggiorna ogni 30 secondi max

  private throttle(func: Function, limit: number) {
    let inThrottle: boolean;
    return function(this: any) {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  }

  private updateLocalActivity() {
    const now = new Date();
    const sessionData: UserSession = {
      sessionId: this.sessionId,
      joinedAt: new Date(),
      lastActivity: now,
      userAgent: navigator.userAgent
    };

    // Salva in localStorage con timestamp
    const sessions = this.getActiveSessions();
    sessions[this.sessionId] = sessionData;
    localStorage.setItem('online_sessions', JSON.stringify(sessions));
    
    this.calculateOnlineStats();
  }

  private getActiveSessions(): Record<string, UserSession> {
    try {
      const stored = localStorage.getItem('online_sessions');
      if (!stored) return {};
      
      const sessions = JSON.parse(stored);
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      // Filtra sessioni attive (ultimi 5 minuti)
      const activeSessions: Record<string, UserSession> = {};
      Object.entries(sessions).forEach(([id, session]: [string, any]) => {
        const lastActivity = new Date(session.lastActivity);
        if (lastActivity > fiveMinutesAgo) {
          activeSessions[id] = session;
        }
      });
      
      return activeSessions;
    } catch (error) {
      console.error('Error reading sessions:', error);
      return {};
    }
  }

  private calculateOnlineStats() {
    const sessions = this.getActiveSessions();
    const currentOnline = Object.keys(sessions).length;
    
    // Simula alcuni utenti online aggiuntivi per rendere più realistico
    const simulatedOnline = this.getSimulatedOnlineCount();
    const totalOnline = currentOnline + simulatedOnline;
    
    // Aggiorna peak giornaliero
    const storedStats = this.getStoredStats();
    const peakToday = Math.max(storedStats.peakToday, totalOnline);
    
    this.onlineStats = {
      currentOnline: totalOnline,
      peakToday,
      totalVisitsToday: storedStats.totalVisitsToday + (currentOnline > storedStats.currentOnline ? 1 : 0),
      lastUpdated: new Date()
    };

    // Salva le statistiche
    localStorage.setItem('online_stats', JSON.stringify(this.onlineStats));
  }

  private getSimulatedOnlineCount(): number {
    // Simula utenti online basandosi sull'ora del giorno
    const hour = new Date().getHours();
    const baseCount = 8; // Base minima
    
    // Picco durante orari lavorativi europei (9-18)
    if (hour >= 9 && hour <= 18) {
      return baseCount + Math.floor(Math.random() * 12) + 5; // 13-25 utenti
    }
    // Sera europea (19-23)
    else if (hour >= 19 && hour <= 23) {
      return baseCount + Math.floor(Math.random() * 8) + 3; // 11-19 utenti
    }
    // Notte/mattina presto
    else {
      return baseCount + Math.floor(Math.random() * 5); // 8-13 utenti
    }
  }

  private getStoredStats(): OnlineUserStats {
    try {
      const stored = localStorage.getItem('online_stats');
      if (!stored) return this.onlineStats;
      
      const stats = JSON.parse(stored);
      const lastUpdate = new Date(stats.lastUpdated);
      const today = new Date();
      
      // Reset statistics if it's a new day
      if (lastUpdate.toDateString() !== today.toDateString()) {
        return {
          currentOnline: 0,
          peakToday: 0,
          totalVisitsToday: 0,
          lastUpdated: today
        };
      }
      
      return stats;
    } catch (error) {
      return this.onlineStats;
    }
  }

  private startHeartbeat() {
    // Aggiorna ogni 2 minuti
    this.heartbeatInterval = setInterval(() => {
      this.updateLocalActivity();
    }, 120000);
  }

  private endSession() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Rimuovi la sessione corrente
    const sessions = this.getActiveSessions();
    delete sessions[this.sessionId];
    localStorage.setItem('online_sessions', JSON.stringify(sessions));
  }

  public getOnlineStats(): OnlineUserStats {
    this.calculateOnlineStats();
    return this.onlineStats;
  }

  public subscribe(callback: (stats: OnlineUserStats) => void): () => void {
    // Simula aggiornamenti in tempo reale
    const interval = setInterval(() => {
      callback(this.getOnlineStats());
    }, 15000); // Aggiorna ogni 15 secondi

    // Ritorna funzione di cleanup
    return () => clearInterval(interval);
  }
}

export default OnlineUsersService;
