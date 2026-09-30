"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}) => {
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={() => onClose?.()}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-popover flex flex-col",
          className,
        )}
      >
        {(title || onClose) && (
          <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
            {title && (
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="p-5 border-t border-slate-100 shrink-0 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

Modal.displayName = "Modal";
