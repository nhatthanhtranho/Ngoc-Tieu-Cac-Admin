import { useEffect, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { api } from "../../apis";

interface VariableItem {
  key: string;
  value: string;
}

export default function SettingsVariables() {
  const [variables, setVariables] = useState<VariableItem[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  // ✅ Convert object -> array
  const normalizeToArray = (data: any): VariableItem[] => {
    if (!data || typeof data !== "object") return [];

    return Object.entries(data).map(([key, value]) => ({
      key,
      value: String(value),
    }));
  };

  // ✅ Convert array -> object
  const normalizeToObject = (data: VariableItem[]) => {
    return data.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, string>);
  };

  const fetchConfig = async () => {
    try {
      const res = await api.get("/admin/config");

      const varsObject = res.data?.variables || {};
      const varsArray = normalizeToArray(varsObject);

      setVariables(varsArray);
    } catch (err) {
      console.error("Failed to fetch config", err);
      setVariables([]);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (data: VariableItem[]) => {
    try {
      setVariables(data);

      const objectData = normalizeToObject(data);

      await api.post("/admin/config", {
        variables: objectData,
      });
    } catch (err) {
      console.error("Failed to save config", err);
    }
  };

  const handleAdd = () => {
    if (!newKey.trim()) return;

    if (variables.some((v) => v.key === newKey)) return;

    const updated = [...variables, { key: newKey.trim(), value: newValue }];
    saveConfig(updated);

    setNewKey("");
    setNewValue("");
  };

  const handleDelete = (key: string) => {
    const updated = variables.filter((v) => v.key !== key);
    saveConfig(updated);
  };

  const handleUpdateValue = (key: string, value: string) => {
    const updated = variables.map((v) =>
      v.key === key ? { ...v, value } : v
    );

    saveConfig(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-8">
      <div className="w-full max-w-3xl bg-slate-900/70 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-8">
        <h2 className="text-3xl font-bold text-white mb-8">
          Environment Variables
        </h2>

        <div className="space-y-4">
          {variables.length === 0 && (
            <div className="text-slate-400 text-sm">
              No variables yet.
            </div>
          )}

          {variables.map((item) => (
            <div
              key={item.key}
              className="group flex items-center gap-4 bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-500 transition"
            >
              <div className="w-48 text-slate-300 font-mono text-sm truncate">
                {item.key}
              </div>

              <input
                value={item.value}
                onChange={(e) =>
                  handleUpdateValue(item.key, e.target.value)
                }
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />

              <button
                onClick={() => handleDelete(item.key)}
                className="opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-300"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-slate-700 pt-8">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              placeholder="VARIABLE_NAME"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />

            <input
              placeholder="value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            <Plus size={18} />
            Add Variable
          </button>
        </div>
      </div>
    </div>
  );
}
