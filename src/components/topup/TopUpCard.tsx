"use client";
import {
  Wallet,
  Clock,
  Mail,
  Quote,
  CreditCard,
  Coins,
  Check,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import TopupNotes from "./TopupNote";
import { TopupItem } from "../../../apis/payment-requests";
import { api } from "../../../apis";

interface Props {
  item: TopupItem;
  onStatusChange: (id: string, status: "approved" | "rejected") => void;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "numeric",
  });
}

export default function TopupCard({ item, onStatusChange }: Props) {
  const [open, setOpen] = useState(false);

  const [notes, setNotes] = useState({
    userNote: item.userNote ?? "",
    adminNote: item.adminNote ?? "",
  });

  useEffect(() => {
    setNotes({
      userNote: item.userNote ?? "",
      adminNote: item.adminNote ?? "",
    });
  }, [item.userNote, item.adminNote]);

  const defaultStatus = {
    label: "Chờ kiểm tra",
    badge: "bg-amber-900/30 text-amber-300 border-amber-700/40",
    icon: "text-amber-300",
  };

  const statusConfig =
    {
      pending: {
        label: "Chờ kiểm tra",
        badge: "bg-amber-900/30 text-amber-300 border-amber-700/40",
        icon: "text-amber-300",
      },
      approved: {
        label: "Thành công",
        badge: "bg-emerald-900/30 text-emerald-300 border-emerald-700/40",
        icon: "text-emerald-300",
      },
      rejected: {
        label: "Thất bại",
        badge: "bg-rose-900/30 text-rose-300 border-rose-700/40",
        icon: "text-rose-300",
      },
    }[item.status || "pending"] || defaultStatus;

  // ----------------------------
  // 🔥 HANDLE APPROVE
  // ----------------------------
  const handleProcess = useCallback(async () => {
    try {
      const res = await api.post("/payment-requests/approve", {
        paymentRequestId: item.id,
      });

      console.log("Approve success:", res.data);

      // ⬅️ báo lên để update UI
      onStatusChange(item.id, "approved");
    } catch (err: any) {
      console.error("Approve error:", err.response?.data || err.message);
      alert("Xử lý thất bại!");
    }
  }, [item.id, onStatusChange]);

  // ----------------------------
  // 🔥 HANDLE REJECT
  // ----------------------------
  const handleMarkFailed = () => {
    onStatusChange(item.id, "rejected");
  };

  return (
    <div
      className={`
        rounded-xl p-4 sm:p-5
        bg-[#0c1513]/80 backdrop-blur-sm
        border border-emerald-800/40
        shadow-[0_0_12px_rgba(16,185,129,0.05)]
        transition duration-300
        hover:shadow-[0_0_20px_rgba(16,185,129,0.12)]
        hover:border-emerald-600/40
      `}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3 text-left">
          <Wallet className={`w-5 h-5 ${statusConfig.icon}`} />
          <div>
            <div className="font-medium text-emerald-50">{item.email}</div>
            <div className="text-xs text-emerald-300/70">
              {item.type} •{" "}
              {item.type === "Premium"
                ? `${item.premiumDays || 0} ngày`
                : `${item.gemAmount || 0} Tiên Ngọc`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-2 py-1 border rounded-md ${statusConfig.badge}`}
          >
            {statusConfig.label}
          </span>
          {open ? (
            <ChevronUp className="w-5 h-5 text-emerald-300/70" />
          ) : (
            <ChevronDown className="w-5 h-5 text-emerald-300/70" />
          )}
        </div>
      </button>

      {open && (
        <div className="mt-4 pt-3 border-t border-emerald-800/30 text-sm text-emerald-100 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-200/90">
              <Clock className="w-4 h-4 text-emerald-400/70" />
              <span className="font-medium">Thời gian tạo:</span>{" "}
              {formatDate(item.createdAt)}
            </div>

            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400/70" />
              <span className="font-medium">Email:</span> {item.email}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Quote className="w-4 h-4 text-emerald-400/70" />
                <span className="font-medium">Nội dung chuyển khoản:</span>
              </div>
              <blockquote className="border-l-4 border-emerald-700/40 bg-emerald-950/40 p-3 rounded-md italic text-emerald-100">
                “{item.transferContent ?? ""}”
              </blockquote>
            </div>

            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400/70" />
              <span className="font-medium">Phương thức:</span>{" "}
              {item.method ?? "-"}
            </div>

            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-400/70" />
              <span className="font-medium">Hình thức nạp:</span> {item.type ?? "-"}
            </div>

            {/* Payment Proof */}
            {(item as any).paymentProofURL && (
              <div className="flex flex-col gap-2">
                <span className="font-medium">Hình xác nhận thanh toán:</span>
                <img
                  src={(item as any).paymentProofURL}
                  alt="Payment Proof"
                  className="max-w-full rounded-lg border border-emerald-700/30"
                />
              </div>
            )}
          </div>

          <TopupNotes
            userNote={notes.userNote}
            adminNote={notes.adminNote}
            onChange={(field, value) =>
              setNotes((prev) => ({ ...prev, [field]: value }))
            }
          />

          <div className="flex items-center gap-3 mt-4">
            {item.status === "pending" && (
              <button
                onClick={handleProcess}
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                <Check className="w-4 h-4" />
                Xử lý giao dịch
              </button>
            )}

            {item.status !== "approved" && (
              <button
                onClick={handleMarkFailed}
                className="flex items-center gap-2 bg-rose-700 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                <XCircle className="w-4 h-4" />
                Đánh dấu thất bại
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
