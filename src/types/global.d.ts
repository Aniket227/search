export {};

declare global {
  interface Window {
    AndroidBridge?: {
      getCurrentFlavour(): string;
      openUrl(url: string): void;
      getRemoteConfig(): string;
      getHotWords(): string;
      getRecentApps(): string;
      fireAnalyticEvent(event: string, data?: string): void;
      openNativeScreen(screenName: string, query?: string): void;
    };
  }
}
