interface BadgeProps {
  label: string;
  color?: "default" | "gray" | "green" | "orange" | "red";
  className?: string;
}

const colorStyles = {
  default: "bg-mist text-graphite",
  gray: "bg-mist text-slate",
  green: "bg-success/10 text-success",
  orange: "bg-warning/10 text-warning",
  red: "bg-error/10 text-error",
};

export function Badge({ label, color = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${colorStyles[color]} ${className}`}
    >
      {label}
    </span>
  );
}
