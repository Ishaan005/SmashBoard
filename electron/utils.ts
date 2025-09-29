import { app } from 'electron';

/**
 * Detect whether we're running in the packaged production build or not.
 * Rely on Electron's `app.isPackaged` flag instead of environment variables,
 * since packaged apps typically run with NODE_ENV unset.
 */
export const isDev = !app.isPackaged;

export const getAssetPath = (asset: string): string => {
  const RESOURCES_PATH = isDev
    ? process.cwd()
    : process.resourcesPath;
  
  return isDev
    ? asset
    : `${RESOURCES_PATH}/assets/${asset}`;
};