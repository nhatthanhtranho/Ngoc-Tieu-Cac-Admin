import { useNavigate } from "react-router-dom";

export default function BackToHomeButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/")}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
    >
      Trở về trang chủ
    </button>
  );
}
