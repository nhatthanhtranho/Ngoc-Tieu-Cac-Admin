import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  PlusCircle,
  Search,
  X,
  UserCircle2,
  History,
  Loader2,
  ScrollText,
  Users,
  Globe,
} from "lucide-react";
import { getEndpoint } from "../../apis";

interface User {
  id: string;
  email: string;
  balance: number;
}

interface Transaction {
  id: string;
  userEmail: string;
  type: string;
  amount: number;
  createdAt: string;
}

export default function NapTienNgoc() {
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingAllTx, setLoadingAllTx] = useState(true);
  const [loadingUserTx, setLoadingUserTx] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [search, setSearch] = useState("");

  // Fetch danh sách user
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const res = await axios.get(getEndpoint("users"));
        const data = res.data?.data || [];
        setUsers(
          data.map((u: any) => ({
            id: u._id,
            email: u.email,
            balance: u.tienNgoc || 0,
          }))
        );
      } catch (err) {
        console.error("❌ Fetch users error:", err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // Fetch giao dịch toàn hệ thống
  useEffect(() => {
    const fetchAllTx = async () => {
      try {
        setLoadingAllTx(true);
        const res = await axios.get(getEndpoint("transactions/all"));
        const data = res.data?.transactions || [];
        setTransactions(
          data.map((t: any) => ({
            id: t._id,
            userEmail: t.userId?.email || "Không rõ",
            type: t.type,
            amount: t.amount,
            createdAt: t.createdAt,
          }))
        );
      } catch (err) {
        console.error("❌ Fetch all transactions error:", err);
      } finally {
        setLoadingAllTx(false);
      }
    };
    fetchAllTx();
  }, []);

  // Fetch lịch sử giao dịch của 1 user
  const fetchUserTransactions = async (userId: string) => {
    setLoadingUserTx(true);
    try {
      const res = await axios.get(getEndpoint(`transactions/user/${userId}`));
      const data = res.data?.transactions || [];
      console.log("data user transaction", data);
      setUserTransactions(
        data.map((t: any) => ({
          id: t._id,
          userEmail: t.user?.email || "Không rõ",
          type: t.type,
          amount: t.amount,
          createdAt: t.createdAt,
        }))
      );
    } catch (err) {
      console.error("❌ Fetch user transactions error:", err);
      setUserTransactions([]);
    } finally {
      setLoadingUserTx(false);
    }
  };

  const handleTopup = async () => {
    if (!selectedUser || !amount) return;
    const amt = parseInt(amount);
    if (isNaN(amt) || amt <= 0) return alert("Số tiên ngọc không hợp lệ.");

    try {
      await axios.post(getEndpoint(`transactions`), {
        userId: selectedUser.id,
        type: "BUY_TIEN_NGOC",
        amount: amt,
        topupAmount: amt,
        description: `Nạp Tiên Ngọc thủ công thông qua Admin`,
      });
      alert("✅ Nạp thành công!");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, balance: u.balance + amt } : u
        )
      );
      setAmount("");
      fetchUserTransactions(selectedUser.id);
    } catch (err) {
      console.error("❌ Topup error:", err);
      alert("Lỗi khi nạp tiên ngọc.");
    }
  };

  const filteredUsers = useMemo(
    () =>
      users.filter((u) => u.email.toLowerCase().includes(search.toLowerCase())),
    [users, search]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-50 p-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-emerald-700 flex items-center gap-2">
            <Coins className="w-7 h-7 text-emerald-500" />
            Quản lý Tiên Ngọc
          </h1>
        </div>

        {/* Ô tìm kiếm */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm theo email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none"
          />
        </div>

        {/* Bảng user */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-emerald-100">
          <div className="flex items-center gap-2 bg-emerald-100 p-3 border-b border-emerald-200">
            <Users className="text-emerald-700 w-5 h-5" />
            <h2 className="text-emerald-700 font-semibold">
              Danh sách người dùng
            </h2>
          </div>

          <table className="w-full">
            <thead className="bg-emerald-50 text-emerald-700">
              <tr>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-right px-4 py-3">Tiên Ngọc</th>
                <th className="text-center px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? (
                <tr>
                  <td colSpan={3} className="text-center py-6 text-gray-400">
                    <Loader2 className="inline w-5 h-5 animate-spin mr-2" />
                    Đang tải...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="text-center py-6 text-gray-400 italic"
                  >
                    <UserCircle2 className="inline w-5 h-5 mr-2" />
                    Không có người dùng.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-emerald-100 hover:bg-emerald-50 transition"
                  >
                    <td className="px-4 py-3 font-medium text-emerald-700">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                      {user.balance.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedUser(user);
                          fetchUserTransactions(user.id);
                          setShowModal(true);
                        }}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-sky-400 text-white px-4 py-2 rounded-lg font-medium shadow-md"
                      >
                        <PlusCircle className="w-4 h-4" /> Nạp
                      </motion.button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bảng giao dịch toàn hệ thống */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-amber-100">
          <div className="flex items-center gap-2 bg-amber-100 p-3 border-b border-amber-200">
            <Globe className="text-amber-700 w-5 h-5" />
            <h2 className="text-amber-700 font-semibold">
              Lịch sử giao dịch toàn hệ thống
            </h2>
          </div>
          <table className="w-full">
            <thead className="bg-amber-50 text-amber-700">
              <tr>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-center px-4 py-3">Loại</th>
                <th className="text-right px-4 py-3">Số tiên ngọc</th>
                <th className="text-right px-4 py-3">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {loadingAllTx ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-400">
                    <Loader2 className="inline w-5 h-5 animate-spin mr-2" />
                    Đang tải...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-6 text-gray-400 italic"
                  >
                    <ScrollText className="inline w-5 h-5 mr-2" />
                    Chưa có giao dịch nào.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-t border-amber-100 hover:bg-amber-50 transition"
                  >
                    <td className="px-4 py-3 text-amber-700 font-medium">
                      {tx.userEmail}
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-semibold uppercase text-amber-600">
                      {tx.type.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-700 font-medium">
                      {tx.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-sm">
                      {new Date(tx.createdAt).toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Popup nạp + lịch sử user */}
      <AnimatePresence>
        {showModal && selectedUser && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-2xl relative overflow-y-auto max-h-[90vh]"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-bold mb-4 text-emerald-700 flex items-center gap-2">
                <UserCircle2 className="w-6 h-6 text-emerald-500" />
                {selectedUser.email}
              </h2>

              <div className="mt-2">
                <label className="text-sm text-gray-600 font-medium mb-1 block">
                  Số tiên ngọc muốn nạp
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-emerald-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                  placeholder="Nhập số tiên ngọc..."
                />
                <button
                  onClick={handleTopup}
                  className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-sky-400 text-white font-medium py-2 rounded-lg hover:opacity-90 transition"
                >
                  Xác nhận nạp
                </button>
              </div>

              {/* Lịch sử giao dịch riêng */}
              <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 bg-gray-100 p-3 border-b border-gray-200">
                  <History className="text-gray-600 w-4 h-4" />
                  <h3 className="text-gray-700 font-semibold text-sm">
                    Lịch sử giao dịch của người dùng
                  </h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-center px-3 py-2">Loại</th>
                      <th className="text-right px-3 py-2">Số tiên ngọc</th>
                      <th className="text-right px-3 py-2">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUserTx ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="text-center py-4 text-gray-400"
                        >
                          <Loader2 className="inline w-4 h-4 animate-spin mr-2" />
                          Đang tải...
                        </td>
                      </tr>
                    ) : userTransactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="text-center py-4 text-gray-400 italic"
                        >
                          <ScrollText className="inline w-4 h-4 mr-2" />
                          Chưa có giao dịch nào.
                        </td>
                      </tr>
                    ) : (
                      userTransactions.map((tx) => (
                        <tr
                          key={tx.id}
                          className="border-t border-gray-100 hover:bg-gray-50 transition"
                        >
                          <td className="px-3 py-2 text-center text-gray-700 font-medium">
                            {tx.type.replace(/_/g, " ")}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700 font-semibold">
                            {tx.amount.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-500 text-xs">
                            {new Date(tx.createdAt).toLocaleString("vi-VN")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
