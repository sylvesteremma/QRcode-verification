"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FileCheck2,
  Mail,
  Home,
  Search,
  Clock,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Inbox,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { useTrackComplaint } from "@/lib/api/hooks";
import type { ComplaintJson } from "@/lib/types";
import { complaintBadge, formatDateTime } from "@/lib/utils";
import { appConfig } from "@/lib/config";

const trackFormSchema = z.object({
  reference: z.string().trim().min(3, "Reference is too short").max(64),
  email: z
    .string()
    .trim()
    .email("Please enter the email used when submitting."),
});

type TrackForm = z.infer<typeof trackFormSchema>;

const STATUS_TIMELINE: Record<
  string,
  { label: string; description: string }[]
> = {
  SUBMITTED: [
    { label: "Submitted", description: "We have received your complaint." },
    { label: "Received", description: "Pending team acknowledgement." },
    { label: "Under Review", description: "Waiting for assignment." },
    { label: "In Progress", description: "Investigation not started." },
    { label: "Resolved", description: "Awaiting resolution." },
  ],
  RECEIVED: [
    { label: "Submitted", description: "We have received your complaint." },
    {
      label: "Received",
      description: "Your complaint has been acknowledged by our team.",
    },
    { label: "Under Review", description: "Waiting for investigation start." },
    { label: "In Progress", description: "Pending investigation." },
    { label: "Resolved", description: "Awaiting resolution." },
  ],
  UNDER_REVIEW: [
    { label: "Submitted", description: "We have received your complaint." },
    { label: "Received", description: "Your complaint has been acknowledged." },
    {
      label: "Under Review",
      description: "An investigator is reviewing the details.",
    },
    { label: "In Progress", description: "Deep dive not started yet." },
    { label: "Resolved", description: "Awaiting resolution." },
  ],
  IN_PROGRESS: [
    { label: "Submitted", description: "We have received your complaint." },
    { label: "Received", description: "Your complaint has been acknowledged." },
    { label: "Under Review", description: "Initial review completed." },
    {
      label: "In Progress",
      description: "We are actively investigating your report.",
    },
    { label: "Resolved", description: "Awaiting final resolution." },
  ],
  AWAITING_CUSTOMER: [
    { label: "Submitted", description: "We have received your complaint." },
    { label: "Received", description: "Your complaint has been acknowledged." },
    { label: "Under Review", description: "Initial review completed." },
    {
      label: "In Progress",
      description: "Investigation partially complete — we need your input.",
    },
    { label: "Resolved", description: "Awaiting final resolution." },
  ],
  RESOLVED: [
    { label: "Submitted", description: "We have received your complaint." },
    { label: "Received", description: "Your complaint has been acknowledged." },
    { label: "Under Review", description: "Initial review completed." },
    { label: "In Progress", description: "Investigation finished." },
    {
      label: "Resolved",
      description: "Case closed — see the resolution below.",
    },
  ],
  CLOSED: [
    { label: "Submitted", description: "We have received your complaint." },
    { label: "Received", description: "Your complaint has been acknowledged." },
    { label: "Under Review", description: "Initial review completed." },
    { label: "In Progress", description: "Investigation finished." },
    { label: "Resolved", description: "Case closed." },
  ],
};

const STATUS_ORDER = [
  "SUBMITTED",
  "RECEIVED",
  "UNDER_REVIEW",
  "IN_PROGRESS",
  "AWAITING_CUSTOMER",
  "RESOLVED",
  "CLOSED",
];

