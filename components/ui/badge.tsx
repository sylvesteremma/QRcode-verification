"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-blue-50 text-blue-700 border border-blue-100",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  warning: "bg-amber-50 text-amber-700 border border-amber-100",
  danger: "bg-red-50 text-red-700 border border-red-100",
  neutral: "bg-slate-50 text-slate-700 border border-slate-200",
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "rounded-full px-3 py-1 text-xs font-medium inline-flex items-center gap-1",
          variantClasses[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Badge.displayName = "Badge";
