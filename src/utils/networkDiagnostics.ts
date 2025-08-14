// Network diagnostics utility for Safari mobile debugging
export class NetworkDiagnostics {
  static async testConnectivity(): Promise<{
    online: boolean;
    canReachGoogle: boolean;
    canReachTarget: boolean;
    details: any;
  }> {
    const results = {
      online: navigator.onLine,
      canReachGoogle: false,
      canReachTarget: false,
      details: {
        userAgent: navigator.userAgent,
        location: window.location.href,
        connection: (navigator as any).connection || null,
        timestamp: new Date().toISOString()
      }
    };

    console.log('🔍 Starting network diagnostics...', results.details);

    // Test 1: Can we reach Google (basic internet connectivity)
    try {
      const googleResponse = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      results.canReachGoogle = true;
      console.log('✅ Google connectivity test passed');
    } catch (error) {
      console.log('❌ Google connectivity test failed:', error);
    }

    // Test 2: Can we reach our target API
    try {
      const targetResponse = await fetch('https://isrucamp.com/api/users/leaderboard/score-distribution/?preload_users=true', {
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache'
      });
      results.canReachTarget = targetResponse.ok;
      console.log('✅ Target API connectivity test:', targetResponse.status);
    } catch (error) {
      console.log('❌ Target API connectivity test failed:', error);
    }

    return results;
  }

  static logEnvironmentInfo(): void {
    console.log('🌐 Environment Information:', {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      connection: (navigator as any).connection,
      location: {
        href: window.location.href,
        protocol: window.location.protocol,
        host: window.location.host,
        origin: window.location.origin
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight
      },
      viewport: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight
      }
    });
  }

  static isSafariMobile(): boolean {
    const ua = navigator.userAgent;
    return /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/Chrome/.test(ua);
  }

  static isLocalDevelopment(): boolean {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.includes('192.168.');
  }
}
