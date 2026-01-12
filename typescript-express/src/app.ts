import express from "express";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./config/openapi";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import taskRoutes from "./routes/taskRoutes";

export const createApp = () => {
  const app = express();

  app.use(express.json());

  app.use(swaggerUi.serve);
  app.get("/", swaggerUi.setup(openApiSpec, { explorer: true }));

  app.use("/api/tasks", taskRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
