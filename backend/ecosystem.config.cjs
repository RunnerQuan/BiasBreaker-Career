module.exports = {
  apps: [
    {
      name: "biasbreaker-api",
      cwd: __dirname,
      script: "node_modules/tsx/dist/cli.mjs",
      args: "index.ts",
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
