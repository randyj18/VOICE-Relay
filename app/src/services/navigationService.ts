/**
 * Navigation Service
 *
 * Manages app navigation state and screen transitions
 * Used by home screen, topics, queues, and settings
 */

export enum AppScreen {
  LOGIN = 'login',
  HOME = 'home',
  VOICE_MODE = 'voice_mode',
  TOPICS = 'topics',
  MESSAGE_QUEUE = 'message_queue',
  MESSAGE_DETAIL = 'message_detail',
  SETTINGS = 'settings',
}

export interface NavigationParams {
  topicName?: string;
  messageId?: string;
  [key: string]: any;
}

export class NavigationService {
  private currentScreen: AppScreen = AppScreen.HOME;
  private params: NavigationParams = {};
  private listeners: Array<(screen: AppScreen, params: NavigationParams) => void> = [];

  /**
   * Navigate to screen with optional parameters
   */
  navigate(screen: AppScreen, params?: NavigationParams): void {
    console.log(`[Navigation] ${this.currentScreen} → ${screen}`, params);
    this.currentScreen = screen;
    this.params = params || {};
    this.notifyListeners();
  }

  /**
   * Get current screen
   */
  getCurrentScreen(): AppScreen {
    return this.currentScreen;
  }

  /**
   * Get navigation parameters
   */
  getParams(): NavigationParams {
    return this.params;
  }

  /**
   * Go back to previous screen (simple stack)
   */
  back(): void {
    // Simplified: track previous screen
    switch (this.currentScreen) {
      case AppScreen.TOPICS:
      case AppScreen.MESSAGE_QUEUE:
      case AppScreen.MESSAGE_DETAIL:
      case AppScreen.SETTINGS:
        this.navigate(AppScreen.HOME);
        break;
      default:
        break;
    }
  }

  /**
   * Listen for navigation changes
   */
  onNavigate(
    callback: (screen: AppScreen, params: NavigationParams) => void
  ): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify all listeners of navigation change
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentScreen, this.params);
      } catch (error) {
        console.error('[Navigation] Listener error:', error);
      }
    });
  }
}

/**
 * Singleton instance
 */
let navigationServiceInstance: NavigationService | null = null;

export function getNavigationService(): NavigationService {
  if (!navigationServiceInstance) {
    navigationServiceInstance = new NavigationService();
  }
  return navigationServiceInstance;
}
