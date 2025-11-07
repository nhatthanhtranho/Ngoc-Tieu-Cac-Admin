'use client';

interface StepIndicatorProps {
  steps: { id: number; label: string }[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      {steps.map((s, idx) => (
        <div key={s.id} className="flex-1 flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition ${currentStep === s.id
              ? "bg-blue-600 border-blue-600 text-white"
              : currentStep > s.id
                ? "bg-green-500 border-green-500 text-white"
                : "border-gray-300 text-gray-500"
            }`}
          >
            {s.id}
          </div>
          <div className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">{s.label}</div>
          {idx < steps.length - 1 && (
            <div className={`flex-1 h-[2px] mx-2 transition-all ${currentStep > s.id ? "bg-green-500" : "bg-gray-300"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
