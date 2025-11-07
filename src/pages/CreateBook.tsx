import CreateStoryForm from "../components/CreateStoryForm";

export default function CreateBook() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-center px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
     
      </div>

      {/* Card */}
        <CreateStoryForm />

      {/* Footer */}
      <p className="text-sm text-gray-500 dark:text-gray-500 mt-10">
        © {new Date().getFullYear()}{" "}
        <span className="font-semibold text-blue-600">E-reader</span> · Tạo truyện dễ dàng hơn bao giờ hết
      </p>
    </div>
  );
}
