"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiFetch } from "./client";
import { buildQuery } from "@/lib/utils";
import type {
  AdminUserJson,
  ProductJson,
  BatchJson,
  QRCodeJson,
  ScanEventJson,
  AlertJson,
  ComplaintJson,
  NewsPostJson,
  FeedbackJson,
  AuditLogJson,
  DashboardMetrics,
  VerificationResult,
  Paginated,
} from "@/lib/types";

interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface SessionResponse {
  user: SessionUser;
}

interface LoginInput {
  email: string;
  password: string;
}

interface VerifyCodeInput {
  code: string;
}

interface CreateComplaintInput {
  fullName: string;
  email: string;
  phone?: string;
  category: string;
  subject: string;
  message: string;
  productId?: string;
  batchNumber?: string;
  verificationCode?: string;
}

interface TrackComplaintInput {
  reference: string;
  email: string;
}

interface CreateContactInput {
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

interface CreateFeedbackInput {
  name: string;
  email?: string;
  message: string;
}

interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  role: string;
  status: string;
}

interface CreateProductInput {
  name: string;
  type: string;
  size?: string;
  sku: string;
  description?: string;
  imageUrl?: string;
  status: string;
}

interface UpdateProductInput {
  name?: string;
  type?: string;
  size?: string;
  sku?: string;
  description?: string;
  imageUrl?: string;
  status?: string;
}

interface CreateBatchInput {
  number: string;
  productId: string;
  productionDate: string;
  expiryDate?: string;
  quantity: number;
  status: string;
}

interface UpdateBatchInput {
  number?: string;
  productId?: string;
  productionDate?: string;
  expiryDate?: string;
  quantity?: number;
  status?: string;
}

interface GenerateCodesInput {
  productId: string;
  batchId: string;
  quantity: number;
  expiresAt?: string;
}

interface GeneratedQRCode {
  code: string;
  qrUrl: string;
}

interface UpdateCodeStatusInput {
  status: string;
}

interface BulkUpdateAlertsInput {
  ids: string[];
  status: string;
}

interface AdminComplaintUpdateInput {
  status: string;
  statusMessage?: string;
}

interface CreateNewsInput {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImageUrl?: string;
  status?: string;
  publishedAt?: string;
}

interface UpdateNewsInput {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  featuredImageUrl?: string;
  status?: string;
  publishedAt?: string;
}

interface ModerateFeedbackInput {
  ids: string[];
  status: string;
}

interface DeleteFeedbackInput {
  ids: string[];
}

interface PaginatedOpts extends Record<string, unknown> {
  page?: number;
  pageSize?: number;
  search?: string;
}

export function useSession(
  options?: Omit<
    UseQueryOptions<
      SessionResponse,
      Error,
      SessionResponse,
      readonly unknown[]
    >,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<SessionResponse>({
    queryKey: ["auth", "me"],
    queryFn: () => apiFetch<SessionResponse>("/auth/me"),
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useLogin(
  options?: UseMutationOptions<
    { user: SessionUser },
    Error,
    LoginInput,
    unknown
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiFetch<{ user: SessionUser }>("/auth/login", {
        method: "POST",
        body: input,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      if (options?.onSuccess)
        options.onSuccess(data, variables, context, {} as any);
    },
    ...options,
  });
}

export function useLogout(
  options?: UseMutationOptions<void, Error, void, unknown>,
) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () =>
      apiFetch<void>("/auth/logout", {
        method: "POST",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      router.push("/");
      if (options?.onSuccess)
        options.onSuccess(data, variables, context, {} as any);
    },
    ...options,
  });
}

export function useVerifyCode(
  options?: UseMutationOptions<
    VerificationResult,
    Error,
    VerifyCodeInput,
    unknown
  >,
) {
  return useMutation({
    mutationFn: (input: VerifyCodeInput) =>
      apiFetch<VerificationResult>("/verify", {
        method: "POST",
        body: input,
      }),
    ...options,
  });
}

export function useCreateComplaint(
  options?: UseMutationOptions<
    ComplaintJson,
    Error,
    CreateComplaintInput,
    unknown
  >,
) {
  return useMutation({
    mutationFn: (input: CreateComplaintInput) =>
      apiFetch<ComplaintJson>("/complaints", {
        method: "POST",
        body: input,
      }),
    ...options,
  });
}

