"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

// TDS Button: variant × size. Fill Primary = #3182f6, Weak Dark = rgba(2,32,71,0.05)
const variantStyles: Record<Variant, string> = {
  primary: "bg-[#3182f6] text-white active:bg-[#2272eb]",
  secondary: "bg-[rgba(2,32,71,0.05)] text-[#4e5968] active:bg-[rgba(2,32,71,0.1)]",
  ghost: "bg-transparent text-[#6b7684] active:bg-[rgba(2,32,71,0.05)]",
  danger: "bg-[rgba(251,136,144,0.15)] text-[#e42939] active:bg-[rgba(251,136,144,0.25)]",
};

// TDS size scale: sm 32px/8px, md 38px/10px, lg 48px/14px, xlarge 56px/16px
const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-[8px]",
  md: "h-[38px] px-5 text-[15px] rounded-[10px]",
  lg: "h-14 px-5 text-[17px] rounded-[16px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", fullWidth, className = "", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center font-semibold
          transition-colors duration-150 select-none
          disabled:opacity-40 disabled:pointer-events-none
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
