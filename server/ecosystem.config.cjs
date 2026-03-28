module.exports = {
  apps: [
    {
      name: "cashyourphone-api",
      cwd: __dirname,
      script: "server.js",
      env: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production"
      },
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "400M",
      time: true
    }
  ]
};
