/* eslint-disable @typescript-eslint/no-explicit-any */

import { getEndpoint } from ".";

export interface TopupItem {
  id: string;
  email: string;
  status: "BANKING" | "SUCCESS" | "FAILED";
  amount: number;
  method: string;
  type: "Premium" | "Tiên Ngọc";
  planInfo: string;
  premiumDays: number;
  gemAmount: number;
  transferContent: string;
  createdAt: string;
  adminNote?: string;
  userNote?: string;
}

/**
 * Gọi API lấy danh sách topup (admin)
 */
export async function fetchTopups(params?: {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<TopupItem[]> {
  const query =
    params && Object.values(params).some((v) => v)
      ? "?" + new URLSearchParams(params as any).toString()
      : "";

  const res = await fetch(getEndpoint(`payment-requests/all${query}`), {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Không thể tải danh sách giao dịch");

  const data = await res.json();

  return data.requests.map((item: any) => {
    const isPremium = item.topUpType === "PREMIUM";

    return {
      id: item._id,
      email: item.userEmail,
      status: item.status,
      amount: item.amount,
      method: item.transferType,
      type: isPremium ? "Premium" : "Tiên Ngọc",
      planInfo: isPremium
        ? `Nạp Premium ${item.premiumDay || 1} ngày`
        : `Nạp Tiên Ngọc: ${item.tienNgoc || 0} viên`,
      premiumDays: item.premiumDay || 0,
      gemAmount: item.tienNgoc || 0,
      transferContent: item.content,
      createdAt: item.createdAt,
      adminNote: item.adminNote || "",
      userNote: item.userNote || "",
    };
  });
}
