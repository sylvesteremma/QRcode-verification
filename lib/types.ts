/* =============================================================================
   Shared TypeScript domain types — mirrors Prisma enums where applicable.
   Keep these aligned with prisma/schema.prisma.
   ============================================================================= */

export {
  AdminRole,
  AdminUserStatus,
  ProductStatus,
  BatchStatus,
  QRCodeStatus,
  VerificationStatus,
  RiskLevel,
  AlertType,
  AlertSeverity,
  AlertStatus,
  ComplaintCategory,
  ComplaintStatus,
  NewsStatus,
  FeedbackStatus,
} from "@prisma/client";

export interface AdminUserJson {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductJson {
  id: string;
  name: string;
  type: string;
  size?: string | null;
  sku: string;
  description?: string | null;
  imageUrl?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchJson {
  id: string;
  number: string;
  productId: string;
  productName?: string;
  productionDate: string;
  expiryDate?: string | null;
  quantity: number;
  generatedCodes: number;
  status: string;
  createdAt: string;
}

export interface QRCodeJson {
  id: string;
  code: string;
  productId: string;
  productName?: string;
  batchId?: string | null;
  batchNumber?: string | null;
  status: string;
  scanCount: number;
  firstScannedAt?: string | null;
  lastScannedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export interface ScanEventJson {
  id: string;
  timestamp: string;
  code: string;
  productId: string;
  productName?: string;
  batchId?: string | null;
  batchNumber?: string | null;
  result: string;
  riskLevel?: string | null;
  country?: string | null;
  city?: string | null;
  deviceType?: string | null;
}

export interface AlertJson {
  id: string;
  type: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  productId?: string | null;
  batchId?: string | null;
  codeId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintJson {
  id: string;
  reference: string;
  fullName: string;
  email: string;
  phone?: string | null;
  category: string;
  subject: string;
  message: string;
  productId?: string | null;
  batchNumber?: string | null;
  verificationCode?: string | null;
  status: string;
  statusMessage?: string | null;
  submittedAt: string;
  lastUpdatedAt: string;
}

export interface NewsPostJson {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImageUrl?: string | null;
  status: string;
  authorName?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  feedbackCount?: number;
}

export interface FeedbackJson {
  id: string;
  newsPostId: string;
  newsPostTitle?: string;
  name: string;
  email?: string;
  message: string;
  status: string;
  createdAt: string;
  moderatedAt?: string | null;
}

export interface AuditLogJson {
  id: string;
  userId?: string | null;
  userEmail: string;
  action: string;
  entity: string;
  reference?: string | null;
  summary: string;
  timestamp: string;
}

export interface DashboardMetrics {
  totalProducts: number;
  activeProducts: number;
  totalBatches: number;
  totalQrCodes: number;
  activeQrCodes: number;
  scansToday: number;
  validScans: number;
  suspiciousScans: number;
  invalidScans: number;
  openComplaints: number;
  pendingFeedback: number;
  publishedNews: number;
  activeAlerts: number;
}

export interface VerificationResult {
  status: string;
  verificationId: string;
  code: string;
  product?: {
    id: string;
    name: string;
    type?: string;
    size?: string | null;
    sku?: string;
    imageUrl?: string | null;
  } | null;
  batch?: {
    id: string;
    number: string;
    productionDate?: string;
    expiryDate?: string | null;
  } | null;
  verifiedAt: string;
  scanCount: number;
  firstScannedAt?: string | null;
  message: string;
  riskReason?: string;
  recommendation?: string;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
