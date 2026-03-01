import { LucideIcon, Check } from "lucide-react";

interface ToggleButtonProps {
  label: string;
  icon: LucideIcon;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  label,
  icon: Icon,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className={`
        relative flex flex-col items-center justify-center gap-1
        w-14 h-14 rounded-xl
        transition-all duration-300 ease-out

        ${
          disabled
            ? "opacity-40 cursor-not-allowed"
            : "cursor-pointer"
        }

        ${
          checked
            ? "bg-emerald-500/10 border border-emerald-500/30 shadow-lg"
            : "bg-white/70 border border-gray-200 hover:bg-white"
        }
      `}
    >
      {/* Icon */}
      <div
        className={`
          ${
            checked
              ? "text-emerald-500"
              : "text-gray-300"
          }
        `}
      >
        <Icon size={20} strokeWidth={2} />
      </div>

      {/* Label */}
      <span
        className={`
          text-xs transition-colors duration-300
          ${checked ? "text-emerald-700" : "text-gray-600"}
        `}
      >
        {label}
      </span>
    </button>
  );
};