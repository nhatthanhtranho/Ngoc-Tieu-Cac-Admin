import { useRouter } from "next/navigation";

export default function BackToHomeButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/")}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
    >
      Trở về trang chủ
    </button>
  );
}
