import React, { useEffect, useState } from "react";
import { Trash2, Plus, Save, Upload } from "lucide-react";
import { api } from "../../apis";
import { uploadDataToS3 } from "../../apis/s3"; // 🔥 chỉnh lại path đúng của bạn

interface VariableItem {
  key: string;
  value: string;
}

const S3_BUCKET = "your-bucket-name"; // 🔥 thay bucket thật

export default function SettingsVariables() {
  const [variables, setVariables] = useState<VariableItem[]>([]);
  const [originalVariables, setOriginalVariables] = useState<VariableItem[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const normalizeToArray = (data: any): VariableItem[] => {
    if (!data || typeof data !== "object") return [];
    return Object.entries(data).map(([key, value]) => ({
      key,
      value: String(value),
    }));
  };

  const normalizeToObject = (data: VariableItem[]) => {
    return data.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, string>);
  };

  const fetchConfig = async () => {
    try {
      const res = await api.get("/admin/config");
      const vars = normalizeToArray(res.data?.variables || {});
      setVariables(vars);
      setOriginalVariables(vars);
    } catch (err) {
      console.error("Failed to fetch config", err);
      setVariables([]);
      setOriginalVariables([]);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      await api.post("/admin/config", {
        variables: normalizeToObject(variables),
      });
      setOriginalVariables(variables);
    } catch (err) {
      console.error("Failed to save config", err);
    } finally {
      setSaving(false);
    }
  };

  // 🔥 EXPORT TO S3
  const handleExportToS3 = async () => {
    try {
      setExporting(true);

      const jsonData = JSON.stringify(
        normalizeToObject(variables),
        null,
        2
      );

      const result = await uploadDataToS3(
        S3_BUCKET,
        "variables.json",
        jsonData
      );

      console.log("Uploaded:", result.url);
      alert("Exported to S3 successfully!");
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed!");
    } finally {
      setExporting(false);
    }
  };

  const handleAdd = () => {
    if (!newKey.trim()) return;
    if (variables.some((v) => v.key === newKey)) return;

    const updated = [...variables, { key: newKey.trim(), value: newValue }];
    setVariables(updated);

    setNewKey("");
    setNewValue("");
  };

  const handleDelete = (key: string) => {
    const updated = variables.filter((v) => v.key !== key);
    setVariables(updated);
  };

  const handleUpdateValue = (key: string, value: string) => {
    const updated = variables.map((v) =>
      v.key === key ? { ...v, value } : v
    );
    setVariables(updated);
  };

  const isChanged =
    JSON.stringify(variables) !== JSON.stringify(originalVariables);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="w-full max-w-3xl bg-white border border-gray-200 rounded-2xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            Environment Variables
          </h2>

          <div className="flex gap-3">
            {isChanged && (
              <button
                onClick={saveConfig}
                disabled={saving}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg font-medium transition shadow"
              >
                <Save size={18} />
                {saving ? "Saving..." : "Update"}
              </button>
            )}

            <button
              onClick={handleExportToS3}
              disabled={exporting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-medium transition shadow"
            >
              <Upload size={18} />
              {exporting ? "Exporting..." : "Export JSON"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {variables.length === 0 && (
            <div className="text-gray-500 text-sm">
              No variables yet.
            </div>
          )}

          {variables.map((item) => (
            <div
              key={item.key}
              className="group flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition"
            >
              <div className="w-48 text-gray-700 font-mono text-sm truncate">
                {item.key}
              </div>

              <input
                value={item.value}
                onChange={(e) =>
                  handleUpdateValue(item.key, e.target.value)
                }
                className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />

              <button
                onClick={() => handleDelete(item.key)}
                className="opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-600"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-gray-200 pt-8">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              placeholder="VARIABLE_NAME"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />

            <input
              placeholder="value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium transition shadow"
          >
            <Plus size={18} />
            Add Variable
          </button>
        </div>
      </div>
    </div>
  );
}
