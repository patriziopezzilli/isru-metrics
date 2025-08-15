import { OfflineData, ScoreDistributionResponse, UserStats, SneakerDBUserProfile, UserGoal } from '../types';

class OfflineService {
  private static readonly OFFLINE_DATA_KEY = 'isru-offline-data';
  private static readonly CACHE_VERSION = '1.0.0';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  // Check if the device is online
  static isOnline(): boolean {
    return navigator.onLine;
  }

  // Save data for offline use
  static saveOfflineData(
    scoreDistribution: ScoreDistributionResponse,
    userStats?: UserStats,
    userProfile?: SneakerDBUserProfile,
    goals: UserGoal[] = []
  ): void {
    const offlineData: OfflineData = {
      lastUpdate: new Date(),
      scoreDistribution,
      userStats,
      userProfile,
      goals,
      cacheVersion: this.CACHE_VERSION
    };

    try {
      const dataSize = JSON.stringify(offlineData).length;
      console.log(`💾 Saving offline data (${(dataSize / 1024).toFixed(1)} KB)`);
      
      localStorage.setItem(this.OFFLINE_DATA_KEY, JSON.stringify(offlineData));
      
      // Also save to sessionStorage as backup
      sessionStorage.setItem(this.OFFLINE_DATA_KEY, JSON.stringify(offlineData));
      
      console.log('✅ Offline data saved successfully');
    } catch (error) {
      console.error('❌ Failed to save offline data:', error);
      
      // If localStorage is full, try to clear old data and retry
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.clearOldCache();
        try {
          localStorage.setItem(this.OFFLINE_DATA_KEY, JSON.stringify(offlineData));
          console.log('✅ Offline data saved after cache cleanup');
        } catch (retryError) {
          console.error('❌ Failed to save offline data even after cleanup:', retryError);
        }
      }
    }
  }

  // Load offline data
  static loadOfflineData(): OfflineData | null {
    try {
      // Try localStorage first
      let stored = localStorage.getItem(this.OFFLINE_DATA_KEY);
      
      // Fallback to sessionStorage
      if (!stored) {
        stored = sessionStorage.getItem(this.OFFLINE_DATA_KEY);
      }

      if (!stored) {
        console.log('📱 No offline data found');
        return null;
      }

      const data: OfflineData = JSON.parse(stored);
      
      // Convert date strings back to Date objects
      data.lastUpdate = new Date(data.lastUpdate);
      if (data.userProfile?.user?.dateJoined) {
        data.userProfile.user.dateJoined = data.userProfile.user.dateJoined;
      }

      // Check if data is still valid
      const isExpired = this.isDataExpired(data.lastUpdate);
      
      if (isExpired) {
        console.log('⏰ Offline data expired, will refresh when online');
      } else {
        console.log('📦 Loaded fresh offline data');
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to load offline data:', error);
      return null;
    }
  }

  // Check if cached data is expired
  static isDataExpired(lastUpdate: Date): boolean {
    const now = new Date().getTime();
    const updateTime = lastUpdate.getTime();
    return (now - updateTime) > this.CACHE_DURATION;
  }

  // Get connection status with detailed info
  static getConnectionStatus(): {
    isOnline: boolean;
    connectionType?: string;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  } {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      isOnline: navigator.onLine,
      connectionType: connection?.type,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt
    };
  }

  // Check if we should use offline data (poor connection or offline)
  static shouldUseOfflineData(): boolean {
    if (!this.isOnline()) {
      return true;
    }

    const connection = (navigator as any).connection;
    if (connection) {
      // Use offline data if connection is very slow
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        console.log('🐌 Slow connection detected, using offline data');
        return true;
      }
      
      // Use offline data if high RTT (slow response)
      if (connection.rtt && connection.rtt > 2000) {
        console.log('⏱️ High latency detected, using offline data');
        return true;
      }
    }

    return false;
  }

  // Clear all offline data
  static clearOfflineData(): void {
    try {
      localStorage.removeItem(this.OFFLINE_DATA_KEY);
      sessionStorage.removeItem(this.OFFLINE_DATA_KEY);
      console.log('🗑️ Offline data cleared');
    } catch (error) {
      console.error('❌ Failed to clear offline data:', error);
    }
  }

  // Get offline data size
  static getOfflineDataSize(): { localStorage: number; sessionStorage: number } {
    try {
      const localData = localStorage.getItem(this.OFFLINE_DATA_KEY);
      const sessionData = sessionStorage.getItem(this.OFFLINE_DATA_KEY);
      
      return {
        localStorage: localData ? localData.length : 0,
        sessionStorage: sessionData ? sessionData.length : 0
      };
    } catch (error) {
      return { localStorage: 0, sessionStorage: 0 };
    }
  }

  // Setup offline event listeners
  static setupOfflineListeners(
    onOnline: () => void,
    onOffline: () => void
  ): () => void {
    const handleOnline = () => {
      console.log('🌐 Device came online');
      onOnline();
    };

    const handleOffline = () => {
      console.log('📱 Device went offline');
      onOffline();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  // Sync data when coming back online
  static async syncData(
    refreshFunction: () => Promise<void>
  ): Promise<void> {
    if (this.isOnline()) {
      try {
        console.log('🔄 Syncing data after coming online...');
        await refreshFunction();
        console.log('✅ Data sync completed');
      } catch (error) {
        console.error('❌ Failed to sync data:', error);
      }
    }
  }

  // Private helper methods
  private static clearOldCache(): void {
    try {
      // Clear other app caches that might be taking up space
      const keys = Object.keys(localStorage);
      const oldKeys = keys.filter(key => 
        key.startsWith('isru-') && 
        key !== this.OFFLINE_DATA_KEY &&
        !key.includes('username') && 
        !key.includes('goals')
      );
      
      oldKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore individual failures
        }
      });
      
      console.log(`🧹 Cleared ${oldKeys.length} old cache entries`);
    } catch (error) {
      console.error('Failed to clear old cache:', error);
    }
  }

  // Export data for backup
  static exportData(): string {
    const offlineData = this.loadOfflineData();
    return JSON.stringify(offlineData, null, 2);
  }

  // Import data from backup
  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      localStorage.setItem(this.OFFLINE_DATA_KEY, JSON.stringify(data));
      console.log('📥 Data imported successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to import data:', error);
      return false;
    }
  }
}

export default OfflineService;
