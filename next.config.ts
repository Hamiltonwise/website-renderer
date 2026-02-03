import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'knex',
    'pg',
    'better-sqlite3',
    'sqlite3',
    'mysql',
    'mysql2',
    'oracledb',
    'pg-query-stream',
    'tedious',
  ],
  turbopack: {},
};

export default nextConfig;
