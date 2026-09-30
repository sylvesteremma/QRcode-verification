"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  value,
  onValueChange,
  className,
}) => {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex rounded-xl bg-slate-100 p-1 gap-1",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-state={isActive ? "active" : "inactive"}
            disabled={tab.disabled}
            onClick={() => onValueChange(tab.value)}
            className={cn(
              "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
              isActive
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

Tabs.displayName = "Tabs";
