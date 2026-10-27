module.exports = {
  apps: [
    {
      name: 'fixmycampus-api',
      script: 'server/src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      restart_delay: 3000,
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'fixmycampus-worker',
      script: 'server/src/workers/notificationWorker.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
