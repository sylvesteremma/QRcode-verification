"use client";

import * as React from "react";
import {
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "danger";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
}

const variantClasses: Record<AlertVariant, string> = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  danger: "bg-red-50 border-red-200 text-red-800",
};

const variantIcons: Record<AlertVariant, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  danger: AlertCircle,
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "info", title, children, ...props }, ref) => {
  const Icon = variantIcons[variant];

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "rounded-xl border p-4 flex gap-3",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold text-sm mb-1">{title}</p>
        )}
        {children && (
          <div className="text-sm opacity-90">{children}</div>
        )}
      </div>
    </div>
  );
});

Alert.displayName = "Alert";
