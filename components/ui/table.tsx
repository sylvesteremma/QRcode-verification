"use client";

import * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./card";
import { Spinner } from "./spinner";

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  className?: string;
  rowKey?: (row: T, index: number) => string | number;
}

type TableProps = React.HTMLAttributes<HTMLTableElement>;

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, ...props }, ref) => (
  <table
    ref={ref}
    className={cn("min-w-full divide-y divide-slate-200", className)}
    {...props}
  />
));
Table.displayName = "Table";

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyText = "No data available",
  className,
  rowKey,
}: DataTableProps<T>) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <thead className="bg-slate-50">
              <tr>
                {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500",
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-4 py-3"
                      >
                        <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Inbox className="h-12 w-12 text-slate-300 mb-3" />
                      <p className="text-sm text-slate-500">{emptyText}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => (
                  <tr
                    key={rowKey ? rowKey(row, rowIndex) : rowIndex}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3 text-sm text-slate-700 whitespace-nowrap",
                          col.className,
                        )}
                      >
                        {col.render
                          ? col.render(row)
                          : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

export { Table };
