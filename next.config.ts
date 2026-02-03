// @ts-check

import { NextConfig } from 'next';
import { env } from './src/server/env';

/**
 * @see https://nextjs.org/docs/api-reference/next.config.js/introduction
 */
export default {
  output: 'export',
  /**
   * Dynamic configuration available for the browser and server.
   * Note: requires `ssr: true` or a `getInitialProps` in `_app.tsx`
   * @see https://nextjs.org/docs/api-reference/next.config.js/runtime-configuration
   */
  publicRuntimeConfig: {
    NODE_ENV: env.NODE_ENV,
  },
  /** We run eslint as a separate task in CI */
  eslint: {
    ignoreDuringBuilds: true,
  },
  /** We run typechecking as a separate task in CI */
  typescript: {
    ignoreBuildErrors: true,
  },
  /** Allow wildcard subdomains for site preview */
  experimental: {
    allowedDevOrigins: [
      'http://test.sites.localhost:7777',
      'http://*.sites.localhost:7777',
    ],
  },
} satisfies NextConfig;
