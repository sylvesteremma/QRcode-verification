"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, rows = 4, ...props }, ref) => {
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
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            "rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none w-full transition text-sm text-slate-900 placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed resize-y",
            error && "border-red-500 focus:border-red-500 focus:ring-red-100",
            className,
          )}
          {...props}
        />
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

Textarea.displayName = "Textarea";