function ComplaintTrackPageContent() {
  const search = useSearchParams();
  const prefilledRef = search.get("ref")?.trim()?.toUpperCase() ?? "";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TrackForm>({
    resolver: zodResolver(trackFormSchema),
    defaultValues: { reference: prefilledRef, email: "" },
  });

  React.useEffect(() => {
    if (prefilledRef) setValue("reference", prefilledRef);
  }, [prefilledRef, setValue]);

  const [result, setResult] = React.useState<ComplaintJson | null>(null);
  const track = useTrackComplaint({
    onSuccess: (data) => setResult(data),
  });

  function onSubmit(values: TrackForm) {
    setResult(null);
    track.mutate({
      reference: values.reference.toUpperCase(),
      email: values.email,
    });
  }

  const currentIndex = result ? STATUS_ORDER.indexOf(result.status) : -1;
  const timeline = result
    ? STATUS_TIMELINE[result.status] || STATUS_TIMELINE.SUBMITTED
    : STATUS_TIMELINE.SUBMITTED;

  return (
    <main className="min-h-screen bg-hero-gradient">
      <div className="mx-auto max-w-3xl px-6 py-12 lg:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-primary-700 hover:underline mb-8"
        >
          ← Back to {appConfig.companyName} home
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-brand-gradient flex items-center justify-center text-white shadow-lg">
                <FileCheck2 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>Track a Complaint</CardTitle>
                <CardDescription className="mt-1">
                  Enter your complaint reference number and the email you used
                  when submitting it.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Reference number"
                  placeholder="SEM-123456"
                  error={errors.reference?.message}
                  leftIcon={<Search className="h-4 w-4 text-slate-400" />}
                  {...register("reference")}
                />
                <Input
                  label="Email used when submitting"
                  type="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  leftIcon={<Mail className="h-4 w-4 text-slate-400" />}
                  {...register("email")}
                />
              </div>

              {track.isError && (
                <Alert variant="danger">
                  {track.error?.message ??
                    "No complaint found with those details. Please check and try again."}
                </Alert>
              )}

              <div className="flex flex-wrap justify-between items-center gap-3">
                <Link href="/complaints">
                  <Button variant="ghost" type="button">
                    <MessageSquare className="h-4 w-4" /> File a new complaint
                  </Button>
                </Link>
                <Button type="submit" loading={track.isPending} size="lg">
                  <Search className="h-5 w-5" /> Look up status
                </Button>
              </div>
            </form>

            {result && (
              <div className="space-y-6 border-t border-slate-100 pt-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="mb-2">
                      <Badge
                        variant="neutral"
                        className={complaintBadge(result.status as never)}
                      >
                        {result.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-lg font-semibold text-slate-900">
                      {result.subject}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Reference{" "}
                      <span className="font-mono">{result.reference}</span> ·
                      submitted {formatDateTime(result.submittedAt)}
                    </p>
                  </div>
                </div>

                {result.statusMessage && (
                  <Alert
                    variant={
                      result.status === "RESOLVED" || result.status === "CLOSED"
                        ? "success"
                        : result.status === "AWAITING_CUSTOMER"
                          ? "warning"
                          : "info"
                    }
                  >
                    {result.statusMessage}
                  </Alert>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Status timeline
                  </h3>
                  <ol className="relative border-l border-slate-200 ml-2 space-y-5">
                    {timeline.map((step, i) => {
                      const done = i <= Math.max(0, currentIndex);
                      const icon = done ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Inbox className="h-4 w-4 text-slate-400" />
                      );
                      return (
                        <li key={step.label} className="ml-5">
                          <span className="absolute -left-2 flex h-5 w-5 items-center justify-center rounded-full bg-white border border-slate-200">
                            {icon}
                          </span>
                          <div className="flex items-baseline justify-between flex-wrap gap-2">
                            <p
                              className={`text-sm font-semibold ${done ? "text-slate-900" : "text-slate-400"}`}
                            >
                              {step.label}
                            </p>
                          </div>
                          <p
                            className={`text-sm mt-0.5 ${done ? "text-slate-600" : "text-slate-400"}`}
                          >
                            {step.description}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-slate-500">Category</p>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {String(result.category).replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-slate-500">Last updated</p>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {formatDateTime(result.lastUpdatedAt)}
                    </p>
                  </div>
                  {result.batchNumber && (
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-slate-500">Batch number</p>
                      <p className="font-medium text-slate-800 mt-0.5 font-mono">
                        {result.batchNumber}
                      </p>
                    </div>
                  )}
                  {result.verificationCode && (
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-slate-500">Verification code</p>
                      <p className="font-medium text-slate-800 mt-0.5 font-mono">
                        {result.verificationCode}
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
                    Your message
                  </p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {result.message}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Link href="/complaints">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4" /> Submit another
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="ghost" size="sm">
                      <Home className="h-4 w-4" /> Back home
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function ComplaintTrackPage() {
  return (
    <React.Suspense fallback={null}>
      <ComplaintTrackPageContent />
    </React.Suspense>
  );
}
