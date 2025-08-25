// =====================================================
// ACTIVITY TRACKER SERVICE
// Tracks user interactions (clicks, movements, page views) 
// Sends data to MongoDB in batches - completely non-blocking
// =====================================================

interface ActivityEvent {
  type: 'click' | 'mousemove' | 'scroll' | 'page_view' | 'tab_change' | 'feature_use';
  element?: string;
  page: string;
  coordinates?: { x: number; y: number };
  scroll_position?: number;
  feature?: string;
  metadata?: Record<string, any>;
}

interface ActivityBatch {
  session_id: string;
  username?: string;
  user_agent: string;
  timestamp: string;
  events: ActivityEvent[];
  session_duration: number;
  page_views: string[];
  total_clicks: number;
  total_scrolls: number;
  total_mousemoves: number;
}

export class ActivityTracker {
  private static instance: ActivityTracker;
  private events: ActivityEvent[] = [];
  private sessionId: string;
  private sessionStart: number;
  private currentPage: string = '';
  private pageViews: Set<string> = new Set();
  private clickCount: number = 0;
  private scrollCount: number = 0;
  private mouseMoveCount: number = 0;
  private lastMouseMove: number = 0;
  private lastScroll: number = 0;
  private batchTimer: NodeJS.Timeout | null = null;
  private isActive: boolean = true;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
    this.setupEventListeners();
    this.startBatchTimer();
    
    console.log('🎯 ActivityTracker initialized:', this.sessionId);
  }

  static getInstance(): ActivityTracker {
    if (!ActivityTracker.instance) {
      ActivityTracker.instance = new ActivityTracker();
    }
    return ActivityTracker.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupEventListeners(): void {
    // Click tracking
    document.addEventListener('click', (e) => {
      if (!this.isActive) return;
      
      const target = e.target as HTMLElement;
      const elementInfo = this.getElementInfo(target);
      
      this.addEvent({
        type: 'click',
        element: elementInfo,
        page: this.currentPage,
        coordinates: { x: e.clientX, y: e.clientY }
      });
      
      this.clickCount++;
    }, { passive: true });

    // Mouse movement tracking (throttled)
    document.addEventListener('mousemove', (e) => {
      if (!this.isActive) return;
      
      const now = Date.now();
      if (now - this.lastMouseMove < 1000) return; // Throttle to 1 per second
      
      this.lastMouseMove = now;
      this.addEvent({
        type: 'mousemove',
        page: this.currentPage,
        coordinates: { x: e.clientX, y: e.clientY }
      });
      
      this.mouseMoveCount++;
    }, { passive: true });

    // Scroll tracking (throttled)
    document.addEventListener('scroll', () => {
      if (!this.isActive) return;
      
      const now = Date.now();
      if (now - this.lastScroll < 500) return; // Throttle to 1 per 500ms
      
      this.lastScroll = now;
      this.addEvent({
        type: 'scroll',
        page: this.currentPage,
        scroll_position: window.scrollY
      });
      
      this.scrollCount++;
    }, { passive: true });

    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.isActive = false;
        this.sendBatch(); // Send data when user leaves
      } else {
        this.isActive = true;
      }
    });

    // Before unload - send final batch
    window.addEventListener('beforeunload', () => {
      this.sendBatch();
    });
  }

  private getElementInfo(element: HTMLElement): string {
    try {
      const tag = element.tagName.toLowerCase();
      const id = element.id ? `#${element.id}` : '';

      // Safely handle className - convert to string first
      let className = '';
      if (element.className) {
        // Convert className to string safely
        const classStr = String(element.className);
        if (classStr && classStr.trim()) {
          className = `.${classStr.split(' ').filter(c => c.trim()).join('.')}`;
        }
      }

      const text = element.textContent?.slice(0, 50) || '';

      return `${tag}${id}${className}${text ? ` "${text}"` : ''}`.slice(0, 200);
    } catch (error) {
      // Fallback in case of any error
      console.warn('⚠️ Error getting element info:', error);
      return `${element.tagName?.toLowerCase() || 'unknown'}`;
    }
  }

  private addEvent(event: ActivityEvent): void {
    this.events.push({
      ...event,
      metadata: {
        timestamp: new Date().toISOString(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    });

    // Auto-send if batch gets too large
    if (this.events.length >= 50) {
      this.sendBatch();
    }
  }

  // Public methods for manual tracking
  public trackPageView(page: string): void {
    this.currentPage = page;
    this.pageViews.add(page);
    
    this.addEvent({
      type: 'page_view',
      page: page,
      metadata: {
        referrer: document.referrer,
        url: window.location.href
      }
    });
    
    console.log('📄 Page view tracked:', page);
  }

  public trackFeatureUse(feature: string, metadata?: Record<string, any>): void {
    this.addEvent({
      type: 'feature_use',
      page: this.currentPage,
      feature: feature,
      metadata: metadata
    });
    
    console.log('🎮 Feature use tracked:', feature);
  }

  public trackTabChange(newTab: string): void {
    this.addEvent({
      type: 'tab_change',
      page: this.currentPage,
      metadata: { new_tab: newTab }
    });
    
    console.log('📑 Tab change tracked:', newTab);
  }

  private startBatchTimer(): void {
    // Send batch every 30 seconds
    this.batchTimer = setInterval(() => {
      if (this.events.length > 0) {
        this.sendBatch();
      }
    }, 30000);
  }

  private async sendBatch(): Promise<void> {
    if (this.events.length === 0) return;

    const batch: ActivityBatch = {
      session_id: this.sessionId,
      username: localStorage.getItem('isru-username') || undefined,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      events: [...this.events],
      session_duration: Date.now() - this.sessionStart,
      page_views: Array.from(this.pageViews),
      total_clicks: this.clickCount,
      total_scrolls: this.scrollCount,
      total_mousemoves: this.mouseMoveCount
    };

    // Clear events immediately (non-blocking)
    this.events = [];

    try {
      // Send asynchronously - don't block UI
      fetch('/api/activity-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch)
      }).then(response => {
        if (response.ok) {
          console.log('📊 Activity batch sent successfully');
        } else {
          console.warn('⚠️ Activity batch failed to send');
        }
      }).catch(error => {
        console.warn('⚠️ Activity tracking error (non-blocking):', error);
      });

    } catch (error) {
      console.warn('⚠️ Activity tracking error (non-blocking):', error);
    }
  }

  public destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    this.sendBatch();
    this.isActive = false;
  }
}

// Auto-initialize when imported
export const activityTracker = ActivityTracker.getInstance();
