export {};
// Extend Navigator interface to include User-Agent Client Hints API
interface NavigatorUAData {
  getHighEntropyValues(hints: string[]): Promise<Record<string, string | string[]>>;
  platform: string;
  brands: Array<{ brand: string; version: string }>;
  mobile: boolean;
}
declare global {
  interface Window {
    AndroidBridge?: {
      search(query: string, maxResults: number): Promise<string>;
      getCurrentFlavour(): string;
      openUrl(url: string): void;
      getRemoteConfig(): string;
      getHotWordsToJs(): string;
      getRecentApps(): string;
      fireAnalyticEvent(event: string, data?: string): void;
      openNativeScreen(screenName: string, query?: string): void;
      onVoiceSearch(): void;
    };
    onNativeEvent?: (eventType: string, data?: { hotwords?: any[] }) => void;
  }

  interface Navigator {
    userAgentData?: NavigatorUAData;
  }
}

export {};