module.exports = {
  apps: [
    {
      name: 'website-builder',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 7777',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 7777,
      },
    },
  ],
};
