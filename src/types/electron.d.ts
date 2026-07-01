export interface ElectronAPI {
  // App info
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  
  // Window controls
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  
  // Game controls
  onPlayWinAnimation: (callback: () => void) => void;
  onResetAnimation: (callback: () => void) => void;
  onNewGame: (callback: () => void) => void;
  onToggleSettings: (callback: () => void) => void;
  onShowAbout: (callback: () => void) => void;
  
  // Remove listeners
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
