module.exports = {
  apps: [
    {
      name: "biasbreaker-api",
      cwd: __dirname,
      script: "npm",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "700M",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
