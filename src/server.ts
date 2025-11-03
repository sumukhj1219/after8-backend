import cluster from "node:cluster";
import os from "node:os";
import http from "node:http";
import app from "./app.js";
import { ENV } from "./config/env.js";

const PORT = ENV.PORT || 5000;
const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Starting new worker...`);
    cluster.fork();
  });

} else {
  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`Worker ${process.pid} started listening on port ${PORT}`);
  });
}
