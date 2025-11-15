/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from ".";

export interface TopupItem {
  id: string;
  email: string;
  status: "pending" | "approved" | "rejected";
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
  paymentProofURL?: string;
}

export async function fetchTopups(params?: {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
}): Promise<{
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  requests: TopupItem[];
}> {
  const LIMIT = 20;
  const page = params?.page ? Number(params.page) : 1;
  const skip = (page - 1) * LIMIT;

  // Chỉ lấy param có giá trị
  const cleanParams: any = {};
  if (params?.search) cleanParams.search = params.search;
  if (params?.status) cleanParams.status = params.status;
  if (params?.startDate) cleanParams.startDate = params.startDate;
  if (params?.endDate) cleanParams.endDate = params.endDate;
  cleanParams.page = page;
  cleanParams.limit = LIMIT;
  cleanParams.skip = skip;

  const query = "?" + new URLSearchParams(cleanParams).toString();
  const res = await api.get(`payment-requests${query}`);
  const data = await res.data;

  const requests: TopupItem[] = data.data.map((item: any) => ({
    id: item._id,
    email: item.userEmail,
    status: item.status,
    amount: item.amount,
    method: item.transferType,
    type: item.topUpType === "PREMIUM" ? "Premium" : "Tiên Ngọc",
    planInfo:
      item.topUpType === "PREMIUM"
        ? `Nạp Premium ${item.premiumDay || 1} ngày`
        : `Nạp Tiên Ngọc: ${item.tienNgoc || 0} viên`,
    premiumDays: item.premiumDay || 0,
    gemAmount: item.tienNgoc || 0,
    transferContent: item.content || "",
    createdAt: item.createdAt,
    adminNote: item.adminNote || "",
    userNote: item.userNote || "",
    paymentProofURL: item.paymentProofURL
  }));

  return {
    page: data.page || page,
    limit: LIMIT,
    total: data.total || requests.length,
    totalPages: data.totalPages || 1,
    requests,
  };
}
