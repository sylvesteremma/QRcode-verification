"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Download,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";
import { buildQuery, formatDateTime } from "@/lib/utils";
import type { Paginated } from "@/lib/types";

type AdminRow = Record<string, unknown> & { id: string };
type Role = "AUDITOR" | "OPERATIONS" | "ADMIN";
type FieldKind = "text" | "number" | "date" | "textarea" | "select";

interface FormField {
  name: string;
  label: string;
  kind?: FieldKind;
  required?: boolean;
  options?: string[];
  source?: "products" | "batches";
}

interface ModuleConfig {
  title: string;
  description: string;
  apiPath: string;
  minRole: Role;
  columns: string[];
  searchable?: boolean;
  filterKey?: string;
  filters?: string[];
  createRole?: Role;
  fields?: FormField[];
  updateRole?: Role;
  deleteRole?: Role;
}

const MODULES: Record<string, ModuleConfig> = {
  products: {
    title: "Products",
    description: "Manage products, catalogue details, and publication status.",
    apiPath: "/products",
    minRole: "AUDITOR",
    columns: ["name", "type", "size", "sku", "status"],
    searchable: true,
    filterKey: "status",
    filters: ["ACTIVE", "INACTIVE", "DRAFT"],
    createRole: "OPERATIONS",
    updateRole: "OPERATIONS",
    deleteRole: "ADMIN",
    fields: [
      { name: "name", label: "Product name", required: true },
      { name: "type", label: "Type", required: true },
      { name: "size", label: "Size" },
      { name: "sku", label: "SKU", required: true },
      { name: "description", label: "Description", kind: "textarea" },
      { name: "imageUrl", label: "Image URL" },
      {
        name: "status",
        label: "Status",
        kind: "select",
        options: ["ACTIVE", "INACTIVE", "DRAFT"],
        required: true,
      },
    ],
  },
  batches: {
    title: "Batches",
    description: "Track production batches, quantities, and expiration dates.",
    apiPath: "/batches",
    minRole: "AUDITOR",
    columns: [
      "number",
      "productName",
      "productionDate",
      "expiryDate",
      "quantity",
      "generatedCodes",
      "status",
    ],
    searchable: true,
    filterKey: "status",
    filters: ["ACTIVE", "COMPLETED", "REVOKED"],
    createRole: "OPERATIONS",
    updateRole: "OPERATIONS",
    deleteRole: "ADMIN",
    fields: [
      { name: "number", label: "Batch number", required: true },
      {
        name: "productId",
        label: "Product",
        kind: "select",
        source: "products",
        required: true,
      },
      {
        name: "productionDate",
        label: "Production date",
        kind: "date",
        required: true,
      },
      { name: "expiryDate", label: "Expiry date", kind: "date" },
      { name: "quantity", label: "Quantity", kind: "number", required: true },
      {
        name: "status",
        label: "Status",
        kind: "select",
        options: ["ACTIVE", "COMPLETED", "REVOKED"],
        required: true,
      },
    ],
  },
  codes: {
    title: "QR Codes",
    description:
      "Generate codes for a batch, review scan counts, and revoke codes.",
    apiPath: "/codes",
    minRole: "AUDITOR",
    columns: [
      "code",
      "productName",
      "batchNumber",
      "status",
      "scanCount",
      "expiresAt",
      "createdAt",
    ],
    searchable: true,
    filterKey: "status",
    filters: ["ACTIVE", "REVOKED", "EXPIRED", "USED"],
    createRole: "OPERATIONS",
    fields: [
      {
        name: "batchId",
        label: "Batch",
        kind: "select",
        source: "batches",
        required: true,
      },
      {
        name: "productId",
        label: "Product",
        kind: "select",
        source: "products",
        required: true,
      },
      {
        name: "quantity",
        label: "Number of codes",
        kind: "number",
        required: true,
      },
      { name: "expiresAt", label: "Expiry date", kind: "date" },
    ],
  },
  scans: {
    title: "Scans",
    description: "Review verification events and scan outcomes.",
    apiPath: "/scans",
    minRole: "AUDITOR",
    columns: [
      "code",
      "productName",
      "batchNumber",
      "result",
      "riskLevel",
      "timestamp",
      "city",
      "country",
    ],
    filterKey: "result",
    filters: ["VALID", "SUSPICIOUS", "INVALID", "REVOKED", "EXPIRED"],
  },
  alerts: {
    title: "Alerts",
    description: "Review suspicious activity and update alert status.",
    apiPath: "/alerts",
    minRole: "AUDITOR",
    columns: ["title", "type", "severity", "status", "createdAt"],
    filterKey: "status",
    filters: ["OPEN", "INVESTIGATING", "RESOLVED"],
  },
  complaints: {
    title: "Complaints",
    description: "Review customer reports and update their case status.",
    apiPath: "/admin/complaints",
    minRole: "AUDITOR",
    columns: [
      "reference",
      "subject",
      "fullName",
      "category",
      "status",
      "submittedAt",
    ],
    searchable: true,
    filterKey: "status",
    filters: [
      "SUBMITTED",
      "RECEIVED",
      "UNDER_REVIEW",
      "IN_PROGRESS",
      "AWAITING_CUSTOMER",
      "RESOLVED",
      "CLOSED",
    ],
  },
  news: {
    title: "News",
    description: "Create and maintain public news posts.",
    apiPath: "/news",
    minRole: "AUDITOR",
    columns: [
      "title",
      "slug",
      "status",
      "authorName",
      "publishedAt",
      "updatedAt",
    ],
    searchable: true,
    createRole: "OPERATIONS",
    updateRole: "OPERATIONS",
    deleteRole: "ADMIN",
    fields: [
      { name: "title", label: "Title", required: true },
      { name: "slug", label: "URL slug", required: true },
      { name: "excerpt", label: "Excerpt", kind: "textarea", required: true },
      { name: "content", label: "Content", kind: "textarea", required: true },
      { name: "featuredImageUrl", label: "Featured image URL" },
      { name: "authorName", label: "Author" },
      {
        name: "status",
        label: "Status",
        kind: "select",
        options: ["DRAFT", "PUBLISHED", "ARCHIVED"],
        required: true,
      },
      { name: "publishedAt", label: "Publish date", kind: "date" },
    ],
  },
  feedback: {
    title: "Feedback",
    description: "Moderate comments submitted on public news posts.",
    apiPath: "/admin/feedback",
    minRole: "AUDITOR",
    columns: [
      "name",
      "newsPostTitle",
      "email",
      "message",
      "status",
      "createdAt",
    ],
    filterKey: "status",
    filters: ["PENDING", "APPROVED", "REJECTED"],
    deleteRole: "ADMIN",
  },
  users: {
    title: "Users",
    description: "Create staff accounts and assign an access role.",
    apiPath: "/admin/users",
    minRole: "ADMIN",
    columns: [
      "fullName",
      "email",
      "role",
      "status",
      "lastLoginAt",
      "createdAt",
    ],
    searchable: true,
    createRole: "ADMIN",
    fields: [
      { name: "fullName", label: "Full name", required: true },
      { name: "email", label: "Email", required: true },
      {
        name: "password",
        label: "Temporary password",
        kind: "text",
        required: true,
      },
      {
        name: "role",
        label: "Role",
        kind: "select",
        options: ["ADMIN", "OPERATIONS", "AUDITOR"],
        required: true,
      },
      {
        name: "status",
        label: "Status",
        kind: "select",
        options: ["ACTIVE", "INACTIVE"],
        required: true,
      },
    ],
  },
  "audit-logs": {
    title: "Audit Log",
    description: "Inspect recorded administrative actions.",
    apiPath: "/admin/audit-logs",
    minRole: "AUDITOR",
    columns: [
      "timestamp",
      "userEmail",
      "action",
      "entity",
      "reference",
      "summary",
    ],
    searchable: true,
  },
};

