/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { api } from ".";
import { BACKEND_URL } from "../src/constant";

export interface TopupItem {
  id: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  amount: number;
  method: string;
  type: "topup" | "membership";
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
  topUpType?:string
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
  if (params?.topUpType) cleanParams.topUpType = params.topUpType;

  if (params?.status) cleanParams.status = params.status;
  
  cleanParams.page = page;
  cleanParams.limit = LIMIT;
  cleanParams.skip = skip;

  const query = "?" + new URLSearchParams(cleanParams).toString();
  const res = await axios.get(`${BACKEND_URL}/payment-requests-list${query}`);
  const data = await res.data;

  const requests: TopupItem[] = data.data.map((item: any) => ({
    id: item._id,
    email: item.userEmail,
    status: item.status,
    amount: item.amount,
    method: item.transferType,
    type: item.type,
    planInfo:
      item.type === "membership"
        ? `Nạp Membership ${item.premiumDays || 1} ngày`
        : `Nạp Tiên Ngọc: ${item.tienNgoc || 0} viên`,
    premiumDays: item.premiumDays || 0,
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
