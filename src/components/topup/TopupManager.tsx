"use client";
import { useEffect, useState } from "react";
import { fetchTopups, TopupItem } from "../../../apis/payment-requests";
import TopupFilter from "./TopupFilter";
import TopupCard from "./TopUpCard";


interface TopUpManagerProps {
  topUpType: string;
}


export default function TopUpManager({ topUpType }: TopUpManagerProps) {
  const [topups, setTopups] = useState<TopupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "pending" | "approved" | "rejected"
  >("ALL");


  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  const [page, setPage] = useState(1);

  const handleUpdateStatus = (
    id: string,
    newStatus: "pending" | "approved" | "rejected"
  ) => {
    setTopups((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };

  // -----------------------------
  // 🔥 Fetch data từ API (đã tối ưu)
  // -----------------------------
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchTopups({
          search,
          status: statusFilter === "ALL" ? "" : statusFilter.toLowerCase(),
          startDate: dateRange.start,
          endDate: dateRange.end,
          page,
          topUpType
        });

        setTopups(data.requests);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [search, statusFilter, dateRange, page, topUpType]);
  // ❤️ mỗi khi filter đổi → gọi API lại

  return (
    <div className="min-h-screen w-full py-10 bg-white text-gray-800">
      <div className="mx-auto px-4">
        {/* 🧭 Title */}
        <h1 className="text-3xl font-cinzel font-bold mb-4 text-gray-800 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)] tracking-wide">
          Quản lý Giao Dịch
        </h1>

        {/* 🔍 Bộ lọc */}

        <TopupFilter
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />

        {/* 📦 Danh sách giao dịch */}
        {loading ? (
          <div className="text-center text-slate-500 py-12 animate-pulse">
            Đang tải dữ liệu...
          </div>
        ) : topups.length === 0 ? (
          <div className="text-center text-slate-500 italic py-12">
            Không tìm thấy giao dịch nào.
          </div>
        ) : (
          <div className="space-y-4">
            {topups.map((item) => (
              <div
                key={item.id}
                className="
                  bg-[#0d1118] border border-slate-800/70 rounded-xl p-[1px]
                  hover:border-emerald-500/40 transition-all duration-300
                  hover:shadow-[0_0_12px_rgba(16,185,129,0.15)]
                "
              >
                <TopupCard item={item} onStatusChange={handleUpdateStatus} displayXuLy={topUpType === 'membership'}/>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