export function useTrackComplaint(
  options?: UseMutationOptions<
    ComplaintJson,
    Error,
    TrackComplaintInput,
    unknown
  >,
) {
  return useMutation({
    mutationFn: (input: TrackComplaintInput) =>
      apiFetch<ComplaintJson>("/complaints/track", {
        method: "POST",
        body: input,
      }),
    ...options,
  });
}

export function useCreateContact(
  options?: UseMutationOptions<
    { success: boolean },
    Error,
    CreateContactInput,
    unknown
  >,
) {
  return useMutation({
    mutationFn: (input: CreateContactInput) =>
      apiFetch<{ success: boolean }>("/contact", {
        method: "POST",
        body: input,
      }),
    ...options,
  });
}

export function useCreateFeedback(
  postId: string,
  options?: UseMutationOptions<
    FeedbackJson,
    Error,
    CreateFeedbackInput,
    unknown
  >,
) {
  return useMutation({
    mutationFn: (input: CreateFeedbackInput) =>
      apiFetch<FeedbackJson>(`/news/${postId}/feedback`, {
        method: "POST",
        body: input,
      }),
    ...options,
  });
}

export function useDashboardMetrics(
  options?: Omit<
    UseQueryOptions<
      DashboardMetrics,
      Error,
      DashboardMetrics,
      readonly unknown[]
    >,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<DashboardMetrics>({
    queryKey: ["dashboard", "metrics"],
    queryFn: () => apiFetch<DashboardMetrics>("/dashboard/metrics"),
    ...options,
  });
}

export function useUsers(
  opts?: PaginatedOpts,
  options?: Omit<
    UseQueryOptions<
      Paginated<AdminUserJson>,
      Error,
      Paginated<AdminUserJson>,
      readonly unknown[]
    >,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<Paginated<AdminUserJson>>({
    queryKey: ["admin", "users", opts],
    queryFn: () =>
      apiFetch<Paginated<AdminUserJson>>(
        `/admin/users${buildQuery(opts || {})}`,
      ),
    ...options,
  });
}

export function useCreateUser(
  options?: UseMutationOptions<
    { user: AdminUserJson },
    Error,
    CreateUserInput,
    unknown
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      apiFetch<{ user: AdminUserJson }>("/admin/users", {
        method: "POST",
        body: input,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      if (options?.onSuccess)
        options.onSuccess(data, variables, context, {} as any);
    },
    ...options,
  });
}

export function useProducts(
  opts?: PaginatedOpts,
  options?: Omit<
    UseQueryOptions<
      Paginated<ProductJson>,
      Error,
      Paginated<ProductJson>,
      readonly unknown[]
    >,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<Paginated<ProductJson>>({
    queryKey: ["products", opts],
    queryFn: () =>
      apiFetch<Paginated<ProductJson>>(`/products${buildQuery(opts || {})}`),
    ...options,
  });
}

export function useCreateProduct(
  options?: UseMutationOptions<
    { product: ProductJson },
    Error,
    CreateProductInput,
    unknown
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductInput) =>
      apiFetch<{ product: ProductJson }>("/products", {
        method: "POST",
        body: input,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      if (options?.onSuccess)
        options.onSuccess(data, variables, context, {} as any);
    },
    ...options,
  });
}

export function useUpdateProduct(
  id: string,
  options?: UseMutationOptions<ProductJson, Error, UpdateProductInput, unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProductInput) =>
      apiFetch<ProductJson>(`/products/${id}`, {
        method: "PATCH",
        body: input,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      if (options?.onSuccess)
        options.onSuccess(data, variables, context, {} as any);
    },
    ...options,
  });
}

export function useDeleteProduct(
  id: string,
  options?: UseMutationOptions<void, Error, void, unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<void>(`/products/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      if (options?.onSuccess)
        options.onSuccess(data, variables, context, {} as any);
    },
    ...options,
  });
}

export function useBatches(
  opts?: PaginatedOpts,
  options?: Omit<
    UseQueryOptions<
      Paginated<BatchJson>,
      Error,
      Paginated<BatchJson>,
      readonly unknown[]
    >,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<Paginated<BatchJson>>({
    queryKey: ["batches", opts],
    queryFn: () =>
      apiFetch<Paginated<BatchJson>>(`/batches${buildQuery(opts || {})}`),
    ...options,
  });
}

export function useCreateBatch(
  options?: UseMutationOptions<
    { batch: BatchJson },
    Error,
    CreateBatchInput,
    unknown
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBatchInput) =>
      apiFetch<{ batch: BatchJson }>("/batches", {
        method: "POST",
        body: input,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      if (options?.onSuccess)
        options.onSuccess(data, variables, context, {} as any);
    },
    ...options,
  });
}

export function useUpdateBatch(
  id: string,
  options?: UseMutationOptions<BatchJson, Error, UpdateBatchInput, unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBatchInput) =>
      apiFetch<BatchJson>(`/batches/${id}`, {
        method: "PATCH",
        body: input,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      if (options?.onSuccess)
        options.onSuccess(data, variables, context, {} as any);
    },
    ...options,
  });
}

export function useDeleteBatch(
  id: string,
  options?: UseMutationOptions<void, Error, void, unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<void>(`/batches/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      if (options?.onSuccess)
        options.onSuccess(data, variables, context, {} as any);
    },
    ...options,
  });
}

