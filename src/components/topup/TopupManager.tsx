"use client";

import { useEffect, useState } from "react";
import { fetchTopups, TopupItem } from "../../../apis/payment-requests";
import TopupFilter from "./TopupFilter";
import TopupCard from "./TopUpCard";
import { BACKEND_URL } from "../../constant";
import axios from "axios";
import { toast } from "react-toastify";

interface TopUpManagerProps {
  topUpType: string;
}

export default function TopUpManager({
  topUpType,
}: TopUpManagerProps) {
  const [topups, setTopups] = useState<TopupItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [removingAll, setRemovingAll] =
    useState(false);

  // ✅ toggle auto approve
  const [
    autoApprovePaymentRequest,
    setAutoApprovePaymentRequest,
  ] = useState(false);

  const [toggleLoading, setToggleLoading] =
    useState(false);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<
      "ALL" | "pending" | "approved" | "rejected"
    >("ALL");

  const [dateRange, setDateRange] = useState<{
    start: string;
    end: string;
  }>({
    start: "",
    end: "",
  });

  const [page, setPage] = useState(1);

  const handleUpdateStatus = (
    id: string,
    newStatus:
      | "pending"
      | "approved"
      | "rejected"
      | "auto_approved"
  ) => {
    setTopups((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: newStatus }
          : t
      )
    );
  };

  // ✅ load config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await axios.get(
          `${BACKEND_URL}/config/auto-approve-payment-request`
        );

        console.log(res.data)

        setAutoApprovePaymentRequest(
          res.data.autoApprovePaymentRequest
        );
      } catch (err) {
        console.error(err);
      }
    };

    loadConfig();
  }, []);

  // ✅ toggle config
  const handleToggleAutoApprove = async () => {
    try {
      setToggleLoading(true);

      const nextValue =
        !autoApprovePaymentRequest;

      await axios.post(
        `${BACKEND_URL}/config/auto-approve-payment-request`,
        {
          autoApprovePaymentRequest:
            nextValue,
        }
      );

      setAutoApprovePaymentRequest(nextValue);

      toast.success(
        nextValue
          ? "Đã bật auto approve"
          : "Đã tắt auto approve"
      );
    } catch (err) {
      console.error(err);

      toast.error("Toggle thất bại");
    } finally {
      setToggleLoading(false);
    }
  };

  // 🗑️ Xóa tất cả payment requests
  const handleRemoveAll = async () => {
    const confirmDelete = window.confirm(
      "Bạn có chắc muốn xóa TOÀN BỘ payment requests?"
    );

    if (!confirmDelete) return;

    try {
      setRemovingAll(true);

      await axios.delete(
        `${BACKEND_URL}/remove-payment-requests`
      );

      toast.success(
        "Đã xóa tất cả payment requests!"
      );

      setTopups([]);
    } catch (err: any) {
      console.error(err);

      alert(
        err?.message ||
          "Có lỗi xảy ra khi xóa dữ liệu"
      );
    } finally {
      setRemovingAll(false);
    }
  };

  // -----------------------------
  // 🔥 Fetch data từ API
  // -----------------------------
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const data = await fetchTopups({
          search,
          status:
            statusFilter === "ALL"
              ? ""
              : statusFilter.toLowerCase(),
          startDate: dateRange.start,
          endDate: dateRange.end,
          page,
          topUpType,
        });

        setTopups(data.requests);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [
    search,
    statusFilter,
    dateRange,
    page,
    topUpType,
  ]);

  return (
    <div className="min-h-screen w-full py-10 bg-white text-gray-800">
      <div className="mx-auto px-4">
        {/* 🧭 Title */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1
              className="
                text-3xl font-cinzel font-bold
                text-gray-800
                drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]
                tracking-wide
              "
            >
              Quản lý Giao Dịch
            </h1>

            {/* ✅ Toggle */}
            <button
              onClick={
                handleToggleAutoApprove
              }
              disabled={toggleLoading}
              className={`
                relative inline-flex h-7 w-14
                items-center rounded-full
                transition-all duration-300
                ${
                  autoApprovePaymentRequest
                    ? "bg-emerald-500"
                    : "bg-slate-400"
                }
                disabled:opacity-50
              `}
            >
              <span
                className={`
                  inline-block h-5 w-5
                  transform rounded-full bg-white
                  transition-transform duration-300
                  ${
                    autoApprovePaymentRequest
                      ? "translate-x-8"
                      : "translate-x-1"
                  }
                `}
              />
            </button>

            <span className="text-sm font-medium text-slate-700">
              Auto approve membership
            </span>
          </div>

          {/* 🗑️ Nút xóa tất cả */}
          <button
            onClick={handleRemoveAll}
            disabled={removingAll}
            className="
              px-4 py-2 rounded-lg
              bg-red-600 hover:bg-red-700
              text-white font-semibold
              transition-all duration-200
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            {removingAll
              ? "Đang xóa..."
              : "Xóa tất cả"}
          </button>
        </div>

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
                  bg-[#0d1118]
                  border border-slate-800/70
                  rounded-xl p-[1px]
                  hover:border-emerald-500/40
                  transition-all duration-300
                  hover:shadow-[0_0_12px_rgba(16,185,129,0.15)]
                "
              >
                <TopupCard
                  item={item}
                  onStatusChange={
                    handleUpdateStatus
                  }
                  displayXuLy={
                    topUpType === "membership"
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}