export {};

declare global {
  interface Window {
    AndroidBridge?: {
      search(query: string): Promise<string>;
      getCurrentFlavour(): string;
      openUrl(url: string): void;
      getRemoteConfig(): string;
      getHotWordsToJs(): string;
      getRecentApps(): string;
      fireAnalyticEvent(event: string, data?: string): void;
      openNativeScreen(screenName: string, query?: string): void;
    };
    onNativeEvent?: (eventType: string, data?: { hotwords?: any[] }) => void;
  }
}