export function useCodes(
  opts?: PaginatedOpts & {
    batchId?: string;
    productId?: string;
    status?: string;
  },
  options?: Omit<
    UseQueryOptions<
      Paginated<QRCodeJson>,
      Error,
      Paginated<QRCodeJson>,
      readonly unknown[]
    >,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<Paginated<QRCodeJson>>({
    queryKey: ["codes", opts],
    queryFn: () =>
      apiFetch<Paginated<QRCodeJson>>(`/codes${buildQuery(opts || {})}`),
    ...options,
  });
}

export function useGenerateCodes(
  options?: UseMutationOptions<
    { count: number; codes: GeneratedQRCode[] },
    Error,
    GenerateCodesInput,
    unknown
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GenerateCodesInput) =>
      apiFetch<{ count: number; codes: GeneratedQRCode[] }>("/codes/generate", {
        method: "POST",
        body: input,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["codes"] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      if (options?.onSuccess)
        options.onSuccess(data, variables, context, {} as any);
    },
    ...options,
  });
}

export function useUpdateCodeStatus(
  id: string,
  options?: UseMutationOptions<
    QRCodeJson,
    Error,
    UpdateCodeStatusInput,
    unknown
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCodeStatusInput) =>
      apiFetch<QRCodeJson>(`/codes/${id}`, {
        method: "PATCH",
        body: input,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["codes"] });
      if (options?.onSuccess)
        options.onSuccess(data, variables, context, {} as any);
    },
    ...options,
  });
}

