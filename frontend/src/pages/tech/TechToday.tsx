import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

function statusColor(status: string) {
  if (status === "DONE") return "text-green-600";
  if (status === "IN_PROGRESS") return "text-blue-600";
  return "text-slate-500";
}

type TaskItem = {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  request: {
    id: string;
    title: string;
    location?: string | null;
    priority: string;
    status: string;
  };
};

export default function TechToday() {
  const { logout, user } = useAuth();

  // ✅ Un solo listado: aquí pintamos lo que corresponda al tab
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ✅ Tabs
  const [tab, setTab] = useState<"PENDING" | "DONE">("PENDING");

  async function loadPending() {
    try {
      setError(null);
      const data = await api<TaskItem[]>("/tasks/my-pending");
      setTasks(data);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function loadDone() {
    try {
      setError(null);
      const data = await api<TaskItem[]>("/tasks/my-done");
      setTasks(data);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function reloadCurrentTab() {
    if (tab === "PENDING") return loadPending();
    return loadDone();
  }

  async function setStatus(id: string, status: "IN_PROGRESS" | "DONE") {
    await api(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });

    // ✅ recarga lo que se está viendo
    await reloadCurrentTab();
  }

  useEffect(() => {
    reloadCurrentTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Mis tareas</h1>
            <p className="text-xs text-slate-600">{user?.name}</p>
          </div>

          <button className="rounded-lg border px-3 py-1 text-sm" onClick={logout}>
            Salir
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-2">
          <button
            className={`rounded-lg px-3 py-1 text-sm border ${
              tab === "PENDING" ? "bg-black text-white" : ""
            }`}
            onClick={() => setTab("PENDING")}
          >
            Pendientes
          </button>

          <button
            className={`rounded-lg px-3 py-1 text-sm border ${
              tab === "DONE" ? "bg-black text-white" : ""
            }`}
            onClick={() => setTab("DONE")}
          >
            Completadas
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 text-red-700 p-2 text-sm">
            {error}
          </div>
        )}

        {/* List */}
        <div className="mt-4 space-y-3">
          {tasks.map((t) => (
            <div key={t.id} className="rounded-xl bg-white p-4 shadow">
              <div className="text-sm text-slate-600">
                {t.request?.title ?? "Sin solicitud"} •{" "}
                {t.request?.location ?? "Sin ubicación"} •{" "}
                {t.request?.priority ?? "-"}
              </div>

              <div className="font-semibold mt-1">{t.title}</div>

              {t.description && (
                <div className="text-sm text-slate-600 mt-1">{t.description}</div>
              )}

              <div className="flex items-center justify-between mt-3">
                <span className={`text-xs font-semibold ${statusColor(t.status)}`}>
                  {t.status}
                </span>

                {/* ✅ Botones SOLO en Pendientes */}
                {tab === "PENDING" && (
                  <div className="flex gap-2">
                    {t.status === "TODO" && (
                      <button
                        className="rounded-lg border px-3 py-1 text-sm"
                        onClick={() => setStatus(t.id, "IN_PROGRESS")}
                      >
                        Iniciar
                      </button>
                    )}

                    {t.status === "IN_PROGRESS" && (
                      <button
                        className="rounded-lg bg-black text-white px-3 py-1 text-sm"
                        onClick={() => setStatus(t.id, "DONE")}
                      >
                        Finalizar
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Empty state */}
          {tasks.length === 0 && (
            <div className="text-center text-slate-600 mt-10">
              {tab === "PENDING"
                ? "No tienes tareas pendientes ✅"
                : "No tienes tareas completadas aún 👀"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
