import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.target = 'electron-renderer';
      
      // Disable Node.js APIs for browser compatibility in Electron renderer
      // These APIs are not available in the renderer process and need to be polyfilled
      config.resolve = config.resolve || {};
      config.resolve.fallback = config.resolve.fallback || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        assert: false,
        buffer: false,
        console: false,
        constants: false,
        crypto: false,
        domain: false,
        events: false,
        fs: false,
        http: false,
        https: false,
        module: false,
        net: false,
        os: false,
        path: false,
        punycode: false,
        process: false,
        querystring: false,
        stream: false,
        string_decoder: false,
        sys: false,
        timers: false,
        tty: false,
        url: false,
        util: false,
        vm: false,
        zlib: false,
      };
    }
    
    // Exclude SQLite native module from webpack bundling
    config.externals = config.externals || [];
    config.externals.push('better-sqlite3');
    
    return config;
  },
};

export default nextConfig;
