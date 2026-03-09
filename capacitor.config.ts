import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.benedictionspartagees.app',
  appName: 'Benedictions Partagees',
  webDir: 'dist/public',
  server: {
    url: 'https://benedictionspartagees.org',
    cleartext: false,
    androidScheme: 'https',
  },
};

export default config;
