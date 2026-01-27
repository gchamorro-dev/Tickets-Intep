import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { prisma } from "../db";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (request, reply) => {
    const body = request.body as { email?: string; password?: string };

    if (!body.email || !body.password) {
      return reply.status(400).send({ message: "email and password required" });
    }

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !user.isActive) {
      return reply.status(401).send({ message: "invalid credentials" });
    }

    const ok = await bcrypt.compare(body.password, user.password);
    if (!ok) {
      return reply.status(401).send({ message: "invalid credentials" });
    }

    const token = await reply.jwtSign({
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  });
}
