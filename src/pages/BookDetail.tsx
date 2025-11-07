import { useNavigate } from "react-router-dom";
import EditBookInfo from "../components/EditBook/EditBookInfo";

export default function EditBookPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-8">
      <button
        onClick={() => navigate("/")}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
      >
        Trở về trang chủ
      </button>
      <EditBookInfo />
    </div>
  );
}
