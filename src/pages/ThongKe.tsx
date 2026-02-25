"use client";

import { useEffect, useMemo, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { User, Book, Crown, Users, TrendingUp } from "lucide-react";
import { api } from "../../apis";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ThongKe() {
  const [loading, setLoading] = useState(true);
  const [topViews, setTopViews] = useState<any[]>([]);
  const [topReaders, setTopReaders] = useState<any[]>([]);
  const [platformViews, setPlatformViews] = useState<any[]>([]);
  const [totalBooks, setTotalBooks] = useState(0);

  const [countUsers, setCountUsers] = useState({
    totalMembershipUsers: 0,
    newYesterday: 0,
    newToday: 0,
    totalNew: 0,
  });

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("en-US").format(num);

  const handleBan = async (email: string) => {
    if (!confirm(`Xác nhận chặn người dùng: ${email}?`)) return;
    try {
      const res = await api.post("/admin/ban-user", { email });
      if (res.status === 200) {
        setTopReaders((prev) =>
          prev.map((u) => (u.email === email ? { ...u, banned: true } : u)),
        );
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Lỗi hệ thống");
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [resBooks, resUsers] = await Promise.all([
          api.get("/books/top-book"),
          api.get("/admin/userRequests?range=24h"),
        ]);
        setCountUsers(resBooks.data.countUsers);
        setTopViews(resBooks.data.topViews || []);
        setTopReaders(resUsers.data.topUsers || []);
        setPlatformViews(resUsers.data.platformStats || []);
        setTotalBooks(resBooks.data.totalBooks);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const summaryCards = useMemo(
    () => [
      {
        label: "Tổng số truyện",
        value: totalBooks,
        icon: <Book />,
        color: "bg-blue-50 text-blue-600",
      },
      {
        label: "Mới hôm nay",
        value: countUsers.newToday,
        icon: <TrendingUp />,
        color: "bg-green-50 text-green-600",
      },
      {
        label: "Mới hôm qua",
        value: countUsers.newYesterday,
        icon: <Users />,
        color: "bg-orange-50 text-orange-600",
      },
      {
        label: "Tổng User mới",
        value: countUsers.totalNew,
        icon: <User />,
        color: "bg-purple-50 text-purple-600",
      },
      {
        label: "Hội viên Premium",
        value: countUsers.totalMembershipUsers,
        icon: <Crown />,
        color: "bg-yellow-50 text-yellow-600",
      },
    ],
    [countUsers, totalBooks],
  );

  const platformChartData = useMemo(() => {
    const cleaned = platformViews
      .filter((i) => i.platform)
      .map((i) => ({
        platform: i.platform.trim(),
        count: Number(i.requestCount),
      }));
    return {
      labels: cleaned.map((i) => i.platform),
      datasets: [
        {
          data: cleaned.map((i) => i.count),
          backgroundColor: [
            "#3b82f6",
            "#10b981",
            "#ef4444",
            "#8b5cf6",
            "#f59e0b",
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [platformViews]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center font-medium">
        Đang tải dữ liệu...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Dashboard Thống Kê
          </h1>
          <p className="text-gray-500 text-sm">
            Cập nhật hoạt động hệ thống theo thời gian thực.
          </p>
        </header>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {summaryCards.map((card, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:scale-[1.02]"
            >
              <div className={`p-3 rounded-xl ${card.color}`}>{card.icon}</div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {card.label}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(card.value)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-8">
          {/* TOP BOOKS TABLE */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                    Hạng
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                    Tên Truyện
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">
                    Lượt View
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topViews.map((book, i) => (
                  <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-400">
                      0{i + 1}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {book.title}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-blue-600">
                      {formatNumber(book.weekViews)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PLATFORM CHART */}
          <div>
            <div className="rounded-2xl mb-5 border border-gray-100 bg-white p-6 shadow-sm h-[380px] flex items-center justify-center">
              <Pie
                data={platformChartData}
                options={{
                  plugins: { legend: { position: "bottom" } },
                  maintainAspectRatio: false,
                }}
              />
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                        Usernam
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                        View
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {topReaders.map((user, i) => (
                      <tr
                        key={i}
                        className="hover:bg-red-50/30 transition-colors group"
                      >
                        <td className="px-6 py-4 font-medium text-gray-700">
                          {user.email}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">
                            {formatNumber(user.requestCount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* TOP READERS */}
      </div>
    </div>
  );
}
