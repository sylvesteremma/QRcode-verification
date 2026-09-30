"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-brand-gradient text-white hover:opacity-90",
  secondary: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  outline: "border border-slate-200 hover:bg-slate-50 text-slate-700",
  ghost: "hover:bg-slate-100 text-slate-700",
  danger: "bg-red-600 hover:bg-red-700 text-white",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-4 rounded-lg text-sm",
  md: "h-11 px-5 rounded-xl text-sm",
  lg: "h-12 px-6 rounded-xl text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      disabled,
      loading,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
