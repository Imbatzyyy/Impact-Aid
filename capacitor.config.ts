import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Impact Aid',
  webDir: 'www',
  backgroundColor: '#f0f5f2',
  plugins: { SplashScreen: {launchAutoHide:false,showSpinner:false,backgroundColor:'#f0f5f2',launchFadeOutDuration:0} }
};

export default config;
