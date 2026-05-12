"use client";

import { useEffect, useMemo, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import {
  User,
  Book,
  Crown,
  Users,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import { api } from "../../apis";
import axios from "axios";
import { BACKEND_URL } from "../constant";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ThongKe() {
  const [loading, setLoading] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);

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
          prev.map((u) =>
            u.email === email ? { ...u, banned: true } : u,
          ),
        );
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Lỗi hệ thống");
    }
  };

  const fetchData = async () => {
    try {
      const [resBooks, resUsers] = await Promise.all([
        axios.get(`${BACKEND_URL}/admin/top-book`),
        axios.get(`${BACKEND_URL}/user-stat?range=24h`),
      ]);

      setCountUsers(resBooks.data.countUsers);
      setTopViews(resBooks.data.topViews || []);
      setTopReaders(resUsers.data.topUsers || []);
      setPlatformViews(resUsers.data.platformStats || []);
      setTotalBooks(resBooks.data.totalBooks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResetWeekViews = async () => {
    const confirmReset = confirm(
      "Bạn có chắc muốn reset toàn bộ weekViews?",
    );

    if (!confirmReset) return;

    try {
      setResetLoading(true);

      const res = await axios.post(`${BACKEND_URL}/reset-week-views`);

      if (res.status === 200) {
        alert("Reset weekViews thành công");

        setTopViews((prev) =>
          prev.map((book) => ({
            ...book,
            weekViews: 0,
          })),
        );

        await fetchData();
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Reset thất bại");
    } finally {
      setResetLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center font-medium">
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Dashboard Thống Kê
            </h1>

            <p className="text-sm text-gray-500">
              Cập nhật hoạt động hệ thống theo thời gian thực.
            </p>
          </div>

          <button
            onClick={handleResetWeekViews}
            disabled={resetLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw size={16} className={resetLoading ? "animate-spin" : ""} />

            {resetLoading ? "Đang reset..." : "Reset Week Views"}
          </button>
        </header>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {summaryCards.map((card, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-transform hover:scale-[1.02]"
            >
              <div className={`rounded-xl p-3 ${card.color}`}>
                {card.icon}
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  {card.label}
                </p>

                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(card.value)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
          {/* TOP BOOKS TABLE */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">
                Top truyện tuần
              </h2>
            </div>

            <table className="w-full border-collapse text-left">
              <thead className="border-b border-gray-100 bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">
                    Hạng
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">
                    Tên Truyện
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase text-gray-500">
                    Lượt View
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {topViews.map((book, i) => (
                  <tr
                    key={i}
                    className="transition-colors hover:bg-blue-50/30"
                  >
                    <td className="px-6 py-4 font-mono text-gray-400">
                      {String(i + 1).padStart(2, "0")}
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

          {/* RIGHT SIDE */}
          <div className="space-y-5">
            {/* PLATFORM CHART */}
            <div className="flex h-[380px] items-center justify-center rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <Pie
                data={platformChartData}
                options={{
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                  },
                  maintainAspectRatio: false,
                }}
              />
            </div>

            {/* TOP READERS */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">
                  Top người đọc
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="border-b border-gray-100 bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">
                        Username
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">
                        View
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-bold uppercase text-gray-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-50">
                    {topReaders.map((user, i) => (
                      <tr
                        key={i}
                        className="group transition-colors hover:bg-red-50/30"
                      >
                        <td className="px-6 py-4 font-medium text-gray-700">
                          {user.email}
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">
                            {formatNumber(user.requestCount)}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          {user.banned ? (
                            <span className="rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                              Đã chặn
                            </span>
                          ) : (
                            <button
                              onClick={() => handleBan(user.email)}
                              className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600"
                            >
                              Ban
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}