"use client";

import * as React from "react";
import Link from "next/link";
import {
  Shield,
  LogOut,
  Package2,
  Barcode,
  QrCode,
  ScanLine,
  AlertTriangle,
  MessageSquare,
  Newspaper,
  Users,
  FileText,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import { useSession, useLogout, useDashboardMetrics } from "@/lib/api/hooks";
import type { DashboardMetrics } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { appConfig } from "@/lib/config";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  minRole?: "AUDITOR" | "OPERATIONS" | "ADMIN";
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: BarChart3, minRole: "AUDITOR" },
  {
    label: "Products",
    href: "/admin/products",
    icon: Package2,
    minRole: "AUDITOR",
  },
  {
    label: "Batches",
    href: "/admin/batches",
    icon: Barcode,
    minRole: "AUDITOR",
  },
  { label: "QR Codes", href: "/admin/codes", icon: QrCode, minRole: "AUDITOR" },
  { label: "Scans", href: "/admin/scans", icon: ScanLine, minRole: "AUDITOR" },
  {
    label: "Alerts",
    href: "/admin/alerts",
    icon: AlertTriangle,
    minRole: "AUDITOR",
  },
  {
    label: "Complaints",
    href: "/admin/complaints",
    icon: MessageSquare,
    minRole: "AUDITOR",
  },
  { label: "News", href: "/admin/news", icon: Newspaper, minRole: "AUDITOR" },
  {
    label: "Feedback",
    href: "/admin/feedback",
    icon: MessageSquare,
    minRole: "AUDITOR",
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: FileText,
    minRole: "AUDITOR",
  },
  { label: "Users", href: "/admin/users", icon: Users, minRole: "ADMIN" },
  {
    label: "Audit Log",
    href: "/admin/audit-logs",
    icon: FileText,
    minRole: "AUDITOR",
  },
];

function MetricCard({
  label,
  value,
  Icon,
  tone,
}: {
  label: string;
  value: string | number;
  Icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "success" | "warning" | "danger";
}) {
  const toneClasses: Record<string, string> = {
    primary: "bg-primary-50 text-primary-600",
    success: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-red-50 text-red-600",
  };
  return (
    <Card>
      <CardContent className="p-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">
            {typeof value === "number" ? formatNumber(value) : value}
          </p>
        </div>
        <div
          className={`h-11 w-11 rounded-xl shrink-0 flex items-center justify-center ${toneClasses[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const session = useSession();
  const logout = useLogout();
  const metrics = useDashboardMetrics({
    enabled: session.isSuccess && !!session.data?.user,
  });

  const user = session.data?.user;
  const m: DashboardMetrics | undefined = metrics.data;
  const hierarchy: Record<string, number> = {
    AUDITOR: 1,
    OPERATIONS: 2,
    ADMIN: 3,
  };
  const userRank = user?.role ? hierarchy[user.role] || 0 : 0;
  const canAccess = (item: NavItem) => {
    if (!item.minRole) return true;
    return userRank >= hierarchy[item.minRole];
  };

  if (session.isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Spinner size="lg" />
      </main>
    );
  }

  if (session.isError || !user) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Session required</CardTitle>
            <CardDescription>
              You must be signed in to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="warning" className="mb-4">
              {session.error?.message ?? "Your session may have expired."}
            </Alert>
            <Link href="/admin/login">
              <Button className="w-full" size="lg">
                <Shield className="h-5 w-5" /> Sign in to admin
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-brand-gradient flex items-center justify-center text-white shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {appConfig.companyName} Admin
              </p>
              <p className="text-xs text-slate-500 truncate">
                Operations dashboard · signed in as {user.fullName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="neutral" className="hidden sm:inline-flex">
              Role: {user.role}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout.mutate()}
              loading={logout.isPending}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        <section>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of verification activity, complaints and content across the
            platform.
          </p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={`sk-${i}`}>
                <CardContent className="p-5">
                  <div className="h-4 w-24 bg-slate-100 rounded animate-pulse mb-3" />
                  <div className="h-8 w-20 bg-slate-100 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <MetricCard
                label="Products"
                value={m?.totalProducts ?? 0}
                Icon={Package2}
                tone="primary"
              />
              <MetricCard
                label="Active Products"
                value={m?.activeProducts ?? 0}
                Icon={Package2}
                tone="success"
              />
              <MetricCard
                label="Batches"
                value={m?.totalBatches ?? 0}
                Icon={Barcode}
                tone="primary"
              />
              <MetricCard
                label="QR Codes"
                value={m?.totalQrCodes ?? 0}
                Icon={QrCode}
                tone="primary"
              />
              <MetricCard
                label="Active Codes"
                value={m?.activeQrCodes ?? 0}
                Icon={QrCode}
                tone="success"
              />
              <MetricCard
                label="Scans Today"
                value={m?.scansToday ?? 0}
                Icon={ScanLine}
                tone="primary"
              />
              <MetricCard
                label="Valid / Suspicious"
                value={`${m?.validScans ?? 0} / ${m?.suspiciousScans ?? 0}`}
                Icon={BarChart3}
                tone="warning"
              />
              <MetricCard
                label="Open Complaints"
                value={m?.openComplaints ?? 0}
                Icon={MessageSquare}
                tone="danger"
              />
            </>
          )}
        </section>

        {metrics.isError && (
          <Alert variant="danger">
            Couldn&apos;t load dashboard metrics —{" "}
            {metrics.error?.message ?? "please try again in a moment."}
          </Alert>
        )}

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Administration
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {NAV_ITEMS.filter(canAccess).map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Card className="h-full hover:shadow-popover transition">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          {item.label}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          Open {item.label.toLowerCase()} module
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="border-t border-slate-200 pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-slate-500">
            <p>
              Back to the{" "}
              <Link
                href="/"
                className="text-primary-700 hover:underline font-medium"
              >
                public site
              </Link>
              , or{" "}
              <Link
                href="/verify"
                className="text-primary-700 hover:underline font-medium"
              >
                verify a product code
              </Link>
              .
            </p>
            <p className="text-xs text-slate-400">
              SEMEK Admin · Session active
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
