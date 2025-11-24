import { useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { BarChart3, Coins, Eye } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const sampleViews = Array.from({ length: 10 }, (_, i) => ({
  name: `Truyện ${i + 1}`,
  views: Math.floor(6000 + Math.random() * 6000),
}));

const sampleCoins = Array.from({ length: 10 }, (_, i) => ({
  name: `Truyện ${String.fromCharCode(65 + i)}`,
  coins: Math.floor(7000 + Math.random() * 7000),
}));

export default function ThongKe() {
  const [filter, setFilter] = useState("today");

  const viewData = {
    labels: sampleViews.map((i) => i.name),
    datasets: [
      {
        label: "Lượt xem",
        data: sampleViews.map((i) => i.views),
        backgroundColor: "rgba(59, 130, 246, 0.7)", // blue-500
        borderColor: "rgba(37, 99, 235, 1)",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const coinData = {
    labels: sampleCoins.map((i) => i.name),
    datasets: [
      {
        label: "Tiêu tiên ngọc",
        data: sampleCoins.map((i) => i.coins),
        backgroundColor: "rgba(236, 72, 153, 0.7)", // pink-500
        borderColor: "rgba(219, 39, 119, 1)",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: "#4b5563" } },
      y: { ticks: { color: "#4b5563" } },
    },
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Filter */}
      <div className="flex justify-end">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-40 p-2 border rounded-xl bg-white shadow-sm hover:shadow-md transition capitalize"
        >
          <option value="today">Hôm nay</option>
          <option value="7days">7 ngày</option>
          <option value="30days">30 ngày</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart lượt view */}
        <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-50 to-white border hover:shadow-lg transition">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="text-blue-600" />
            <h2 className="text-xl font-bold text-blue-700">
              Top 10 truyện có lượt view cao nhất
            </h2>
          </div>
          <Bar data={viewData} options={chartOptions} />
        </div>

        {/* Chart tiêu tiên ngọc */}
        <div className="rounded-2xl p-5 bg-gradient-to-br from-pink-50 to-white border hover:shadow-lg transition">
          <div className="flex items-center gap-2 mb-4">
            <Coins className="text-pink-600" />
            <h2 className="text-xl font-bold text-pink-700">
              Top 10 truyện tiêu tiên ngọc cao nhất
            </h2>
          </div>
          <Bar data={coinData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