const ROLE_RANK: Record<Role, number> = { AUDITOR: 1, OPERATIONS: 2, ADMIN: 3 };
const LABELS: Record<string, string> = {
  createdAt: "Created",
  updatedAt: "Updated",
  lastLoginAt: "Last login",
  publishedAt: "Published",
  productionDate: "Produced",
  expiryDate: "Expires",
  submittedAt: "Submitted",
  timestamp: "Time",
  generatedCodes: "Codes generated",
  productName: "Product",
  batchNumber: "Batch",
  newsPostTitle: "News post",
  fullName: "Name",
  userEmail: "User",
  riskLevel: "Risk",
};
const SINGULAR_TITLES: Record<string, string> = {
  products: "Product",
  batches: "Batch",
  news: "News post",
  users: "User",
};

function roleAtLeast(role: string | undefined, minimum: Role): boolean {
  return !!role && ROLE_RANK[role as Role] >= ROLE_RANK[minimum];
}

function displayValue(key: string, value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return new Intl.NumberFormat().format(value);
  if (typeof value !== "string") return String(value);
  if (/At$|Date$|timestamp/i.test(key)) return formatDateTime(value);
  if (
    key === "status" ||
    key === "result" ||
    key === "severity" ||
    key === "riskLevel"
  ) {
    const variant = [
      "VALID",
      "ACTIVE",
      "APPROVED",
      "RESOLVED",
      "PUBLISHED",
    ].includes(value)
      ? "success"
      : ["SUSPICIOUS", "PENDING", "IN_PROGRESS", "INVESTIGATING"].includes(
            value,
          )
        ? "warning"
        : ["INVALID", "REVOKED", "EXPIRED", "REJECTED", "CLOSED"].includes(
              value,
            )
          ? "danger"
          : "neutral";
    return <Badge variant={variant}>{value.replaceAll("_", " ")}</Badge>;
  }
  return value;
}

