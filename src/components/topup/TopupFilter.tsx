"use client";
import { Calendar, RotateCcw, Search } from "lucide-react";

interface Props {
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: "ALL" | "BANKING" | "SUCCESS" | "FAILED") => void;
  dateRange: { start: string; end: string };
  setDateRange: (v: { start: string; end: string }) => void;
}

export default function TopupFilter({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  dateRange,
  setDateRange,
}: Props) {
  const handleQuickSelect = (days: number) => {
    const end = new Date();
    const start = new Date();
    if (days === 0) start.setHours(0, 0, 0, 0);
    else start.setDate(end.getDate() - days);
    setDateRange({
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    });
  };

  const resetDateFilter = () => setDateRange({ start: "", end: "" });

  return (
    <div
      className="
        bg-[#070a0f]/90 
        border border-emerald-800/40 
        rounded-2xl p-6 
        shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)] 
        backdrop-blur-md
        space-y-5
        transition
      "
    >
      {/* 🔍 Search */}
      <div className="flex items-center gap-3">
        <Search className="w-5 h-5 text-emerald-400/80" />
        <input
          type="text"
          placeholder="Tìm theo email hoặc nội dung..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            flex-1 px-3 py-2 rounded-lg
            border border-emerald-900/30 bg-[#0b0f16]/90 text-slate-200 text-sm
            placeholder:text-slate-500
            focus:outline-none focus:ring-2 focus:ring-emerald-500/50
            focus:border-emerald-500/40
            transition
          "
        />
      </div>

      {/* ⚙️ Status Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {["ALL", "BANKING", "SUCCESS", "FAILED"].map((s) => {
          const active = statusFilter === s;
          const label =
            s === "ALL"
              ? "Tất cả"
              : s === "BANKING"
              ? "Chờ kiểm tra"
              : s === "SUCCESS"
              ? "Thành công"
              : "Thất bại";

          const color =
            s === "SUCCESS"
              ? "emerald"
              : s === "FAILED"
              ? "rose"
              : s === "BANKING"
              ? "amber"
              : "slate";

          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s as any)}
              className={`
                text-sm px-3 py-1.5 rounded-lg border transition-all duration-200
                backdrop-blur-sm shadow-inner
                ${
                  active
                    ? `bg-${color}-500/20 text-${color}-300 border-${color}-400/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]`
                    : "bg-[#0e141c]/80 text-slate-400 border-slate-700/60 hover:border-emerald-500/30 hover:text-emerald-300/80"
                }
              `}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 🗓 Date Filter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400/70" />
            Lọc theo ngày tạo
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuickSelect(0)}
              className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:shadow-[0_0_6px_rgba(16,185,129,0.3)] transition"
            >
              Hôm nay
            </button>
            <button
              onClick={() => handleQuickSelect(7)}
              className="text-xs px-2 py-1 rounded-md bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 hover:shadow-[0_0_6px_rgba(59,130,246,0.3)] transition"
            >
              7 ngày
            </button>
            <button
              onClick={() => handleQuickSelect(30)}
              className="text-xs px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:shadow-[0_0_6px_rgba(99,102,241,0.3)] transition"
            >
              30 ngày
            </button>
            <button
              onClick={resetDateFilter}
              className="text-xs px-2 py-1 rounded-md flex items-center gap-1
                bg-slate-700/30 text-slate-400 hover:bg-slate-600/50 hover:text-emerald-300 hover:shadow-[0_0_6px_rgba(16,185,129,0.3)] transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, start: e.target.value }))
            }
            className="
              w-full sm:w-1/2 px-3 py-2 rounded-lg text-sm
              border border-emerald-900/30 bg-[#0b1017]/90 text-slate-200
              focus:outline-none focus:ring-2 focus:ring-emerald-500/40
              hover:border-emerald-600/40 transition
            "
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, end: e.target.value }))
            }
            className="
              w-full sm:w-1/2 px-3 py-2 rounded-lg text-sm
              border border-emerald-900/30 bg-[#0b1017]/90 text-slate-200
              focus:outline-none focus:ring-2 focus:ring-emerald-500/40
              hover:border-emerald-600/40 transition
            "
          />
        </div>
      </div>
    </div>
  );
}
