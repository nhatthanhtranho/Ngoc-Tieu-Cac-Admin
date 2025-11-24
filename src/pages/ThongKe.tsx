"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Coins, Eye } from "lucide-react";
import { api } from "../../apis";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function ThongKe() {
  const [filter, setFilter] = useState("today");

  const [topTienNgoc, setTopTienNgoc] = useState([]);
  const [topViews, setTopViews] = useState([]);

  const viewData = useMemo(() => {
    return {
      labels: topViews.map((i: any) => i?.title),
      datasets: [
        {
          label: "Lượt xem",
          data: topViews.map((i: any) => i.totalViews),
          backgroundColor: "rgba(59, 130, 246, 0.7)",
          borderColor: "rgba(37, 99, 235, 1)",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [topViews]);

  const tienNgocData = useMemo(() => {
    return {
      labels: topTienNgoc.map((i: any) => i.book.title),
      datasets: [
        {
          label: "Tiêu tiên ngọc",
          data: topTienNgoc.map((i: any) => i.totalTienNgoc),
          backgroundColor: "rgba(236, 72, 153, 0.7)",
          borderColor: "rgba(219, 39, 119, 1)",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [topTienNgoc]);

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: "#4b5563" } },
      y: { ticks: { color: "#4b5563" } },
    },
  };

  useEffect(() => {
    async function fetchTopData() {
      const res = await api.get("/books/top-book");
      setTopTienNgoc(res.data.topTienNgoc || []);
      setTopViews(res.data.topViews || []);
    }

    fetchTopData();
  }, []);

  return (
    <div className="container mx-auto p-4 space-y-8 mt-10">
      {/* Page Title */}
      <h1 className="text-3xl font-bold text-gray-800 text-center">
        Thông Tin Hoạt Động
      </h1>

      {/* Filter Button Group */}
      <div className="flex justify-end">
        <div className="inline-flex bg-gray-100 rounded-xl p-1 shadow-sm">
          {[
            { key: "today", label: "Hôm nay" },
            { key: "7days", label: "7 ngày" },
            { key: "30days", label: "30 ngày" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`
                px-4 py-2 rounded-lg font-medium transition
                ${
                  filter === item.key
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-700 hover:bg-white"
                }
              `}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Views Chart */}
        <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-50 to-white border hover:shadow-lg transition">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="text-blue-600" />
            <h2 className="text-xl font-bold text-blue-700">
              Top 10 truyện có lượt view cao nhất
            </h2>
          </div>
          <Bar data={viewData} options={chartOptions} />
        </div>

        {/* Coins Chart */}
        <div className="rounded-2xl p-5 bg-gradient-to-br from-pink-50 to-white border hover:shadow-lg transition">
          <div className="flex items-center gap-2 mb-4">
            <Coins className="text-pink-600" />
            <h2 className="text-xl font-bold text-pink-700">
              Top 10 truyện tiêu tiên ngọc cao nhất
            </h2>
          </div>
          <Bar data={tienNgocData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
