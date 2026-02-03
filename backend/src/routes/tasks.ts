import { FastifyInstance } from "fastify";
import { prisma } from "../db";
import { authGuard } from "../plugins/auth";

export async function taskRoutes(app: FastifyInstance) {
  // Admin: crear una tarea dentro de una solicitud y asignarla
  app.post(
    "/requests/:id/tasks",
    { preHandler: [authGuard] },
    async (request, reply) => {
      const user = request.user as any;
      if (user.role !== "ADMIN") {
        return reply.status(403).send({ message: "Only admin can create tasks" });
      }

      const params = request.params as { id: string };
      const body = request.body as {
        title?: string;
        description?: string;
        assignedToId?: string; // id del técnico
        dueDate?: string;      // "2026-01-27" o ISO
      };

      if (!body.title) {
        return reply.status(400).send({ message: "title required" });
      }

      // Verificar que la solicitud existe
      const reqExists = await prisma.request.findUnique({ where: { id: params.id } });
      if (!reqExists) {
        return reply.status(404).send({ message: "Request not found" });
      }

      // Si mandan assignedToId, verificar que sea técnico activo
      if (body.assignedToId) {
        const tech = await prisma.user.findUnique({ where: { id: body.assignedToId } });
        if (!tech || tech.role !== "TECH" || !tech.isActive) {
          return reply.status(400).send({ message: "assignedToId is not a valid tech" });
        }
      }

      const task = await prisma.task.create({
        data: {
          title: body.title,
          description: body.description,
          requestId: params.id,
          assignedToId: body.assignedToId || null,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
        },
      });

      // Si creamos tareas, la solicitud pasa a ASSIGNED
      if (body.assignedToId) {
        await prisma.request.update({
          where: { id: params.id },
          data: { status: "ASSIGNED" },
        });
      }

      return task;
    }
  );

  // Técnico: ver "mi día" (tareas asignadas)
  app.get("/tasks/my-today", { preHandler: [authGuard] }, async (request) => {
    const user = request.user as any;
    if (user.role !== "TECH") return [];

    // Rango de "hoy" en hora local (simple MVP)
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return prisma.task.findMany({
      where: {
        assignedToId: user.sub,
        status: { not: "DONE" },
        OR: [
          { dueDate: { gte: start, lte: end } },
          { dueDate: null }, // opcional: tareas sin fecha
        ],
      },
      include: {
        request: { select: { id: true, title: true, location: true, priority: true, status: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });
  });

app.get("/tasks/my-done", { preHandler: [authGuard] }, async (request) => {
  const user = request.user as any;
  if (user.role !== "TECH") return [];

  return prisma.task.findMany({
    where: {
      assignedToId: user.sub,
      status: "DONE",
    },
    include: {  
      request: {
        select: { id: true, title: true, location: true, priority: true, status: true },
      },
    },
    orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
    take: 30, // últimas 30 completadas
  });
});



  // Técnico: ver mis tareas pendientes (sin filtro de "hoy")
app.get("/tasks/my-pending", { preHandler: [authGuard] }, async (request) => {
  const user = request.user as any;
  if (user.role !== "TECH") return [];

  return prisma.task.findMany({
    where: {
      assignedToId: user.sub,
      status: { in: ["TODO", "IN_PROGRESS"] },
    },
    include: {
      request: {
        select: {
          id: true,
          title: true,
          location: true,
          priority: true,
          status: true,
        },
      },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });
});



  // Técnico: actualizar estado de una tarea
  app.patch("/tasks/:id", { preHandler: [authGuard] }, async (request, reply) => {
    const user = request.user as any;
    const params = request.params as { id: string };
    const body = request.body as { status?: "TODO" | "IN_PROGRESS" | "DONE" };

    if (!body.status) {
      return reply.status(400).send({ message: "status required" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({ where: { id: params.id } });
      if (!task) {
        // Throw to exit transaction; we'll map to 404 below
        throw Object.assign(new Error("Task not found"), { code: "TASK_NOT_FOUND" });
      }

      // Un técnico solo puede cambiar tareas asignadas a él
      if (user.role === "TECH" && task.assignedToId !== user.sub) {
        throw Object.assign(new Error("Not your task"), { code: "NOT_YOUR_TASK" });
      }

      const updated = await tx.task.update({
        where: { id: params.id },
        data: {
          status: body.status,
          completedAt: body.status === "DONE" ? new Date() : null,
        },
      });

      // ✅ If task moved to DONE, check if all tasks in the request are DONE
      if (body.status === "DONE" && task.requestId) {
        const remaining = await tx.task.count({
          where: {
            requestId: task.requestId,
            status: { not: "DONE" },
          },
        });

        if (remaining === 0) {
          await tx.request.update({
            where: { id: task.requestId },
            data: {
              status: "DONE",
            },
          });
        }
      }

      // Optional: if status is reverted from DONE, reopen the request
      if (body.status !== "DONE" && task.requestId) {
        await tx.request.update({
          where: { id: task.requestId },
          data: {
            status: "ASSIGNED",
            completedAt: null,
          },
        });
      }

      return updated;
    });

    return result;
  });
};