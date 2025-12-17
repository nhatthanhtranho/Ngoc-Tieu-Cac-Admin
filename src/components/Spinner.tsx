// components/SpinnerOverlay.tsx
export default function SpinnerOverlay({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
        <span className="text-white text-sm font-medium">
          Đang xử lý...
        </span>
      </div>
    </div>
  );
}
