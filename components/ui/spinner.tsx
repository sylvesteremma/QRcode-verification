"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-10 h-10",
};

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "md", ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading"
        className={cn(
          "border-2 border-blue-600 border-t-transparent rounded-full animate-spin",
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Spinner.displayName = "Spinner";
