/**
 * Service per gestire la visualizzazione dei disclaimer e changelog
 * Utilizza localStorage per ricordare quali disclaimer sono stati chiusi
 */

const DISMISSED_DISCLAIMERS_KEY = 'isru_dismissed_disclaimers';

export class DisclaimerService {
  /**
   * Verifica se un disclaimer è stato chiuso dall'utente
   */
  static isDismissed(disclaimerId: string): boolean {
    try {
      const dismissed = localStorage.getItem(DISMISSED_DISCLAIMERS_KEY);
      if (!dismissed) return false;
      
      const dismissedList = JSON.parse(dismissed);
      return Array.isArray(dismissedList) && dismissedList.includes(disclaimerId);
    } catch (error) {
      console.warn('Error checking dismissed disclaimers:', error);
      return false;
    }
  }

  /**
   * Marca un disclaimer come chiuso
   */
  static dismiss(disclaimerId: string): void {
    try {
      const dismissed = localStorage.getItem(DISMISSED_DISCLAIMERS_KEY);
      let dismissedList: string[] = [];
      
      if (dismissed) {
        dismissedList = JSON.parse(dismissed);
        if (!Array.isArray(dismissedList)) {
          dismissedList = [];
        }
      }
      
      if (!dismissedList.includes(disclaimerId)) {
        dismissedList.push(disclaimerId);
        localStorage.setItem(DISMISSED_DISCLAIMERS_KEY, JSON.stringify(dismissedList));
      }
    } catch (error) {
      console.warn('Error dismissing disclaimer:', error);
    }
  }

  /**
   * Rimuove un disclaimer dalla lista dei chiusi (per debug/test)
   */
  static undismiss(disclaimerId: string): void {
    try {
      const dismissed = localStorage.getItem(DISMISSED_DISCLAIMERS_KEY);
      if (!dismissed) return;
      
      const dismissedList = JSON.parse(dismissed);
      if (Array.isArray(dismissedList)) {
        const filtered = dismissedList.filter(id => id !== disclaimerId);
        localStorage.setItem(DISMISSED_DISCLAIMERS_KEY, JSON.stringify(filtered));
      }
    } catch (error) {
      console.warn('Error undismissing disclaimer:', error);
    }
  }

  /**
   * Pulisce tutti i disclaimer chiusi (per debug/test)
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(DISMISSED_DISCLAIMERS_KEY);
    } catch (error) {
      console.warn('Error clearing disclaimers:', error);
    }
  }
}

export default DisclaimerService;
