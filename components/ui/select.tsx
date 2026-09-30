"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id || autoId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            "rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none w-full transition text-sm text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed bg-white appearance-none pr-10 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20fill=%22none%22%20viewBox=%220%200%2024%2024%22%20stroke=%22%2364748b%22%3E%3Cpath%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%20stroke-width=%222%22%20d=%22M19%209l-7%207-7-7%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.25rem_1.25rem]",
            error && "border-red-500 focus:border-red-500 focus:ring-red-100",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-red-600"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
