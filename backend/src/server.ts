import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";

import { prisma } from "./db";
import { authRoutes } from "./routes/auth";
import { requestRoutes } from "./routes/requests";
import { userRoutes } from "./routes/users";
import { taskRoutes } from "./routes/tasks";





const app = Fastify({ logger: true });

app.register(cors, {
  origin: true, // luego lo cerramos a tu dominio
});

app.register(jwt, {
  secret: process.env.JWT_SECRET || "dev-secret",
});

// Health
app.get("/health", async () => {
  const dbOk = await prisma.user.count(); // prueba real de BD
  return { ok: true, dbOk };
});

app.register(authRoutes);
app.register(requestRoutes);
app.register(userRoutes);
app.register(taskRoutes);

// Arranque
app.listen({ port: 3000, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
