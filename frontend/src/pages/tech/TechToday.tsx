import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

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
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const data = await api<TaskItem[]>("/tasks/my-today");
      setTasks(data);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function setDone(id: string) {
    await api(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "DONE" }),
    });
    load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mi día</h1>
            <p className="text-slate-600 text-sm">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border px-3 py-2" onClick={load}>
              Recargar
            </button>
            <button
              className="rounded-lg bg-black text-white px-3 py-2"
              onClick={logout}
            >
              Salir
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 text-red-700 p-2 text-sm">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-3">
          {tasks.map((t) => (
            <div key={t.id} className="rounded-xl bg-white p-4 shadow">
              <div className="text-sm text-slate-600">
                {t.request.title} • {t.request.location ?? "Sin ubicación"} •{" "}
                {t.request.priority}
              </div>
              <div className="font-semibold mt-1">{t.title}</div>
              {t.description && (
                <div className="text-sm text-slate-600 mt-1">
                  {t.description}
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <span className="text-xs font-semibold">{t.status}</span>
                <button
                  className="rounded-lg bg-black text-white px-3 py-2 text-sm"
                  onClick={() => setDone(t.id)}
                >
                  Marcar DONE
                </button>
              </div>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="text-center text-slate-600 mt-10">
              No tienes tareas pendientes ✅
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
