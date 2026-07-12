interface BadgeProps {
  label: string;
  color?: "blue" | "gray" | "green" | "orange" | "red";
  className?: string;
}

const colorStyles = {
  blue: "bg-toss-blue-50 text-toss-blue",
  gray: "bg-gray-100 text-gray-600",
  green: "bg-success/10 text-success",
  orange: "bg-warning/10 text-warning",
  red: "bg-error/10 text-error",
};

export function Badge({ label, color = "blue", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-[12px] font-semibold ${colorStyles[color]} ${className}`}
    >
      {label}
    </span>
  );
}
