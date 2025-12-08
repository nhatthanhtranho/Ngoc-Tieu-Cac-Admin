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
import { Coins, Eye, User, Book, ArrowUp, ArrowDown, Crown } from "lucide-react";
import { api } from "../../apis";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function ThongKe() {
  const [filter, setFilter] = useState("today");
  const [topTienNgoc, setTopTienNgoc] = useState([]);
  const [topViews, setTopViews] = useState([]);
  const [history, setHistory] = useState<any[]>([]);
  const [topReaders, setTopReaders] = useState<any[]>([]);
  const [countUsers, setCountUsers] = useState<{ totalMembershipUsers: number, totalUsers: number }>({ totalMembershipUsers: 0, totalUsers: 0 })

  // Summary data
  const summary = useMemo(() => {
    return [
      { label: "Tiền Ngọc Nạp", value: 1234567, prevValue: 1000000, icon: <Coins className="w-6 h-6 text-gray-800" /> },
      { label: "Tiền Ngọc Tiêu", value: 987654, prevValue: 1200000, icon: <Coins className="w-6 h-6 text-gray-800" /> },
      { label: "Truyện Mới", value: 45, prevValue: 40, icon: <Book className="w-6 h-6 text-gray-800" /> },
      { label: "Người Dùng", value: countUsers.totalUsers, icon: <User className="w-6 h-6 text-gray-800" /> },
      { label: "Người Dùng Premium", value: countUsers.totalMembershipUsers, icon: <Crown className="w-6 h-6 text-gray-800" /> },
    ];

  }, [countUsers])
  // Sample history
  const sampleHistory = [
    { id: "TX001", user: "NguyenVanA", amount: 100, type: "Tiêu", time: "2025-11-24 14:35" },
    { id: "TX002", user: "TranThiB", amount: 500, type: "Nạp", time: "2025-11-24 13:12" },
    { id: "TX003", user: "LeVanC", amount: 200, type: "Tiêu", time: "2025-11-23 18:45" },
    { id: "TX004", user: "PhamThiD", amount: 300, type: "Nạp", time: "2025-11-23 16:22" },
  ];

  const formatNumber = (num: number) => new Intl.NumberFormat("en-US").format(num);

  const viewData = useMemo(
    () => ({
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
    }),
    [topViews]
  );

  const tienNgocData = useMemo(
    () => ({
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
    }),
    [topTienNgoc]
  );

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
      const topReader = await api.get('/admin/userRequests?range=24h')
      setCountUsers(res.data.countUsers)
      setTopTienNgoc(res.data.topTienNgoc || []);
      setTopViews(res.data.topViews || []);
      setHistory(sampleHistory);

      // Fake top readers — Replace with API:
      setTopReaders(topReader.data);
    }
    fetchTopData();
  }, []);

  return (
    <div className="container mx-auto p-4 space-y-8 mt-10">
      <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
        Thống kê hoạt động
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        {summary.map((item, idx) => {


          return (
            <div
              key={idx}
              className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow hover:shadow-md transition"
            >
              {item.icon}
              <span className="mt-2 text-sm text-gray-500">{item.label}</span>
              <span className="mt-1 text-xl font-bold text-gray-900">
                {formatNumber(item.value)}
              </span>

              {/* <span
                className={`mt-1 flex items-center text-sm ${isUp ? "text-green-600" : "text-red-600"
                  }`}
              >
                {isUp ? (
                  <ArrowUp className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDown className="w-4 h-4 mr-1" />
                )}
                {diffPercent}% so với kỳ trước
              </span> */}
            </div>
          );
        })}
      </div>

      {/* Filter Buttons */}
      <div className="flex justify-end mt-4">
        <div className="inline-flex bg-gray-100 rounded-full p-1 text-sm">
          {["today", "7days", "30days"].map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-full font-medium transition text-sm ${filter === key
                ? "bg-black text-white shadow"
                : "bg-white text-gray-700 hover:bg-gray-200"
                }`}
            >
              {key === "today"
                ? "Hôm nay"
                : key === "7days"
                  ? "7 ngày"
                  : "30 ngày"}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mt-6">
        {/* View chart */}
        <div className="rounded-xl p-5 bg-white border hover:shadow-md transition">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="text-gray-800" />
            <h2 className="text-lg font-semibold text-gray-900">
              Top 10 truyện có lượt view cao nhất
            </h2>
          </div>
          <Bar data={viewData} options={chartOptions} />
        </div>

        {/* Tiêu tiên ngọc chart */}
        <div className="rounded-xl p-5 bg-white border hover:shadow-md transition">
          <div className="flex items-center gap-2 mb-4">
            <Coins className="text-gray-800" />
            <h2 className="text-lg font-semibold text-gray-900">
              Top 10 truyện tiêu tiên ngọc cao nhất
            </h2>
          </div>
          <Bar data={tienNgocData} options={chartOptions} />
        </div>
      </div>

      {/* History Table */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Lịch sử sử dụng Tiền Ngọc
        </h2>

        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["ID", "Người dùng", "Số Tiền Ngọc", "Loại", "Thời gian"].map(
                  (h, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {history.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-2 text-sm text-gray-700 font-mono">
                    {row.id}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {row.user}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {formatNumber(row.amount)}
                  </td>
                  <td
                    className={`px-4 py-2 text-sm font-medium ${row.type === "Nạp"
                      ? "text-green-600"
                      : "text-red-600"
                      }`}
                  >
                    {row.type}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {row.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Readers Table */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Top lượt đọc
        </h2>

        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Email", "Lượt đọc", "Premium", "Action"].map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {topReaders.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  {/* Email */}
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {row.email}
                  </td>

                  {/* Reads */}
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {formatNumber(row.requestCount)}
                  </td>

                  {/* Premium Badge */}
                  <td className="px-4 py-2 text-sm">
                    {row.isPremium ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 font-semibold">
                        Premium
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                        Thường
                      </span>
                    )}
                  </td>

                  {/* Ban Button */}
                  <td className="px-4 py-2">
                    <button
                      onClick={() => alert(`Ban ${row.email}`)}
                      className="px-3 py-1 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-95 transition cursor-pointer"
                    >
                      Ban
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
