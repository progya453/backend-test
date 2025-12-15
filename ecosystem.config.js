module.exports = {
  apps: [{
    name: "science-rush-api",
    script: "./server.js",
    instances: "max",     // SCALE: Uses all available CPU cores
    exec_mode: "cluster", // MODE: Enables load balancing
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
};