import type { Express } from "express";
import { createServer, type Server } from "http";

export function registerRoutes(app: Express): Server {
  // This file handles data and API requests. 
  // The UI code belongs in the client folder, not here.

  const httpServer = createServer(app);
  return httpServer;
}