export function useDeleteCode(
  id: string,
  options?: UseMutationOptions<void, Error, void, unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<void>(`/codes/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["codes"] });
      if (options?.onSuccess)
        options.onSuccess(data, variables, context, {} as any);
    },
    ...options,
  });
}

export function useScans(
  opts?: PaginatedOpts & {
    codeId?: string;
    productId?: string;
    result?: string;
  },
  options?: UseQueryOptions<
    Paginated<ScanEventJson>,
    Error,
    Paginated<ScanEventJson>,
    readonly unknown[]
  >,
) {
  return useQuery<Paginated<ScanEventJson>>({
    queryKey: ["scans", opts],
    queryFn: () =>
      apiFetch<Paginated<ScanEventJson>>(`/scans${buildQuery(opts || {})}`),
    ...options,
  });
}

export function useAlerts(
  opts?: PaginatedOpts & { severity?: string; status?: string },
  options?: UseQueryOptions<
    Paginated<AlertJson>,
    Error,
    Paginated<AlertJson>,
    readonly unknown[]
  >,
) {
  return useQuery<Paginated<AlertJson>>({
    queryKey: ["alerts", opts],
    queryFn: () =>
      apiFetch<Paginated<AlertJson>>(`/alerts${buildQuery(opts || {})}`),
    ...options,
  });
}

export function useBulkUpdateAlerts(
  options?: UseMutationOptions<
    { updated: number },
    Error,
    BulkUpdateAlertsInput,
    unknown
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BulkUpdateAlertsInput) =>
      apiFetch<{ updated: number }>("/alerts", {
        method: "PATCH",
        body: input,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      if (options?.onSuccess)
        options.onSuccess(data, variables, context, {} as any);
    },
    ...options,
  });
}

export function useAdminComplaints(
  opts?: PaginatedOpts & { status?: string; category?: string },
  options?: UseQueryOptions<
    Paginated<ComplaintJson>,
    Error,
    Paginated<ComplaintJson>,
    readonly unknown[]
  >,
) {
  return useQuery<Paginated<ComplaintJson>>({
    queryKey: ["admin", "complaints", opts],
    queryFn: () =>
      apiFetch<Paginated<ComplaintJson>>(
        `/admin/complaints${buildQuery(opts || {})}`,
      ),
    ...options,
  });
}

export function useAdminComplaintUpdate(
  id: string,
  options?: UseMutationOptions<
    ComplaintJson,
    Error,
    AdminComplaintUpdateInput,
    unknown
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminComplaintUpdateInput) =>
      apiFetch<ComplaintJson>(`/admin/complaints/${id}`, {
        method: "PATCH",
        body: input,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "complaints"] });
      if (options?.onSuccess)
        options.onSuccess(data, variables, context, {} as any);
    },
    ...options,
  });
}

export function useNews(
  opts?: PaginatedOpts & { status?: string },
  options?: UseQueryOptions<
    Paginated<NewsPostJson>,
    Error,
    Paginated<NewsPostJson>,
    readonly unknown[]
  >,
) {
  return useQuery<Paginated<NewsPostJson>>({
    queryKey: ["news", opts],
    queryFn: () =>
      apiFetch<Paginated<NewsPostJson>>(`/news${buildQuery(opts || {})}`),
    ...options,
  });
}

export function useCreateNews(
  options?: UseMutationOptions<
    { post: NewsPostJson },
    Error,
    CreateNewsInput,
    unknown
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateNewsInput) =>
      apiFetch<{ post: NewsPostJson }>("/news", {
        method: "POST",
        body: input,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
      if (options?.onSuccess)
        options.onSuccess(data, variables, context, {} as any);
    },
    ...options,
  });
}

export function useUpdateNews(
  id: string,
  options?: UseMutationOptions<NewsPostJson, Error, UpdateNewsInput, unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateNewsInput) =>
      apiFetch<NewsPostJson>(`/news/${id}`, {
        method: "PATCH",
        body: input,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
      if (options?.onSuccess)
        options.onSuccess(data, variables, context, {} as any);
    },
    ...options,
  });
}

export function useDeleteNews(
  id: string,
  options?: UseMutationOptions<void, Error, void, unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<void>(`/news/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
      if (options?.onSuccess)
        options.onSuccess(data, variables, context, {} as any);
    },
    ...options,
  });
}

export function useAdminFeedback(
  opts?: PaginatedOpts & { status?: string; newsPostId?: string },
  options?: UseQueryOptions<
    Paginated<FeedbackJson>,
    Error,
    Paginated<FeedbackJson>,
    readonly unknown[]
  >,
) {
  return useQuery<Paginated<FeedbackJson>>({
    queryKey: ["admin", "feedback", opts],
    queryFn: () =>
      apiFetch<Paginated<FeedbackJson>>(
        `/admin/feedback${buildQuery(opts || {})}`,
      ),
    ...options,
  });
}

export function useModerateFeedback(
  options?: UseMutationOptions<
    { updated: number },
    Error,
    ModerateFeedbackInput,
    unknown
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ModerateFeedbackInput) =>
      apiFetch<{ updated: number }>("/admin/feedback", {
        method: "POST",
        body: input,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "feedback"] });
      queryClient.invalidateQueries({ queryKey: ["news"] });
      if (options?.onSuccess)
        options.onSuccess(data, variables, context, {} as any);
    },
    ...options,
  });
}

export function useDeleteFeedback(
  options?: UseMutationOptions<
    { deleted: number },
    Error,
    DeleteFeedbackInput,
    unknown
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteFeedbackInput) =>
      apiFetch<{ deleted: number }>("/admin/feedback", {
        method: "DELETE",
        body: input,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "feedback"] });
      queryClient.invalidateQueries({ queryKey: ["news"] });
      if (options?.onSuccess)
        options.onSuccess(data, variables, context, {} as any);
    },
    ...options,
  });
}

export function useAuditLogs(
  opts?: PaginatedOpts & { userId?: string; entity?: string; action?: string },
  options?: UseQueryOptions<
    Paginated<AuditLogJson>,
    Error,
    Paginated<AuditLogJson>,
    readonly unknown[]
  >,
) {
  return useQuery<Paginated<AuditLogJson>>({
    queryKey: ["admin", "audit-logs", opts],
    queryFn: () =>
      apiFetch<Paginated<AuditLogJson>>(
        `/admin/audit-logs${buildQuery(opts || {})}`,
      ),
    ...options,
  });
}
