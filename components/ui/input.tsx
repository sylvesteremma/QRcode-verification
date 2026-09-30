"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, leftIcon, rightIcon, ...props }, ref) => {
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
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={cn(
              "rounded-xl border border-slate-200 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none w-full transition text-sm text-slate-900 placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed",
              leftIcon ? "pl-12 pr-4" : "px-4",
              rightIcon ? "pr-12" : "",
              error && "border-red-500 focus:border-red-500 focus:ring-red-100",
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
