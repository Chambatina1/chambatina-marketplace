import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  output: 'standalone',
};

export default nextConfig;
