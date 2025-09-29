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
    }
    
    // Handle SQLite native module
    config.externals = config.externals || [];
    config.externals.push('better-sqlite3');
    
    return config;
  },
};

export default nextConfig;