export function AdminWorkspace({ section }: { section: string }) {
  const config = MODULES[section];
  const session = useSession();
  const queryClient = useQueryClient();
  const user = session.data?.user;
  const allowed = config && roleAtLeast(user?.role, config.minRole);
  const [page, setPage] = React.useState(1);
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminRow | null>(null);
  const [formValues, setFormValues] = React.useState<Record<string, string>>(
    {},
  );
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [notice, setNotice] = React.useState("");

  const queryKey = ["admin-workspace", section, page, search, filter] as const;
  const query = useQuery({
    queryKey,
    queryFn: () => {
      const params: Record<string, unknown> = { page, pageSize: 20 };
      if (config?.searchable && search) params.search = search;
      if (config?.filterKey && filter) params[config.filterKey] = filter;
      return apiFetch<Paginated<AdminRow>>(
        `${config?.apiPath}${buildQuery(params)}`,
      );
    },
    enabled: !!allowed && section !== "reports",
  });

  const products = useQuery({
    queryKey: ["admin-workspace-options", "products"],
    queryFn: () =>
      apiFetch<Paginated<AdminRow>>("/products?page=1&pageSize=100"),
    enabled: formOpen && ["batches", "codes"].includes(section) && !!allowed,
  });
  const batches = useQuery({
    queryKey: ["admin-workspace-options", "batches"],
    queryFn: () =>
      apiFetch<Paginated<AdminRow>>("/batches?page=1&pageSize=100"),
    enabled: formOpen && section === "codes" && !!allowed,
  });

  const action = useMutation({
    mutationFn: ({
      path,
      method,
      body,
    }: {
      path: string;
      method: "POST" | "PATCH" | "DELETE";
      body?: unknown;
    }) => apiFetch<unknown>(path, { method, body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin-workspace", section],
      });
      void queryClient.invalidateQueries({
        queryKey: ["dashboard", "metrics"],
      });
      setNotice("Changes saved.");
      setFormOpen(false);
      setEditing(null);
      setSelectedIds([]);
    },
  });

  function openCreate() {
    setEditing(null);
    setFormValues({
      status: section === "news" ? "DRAFT" : "ACTIVE",
      role: "AUDITOR",
      quantity: "1",
      productionDate: new Date().toISOString().slice(0, 10),
    });
    setFormOpen(true);
    setNotice("");
  }

  function openEdit(row: AdminRow) {
    setEditing(row);
    const values: Record<string, string> = {};
    for (const field of config?.fields ?? []) {
      const value = row[field.name];
      values[field.name] =
        value == null
          ? ""
          : String(value).slice(0, field.kind === "date" ? 10 : undefined);
    }
    setFormValues(values);
    setFormOpen(true);
    setNotice("");
  }

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!config) return;
    const body: Record<string, unknown> = { ...formValues };
    for (const key of ["quantity"]) {
      if (key in body && body[key] !== "") body[key] = Number(body[key]);
    }
    if (section === "codes") {
      body.batchId = formValues.batchId;
      const selectedBatch = batches.data?.data.find(
        (item) => item.id === formValues.batchId,
      );
      body.productId = selectedBatch?.productId ?? formValues.productId;
      action.mutate({ path: "/codes/generate", method: "POST", body });
      return;
    }
    const path = editing ? `${config.apiPath}/${editing.id}` : config.apiPath;
    action.mutate({ path, method: editing ? "PATCH" : "POST", body });
  }

  function removeRow(row: AdminRow) {
    if (!config?.deleteRole || !roleAtLeast(user?.role, config.deleteRole))
      return;
    const name = String(
      row.name ?? row.title ?? row.number ?? row.code ?? row.email ?? row.id,
    );
    if (!window.confirm(`Delete ${name}? This action cannot be undone.`))
      return;
    if (section === "feedback") {
      action.mutate({
        path: "/admin/feedback",
        method: "DELETE",
        body: { ids: [row.id] },
      });
    } else {
      action.mutate({ path: `${config.apiPath}/${row.id}`, method: "DELETE" });
    }
  }

  if (!config) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <Alert variant="danger">Admin module not found.</Alert>
          <Link
            className="mt-4 inline-flex text-sm text-primary-700"
            href="/admin"
          >
            Return to dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (session.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoaderCircle className="h-7 w-7 animate-spin text-primary-700" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-xl">
          <Alert variant="warning">
            Your admin session has expired. Sign in again to continue.
          </Alert>
          <Link
            className="mt-4 inline-flex text-sm text-primary-700"
            href="/admin/login"
          >
            Go to admin sign in
          </Link>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-xl">
          <Alert variant="danger">
            Your {user.role} role cannot access this module.
          </Alert>
          <Link
            className="mt-4 inline-flex text-sm text-primary-700"
            href="/admin"
          >
            Return to dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (section === "reports") {
    return (
      <AdminFrame
        title={config.title}
        description={config.description}
        role={user.role}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {(["scans", "complaints", "products"] as const).map((type) => (
            <Card key={type}>
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div>
                  <h2 className="font-semibold capitalize text-slate-900">
                    {type}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Download a CSV export
                  </p>
                </div>
                <a
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                  href={`/api/reports/export?type=${type}`}
                  aria-label={`Download ${type} report`}
                >
                  <Download className="h-4 w-4" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </AdminFrame>
    );
  }

  const rows = query.data?.data ?? [];
  const canCreate =
    !!config.createRole && roleAtLeast(user.role, config.createRole);
  const canEdit =
    !!config.updateRole && roleAtLeast(user.role, config.updateRole);
  const canDelete =
    !!config.deleteRole && roleAtLeast(user.role, config.deleteRole);
  const singularTitle =
    SINGULAR_TITLES[section] ?? config.title.replace(/s$/, "");
  const columns: DataTableColumn<AdminRow>[] = config.columns.map((key) => ({
    key,
    header:
      LABELS[key] ??
      key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (char) => char.toUpperCase()),
    render: (row) => displayValue(key, row[key]),
    className:
      key === "message" || key === "summary"
        ? "max-w-sm whitespace-normal"
        : undefined,
  }));

  if (section === "alerts") {
    columns.unshift({
      key: "select",
      header: (
        <input
          aria-label="Select all alerts on this page"
          type="checkbox"
          checked={
            rows.length > 0 && rows.every((row) => selectedIds.includes(row.id))
          }
          onChange={(event) =>
            setSelectedIds(
              event.target.checked ? rows.map((row) => row.id) : [],
            )
          }
        />
      ),
      render: (row) => (
        <input
          aria-label={`Select alert ${row.id}`}
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={(event) =>
            setSelectedIds((current) =>
              event.target.checked
                ? [...new Set([...current, row.id])]
                : current.filter((id) => id !== row.id),
            )
          }
        />
      ),
    });
  }

  const hasRowActions =
    canEdit ||
    canDelete ||
    (section === "codes" && roleAtLeast(user.role, "OPERATIONS")) ||
    (section === "complaints" && roleAtLeast(user.role, "OPERATIONS")) ||
    (section === "feedback" && roleAtLeast(user.role, "OPERATIONS"));
  if (hasRowActions) {
    columns.push({
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEdit(row)}
              aria-label={`Edit ${String(row.name ?? row.title ?? row.number ?? row.id)}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {section === "codes" &&
            roleAtLeast(user.role, "OPERATIONS") &&
            row.status === "ACTIVE" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  action.mutate({
                    path: `/codes/${row.id}`,
                    method: "PATCH",
                    body: { status: "REVOKED" },
                  })
                }
              >
                Revoke
              </Button>
            )}
          {section === "complaints" && roleAtLeast(user.role, "OPERATIONS") && (
            <Select
              aria-label="Update complaint status"
              className="min-w-36"
              value={String(row.status)}
              onChange={(event) =>
                action.mutate({
                  path: `/admin/complaints/${row.id}`,
                  method: "PATCH",
                  body: { status: event.target.value },
                })
              }
            >
              {(MODULES.complaints.filters ?? []).map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          )}
          {section === "feedback" &&
            roleAtLeast(user.role, "OPERATIONS") &&
            row.status === "PENDING" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    action.mutate({
                      path: "/admin/feedback",
                      method: "POST",
                      body: { ids: [row.id], status: "APPROVED" },
                    })
                  }
                  aria-label="Approve feedback"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    action.mutate({
                      path: "/admin/feedback",
                      method: "POST",
                      body: { ids: [row.id], status: "REJECTED" },
                    })
                  }
                  aria-label="Reject feedback"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          {canDelete && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => removeRow(row)}
              aria-label={`Delete ${String(row.name ?? row.title ?? row.number ?? row.id)}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    });
  }

  return (
    <AdminFrame
      title={config.title}
      description={config.description}
      role={user.role}
    >
      {notice && <Alert variant="success">{notice}</Alert>}
      {action.isError && <Alert variant="danger">{action.error.message}</Alert>}
      {query.isError && (
        <Alert variant="danger">
          {query.error.message}
          <Button
            className="ml-3"
            size="sm"
            variant="outline"
            onClick={() => void query.refetch()}
          >
            Retry
          </Button>
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <form
          className="flex w-full max-w-xl items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchInput.trim());
            setPage(1);
          }}
        >
          {config.searchable && (
            <>
              <Input
                label="Search"
                placeholder={`Search ${config.title.toLowerCase()}...`}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                leftIcon={<Search className="h-4 w-4 text-slate-400" />}
              />
              <Button type="submit" variant="outline" aria-label="Search">
                <Search className="h-4 w-4" />
              </Button>
            </>
          )}
          {config.filters && config.filterKey && (
            <Select
              label="Filter"
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {config.filters.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          )}
        </form>
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {section === "codes"
              ? "Generate codes"
              : section === "users"
                ? "Add user"
                : `Create ${singularTitle}`}
          </Button>
        )}
      </div>

      {section === "alerts" && roleAtLeast(user.role, "OPERATIONS") && (
        <div className="flex flex-wrap items-end gap-2">
          <Select
            label="Set selected alerts to"
            value={formValues.alertStatus ?? "INVESTIGATING"}
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                alertStatus: event.target.value,
              }))
            }
          >
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
          </Select>
          <Button
            variant="outline"
            disabled={!selectedIds.length || action.isPending}
            onClick={() =>
              action.mutate({
                path: "/alerts",
                method: "PATCH",
                body: {
                  ids: selectedIds,
                  status: formValues.alertStatus ?? "INVESTIGATING",
                },
              })
            }
          >
            Update {selectedIds.length} selected
          </Button>
        </div>
      )}

      <div className="space-y-4">
        <DataTable
          columns={columns}
          data={rows}
          loading={query.isLoading}
          rowKey={(row) => row.id}
          emptyText={`No ${config.title.toLowerCase()} found.`}
        />
        {query.data && query.data.totalPages > 1 && (
          <Pagination
            page={query.data.page}
            totalPages={query.data.totalPages}
            onPageChange={setPage}
          />
        )}
        {query.data && (
          <p className="text-xs text-slate-500">{query.data.total} records</p>
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={
          editing
            ? `Edit ${singularTitle}`
            : section === "codes"
              ? "Generate QR codes"
              : `Create ${singularTitle}`
        }
      >
        <form className="space-y-4" onSubmit={submitForm}>
          {(config.fields ?? []).map((field) => {
            const options =
              field.source === "products"
                ? (products.data?.data ?? []).map((product) => ({
                    value: product.id,
                    label: `${String(product.name)} (${String(product.sku)})`,
                  }))
                : field.source === "batches"
                  ? (batches.data?.data ?? []).map((batch) => ({
                      value: batch.id,
                      label: `${String(batch.number)} (${String(batch.productName ?? batch.productId)})`,
                    }))
                  : (field.options ?? []).map((option) => ({
                      value: option,
                      label: option.replaceAll("_", " "),
                    }));
            if (field.kind === "select" || field.source) {
              return (
                <Select
                  key={field.name}
                  label={field.label}
                  required={field.required}
                  value={formValues[field.name] ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFormValues((current) => {
                      const next = { ...current, [field.name]: value };
                      if (section === "codes" && field.name === "batchId") {
                        const batch = batches.data?.data.find(
                          (item) => item.id === value,
                        );
                        if (batch?.productId)
                          next.productId = String(batch.productId);
                      }
                      return next;
                    });
                  }}
                >
                  <option value="">Select {field.label.toLowerCase()}</option>
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              );
            }
            if (field.kind === "textarea")
              return (
                <Textarea
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  required={field.required}
                  value={formValues[field.name] ?? ""}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      [field.name]: event.target.value,
                    }))
                  }
                  rows={4}
                />
              );
            return (
              <Input
                key={field.name}
                label={field.label}
                name={field.name}
                type={
                  field.kind === "number"
                    ? "number"
                    : field.kind === "date"
                      ? "date"
                      : field.name === "email"
                        ? "email"
                        : field.name === "password"
                          ? "password"
                          : "text"
                }
                required={field.required}
                min={field.kind === "number" ? 1 : undefined}
                value={formValues[field.name] ?? ""}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    [field.name]: event.target.value,
                  }))
                }
              />
            );
          })}
          {(products.isError || batches.isError) && (
            <Alert variant="danger">
              Could not load product or batch choices. Close and retry.
            </Alert>
          )}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setFormOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={action.isPending}
              disabled={products.isLoading || batches.isLoading}
            >
              {editing
                ? "Save changes"
                : section === "codes"
                  ? "Generate"
                  : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminFrame>
  );
}

function AdminFrame({
  title,
  description,
  role,
  children,
}: {
  title: string;
  description: string;
  role: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">SEMEK Admin</p>
            <p className="text-xs text-slate-500">Signed in as {role}</p>
          </div>
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Button>
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <section>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </section>
        {children}
      </div>
    </main>
  );
}
