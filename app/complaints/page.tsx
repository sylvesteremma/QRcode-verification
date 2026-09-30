"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MessageSquare,
  FileCheck2,
  Home,
  ShieldCheck,
  Package2,
  Hash,
  QrCode,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { useCreateComplaint } from "@/lib/api/hooks";
import { appConfig } from "@/lib/config";

const complaintFormSchema = z.object({
  fullName: z.string().trim().min(2, "Name is too short").max(120),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  category: z.enum([
    "PRODUCT_QUALITY",
    "SUSPECTED_COUNTERFEIT",
    "PACKAGING",
    "DISTRIBUTION",
    "CUSTOMER_SERVICE",
    "VERIFICATION_PROBLEM",
    "OTHER",
  ], {
    errorMap: () => ({ message: "Please select a complaint category" }),
  }),
  subject: z.string().trim().min(3, "Subject is too short").max(200),
  message: z.string().trim().min(10, "Please provide more details (at least 10 characters)").max(5000),
  productId: z.string().optional().or(z.literal("")),
  batchNumber: z.string().trim().max(80).optional().or(z.literal("")),
  verificationCode: z.string().trim().max(128).optional().or(z.literal("")),
  consentAcknowledged: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the privacy notice to submit." }),
  }),
});

type ComplaintForm = z.infer<typeof complaintFormSchema>;

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "PRODUCT_QUALITY", label: "Product Quality Issue" },
  { value: "SUSPECTED_COUNTERFEIT", label: "Suspected Counterfeit" },
  { value: "PACKAGING", label: "Packaging / Seal Issue" },
  { value: "DISTRIBUTION", label: "Distribution / Retailer" },
  { value: "CUSTOMER_SERVICE", label: "Customer Service" },
  { value: "VERIFICATION_PROBLEM", label: "Verification / QR Code Problem" },
  { value: "OTHER", label: "Other (please specify below)" },
];

export default function ComplaintsPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ComplaintForm>({
    resolver: zodResolver(complaintFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      category: undefined as unknown as ComplaintForm["category"],
      subject: "",
      message: "",
      productId: "",
      batchNumber: "",
      verificationCode: "",
    },
  });

  const [submitted, setSubmitted] = React.useState<{
    reference: string;
    status: string;
  } | null>(null);

  const createComplaint = useCreateComplaint({
    onSuccess: (data) => {
      setSubmitted({ reference: data.reference, status: data.status });
    },
  });

  function onSubmit(values: ComplaintForm) {
    const payload = {
      fullName: values.fullName,
      email: values.email,
      phone: values.phone || undefined,
      category: values.category,
      subject: values.subject,
      message: values.message,
      productId: values.productId || undefined,
      batchNumber: values.batchNumber || undefined,
      verificationCode: values.verificationCode || undefined,
      consentAcknowledged: true,
    };
    createComplaint.mutate(payload);
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-hero-gradient">
        <div className="mx-auto max-w-2xl px-6 py-12 lg:py-16">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-primary-700 hover:underline mb-8">
            <Home className="h-4 w-4" /> Back to {appConfig.companyName} home
          </Link>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Complaint Submitted</CardTitle>
                  <CardDescription className="mt-1">
                    Thank you — we have received your report and will investigate promptly.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <Alert variant="success">
                Your complaint is now <strong>Status: {submitted.status}</strong>. A confirmation has been sent to your email.
              </Alert>

              <div className="rounded-xl border border-slate-100 p-5 bg-slate-50/50 space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    Reference Number
                  </p>
                  <p className="mt-1 font-mono text-lg font-semibold text-slate-900">
                    {submitted.reference}
                  </p>
                </div>
                <p className="text-sm text-slate-600">
                  Please save this reference number. You can use it with your email to track progress at any time.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link href={`/complaints/track?ref=${encodeURIComponent(submitted.reference)}`}>
                  <Button variant="secondary">
                    <FileCheck2 className="h-4 w-4" /> Track this complaint
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="ghost">
                    <Home className="h-4 w-4" /> Return home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-hero-gradient">
      <div className="mx-auto max-w-3xl px-6 py-12 lg:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-primary-700 hover:underline mb-8">
          ← Back to {appConfig.companyName} home
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-brand-gradient flex items-center justify-center text-white shadow-lg">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>File a Complaint</CardTitle>
                <CardDescription className="mt-1">
                  Report tampering, counterfeits, quality problems or any concern. Each case is investigated and responded to by our team.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full name"
                  placeholder="Your full name"
                  error={errors.fullName?.message}
                  {...register("fullName")}
                />
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  {...register("email")}
                />
              </div>

              <Input
                label="Phone (optional)"
                type="tel"
                placeholder="+234 ..."
                error={errors.phone?.message}
                {...register("phone")}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Category"
                  error={errors.category?.message}
                  {...register("category")}
                >
                  <option value="">Select a category…</option>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Subject"
                  placeholder="Short summary of the issue"
                  error={errors.subject?.message}
                  {...register("subject")}
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <ShieldCheck className="h-4 w-4 text-primary-600" /> Product details (helps us investigate faster)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Product ID or SKU (optional)"
                    placeholder="e.g. SMK-750-001"
                    leftIcon={<Package2 className="h-4 w-4 text-slate-400" />}
                    error={errors.productId?.message}
                    {...register("productId")}
                  />
                  <Input
                    label="Batch number (optional)"
                    placeholder="e.g. B-2026-00142"
                    leftIcon={<Hash className="h-4 w-4 text-slate-400" />}
                    error={errors.batchNumber?.message}
                    {...register("batchNumber")}
                  />
                  <Input
                    label="Verification code (optional)"
                    placeholder="Code from QR / label"
                    leftIcon={<QrCode className="h-4 w-4 text-slate-400" />}
                    error={errors.verificationCode?.message}
                    {...register("verificationCode")}
                  />
                </div>
              </div>

              <Textarea
                label="Describe your complaint"
                placeholder="Please tell us what happened, when, where, and any steps you've already taken. Include as much detail as you can — the more we know, the faster we can help."
                rows={6}
                error={errors.message?.message}
                {...register("message")}
              />

              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  {...register("consentAcknowledged")}
                />
                <span>
                  I agree that {appConfig.companyFull} may process my personal information to investigate and respond to this complaint, in accordance with the privacy notice.
                  {errors.consentAcknowledged && (
                    <span className="block mt-1 text-red-600">
                      {errors.consentAcknowledged.message}
                    </span>
                  )}
                </span>
              </label>

              {createComplaint.isError && (
                <Alert variant="danger">
                  {createComplaint.error?.message ?? "We couldn't submit your complaint right now. Please try again in a moment."}
                </Alert>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Link href="/complaints/track">
                  <Button variant="ghost" type="button">
                    <FileCheck2 className="h-4 w-4" /> Track existing complaint
                  </Button>
                </Link>
                <div className="flex items-center gap-3">
                  <Link href="/">
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" loading={createComplaint.isPending} size="lg">
                    <MessageSquare className="h-5 w-5" /> Submit complaint
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
