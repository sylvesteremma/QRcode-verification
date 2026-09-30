"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  QrCode,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  Package2,
  CalendarDays,
  ScanLine,
  MessageSquare,
  Camera,
  CameraOff,
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
import { useVerifyCode } from "@/lib/api/hooks";
import type { VerificationResult } from "@/lib/types";
import { appConfig } from "@/lib/config";
import { extractVerificationCode } from "@/lib/utils";

const verifyFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, "Code is too short")
    .max(128, "Code is too long"),
});

type VerifyForm = z.infer<typeof verifyFormSchema>;

function statusBadge(status: string) {
  switch (status) {
    case "VALID":
      return <Badge variant="success">Verified — Authentic</Badge>;
    case "SUSPICIOUS":
      return <Badge variant="warning">Previously Scanned</Badge>;
    case "REVOKED":
      return <Badge variant="danger">Revoked</Badge>;
    case "EXPIRED":
      return <Badge variant="warning">Expired</Badge>;
    default:
      return <Badge variant="danger">Invalid / Not Found</Badge>;
  }
}

function statusIcon(status: string) {
  const cls = "h-10 w-10";
  switch (status) {
    case "VALID":
      return <ShieldCheck className={`${cls} text-success-600`} />;
    case "SUSPICIOUS":
      return <AlertTriangle className={`${cls} text-warning-500`} />;
    case "REVOKED":
      return <ShieldX className={`${cls} text-danger-600`} />;
    case "EXPIRED":
      return <ShieldAlert className={`${cls} text-warning-500`} />;
    default:
      return <ShieldX className={`${cls} text-danger-600`} />;
  }
}

function VerifyPageContent() {
  const search = useSearchParams();
  const codeFromUrl = search.get("code")?.trim() ?? "";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VerifyForm>({
    resolver: zodResolver(verifyFormSchema),
    defaultValues: { code: codeFromUrl },
  });

  React.useEffect(() => {
    if (codeFromUrl) setValue("code", codeFromUrl);
  }, [codeFromUrl, setValue]);

  const [result, setResult] = React.useState<VerificationResult | null>(null);
  const [cameraActive, setCameraActive] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const autoVerifiedCode = React.useRef("");
  const verify = useVerifyCode({
    onSuccess: (data) => setResult(data),
  });
  const verifyCode = verify.mutate;

  React.useEffect(() => {
    if (!codeFromUrl || autoVerifiedCode.current === codeFromUrl) return;
    autoVerifiedCode.current = codeFromUrl;
    setValue("code", codeFromUrl);
    setResult(null);
    verifyCode({ code: codeFromUrl });
  }, [codeFromUrl, setValue, verifyCode]);

  React.useEffect(() => {
    if (!cameraActive) return;

    const elementId = "verification-qr-reader";
    let scanner: import("html5-qrcode").Html5Qrcode | null = null;
    let cancelled = false;
    setCameraError(null);

    void import("html5-qrcode")
      .then(({ Html5Qrcode }) => {
        if (cancelled) return;
        scanner = new Html5Qrcode(elementId);
        return scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            if (cancelled) return;
            const code = extractVerificationCode(decodedText);
            setValue("code", code, { shouldValidate: true });
            setResult(null);
            setCameraActive(false);
            verifyCode({ code });
          },
          () => undefined,
        );
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("[QR scanner] Camera could not be started:", error);
        setCameraError(
          "Camera access is unavailable. Allow camera permission and use this page over HTTPS, or enter the code manually.",
        );
        setCameraActive(false);
      });

    return () => {
      cancelled = true;
      if (scanner) {
        void scanner
          .stop()
          .then(() => scanner?.clear())
          .catch(() => undefined);
      }
    };
  }, [cameraActive, setValue, verifyCode]);

  function onSubmit(values: VerifyForm) {
    setResult(null);
    verifyCode({ code: values.code });
  }

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
              <div className="h-11 w-11 rounded-xl bg-brand-gradient flex items-center justify-center text-white">
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>Product Verification</CardTitle>
                <CardDescription className="mt-1">
                  Enter the code printed on the product packaging or the one
                  encoded in the QR code.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Verification code"
                placeholder="e.g. SMK-7A9B-3X2Z"
                error={errors.code?.message}
                {...register("code")}
                leftIcon={<ScanLine className="h-5 w-5 text-slate-400" />}
              />
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCameraError(null);
                    setCameraActive((active) => !active);
                  }}
                  disabled={verify.isPending}
                >
                  {cameraActive ? (
                    <CameraOff className="h-4 w-4" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  {cameraActive ? "Stop camera" : "Scan with camera"}
                </Button>
                {cameraActive && (
                  <div
                    id="verification-qr-reader"
                    className="max-w-md overflow-hidden rounded-lg border border-slate-200 bg-black"
                  />
                )}
                {cameraError && <Alert variant="warning">{cameraError}</Alert>}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" loading={verify.isPending} size="lg">
                  Verify now
                </Button>
                {codeFromUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onSubmit({ code: codeFromUrl })}
                    disabled={verify.isPending}
                  >
                    Re-check code from URL
                  </Button>
                )}
              </div>
              {verify.isError && (
                <Alert variant="danger">
                  {verify.error?.message ??
                    "Verification failed. Please try again."}
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card className="mt-8">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {statusIcon(result.status)}
                  <div>
                    <div className="mb-2">{statusBadge(result.status)}</div>
                    <CardTitle>Verification result</CardTitle>
                    <CardDescription className="mt-1">
                      Code:{" "}
                      <span className="font-mono text-slate-800">
                        {result.code}
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert
                variant={
                  result.status === "VALID"
                    ? "success"
                    : result.status === "INVALID" || result.status === "REVOKED"
                      ? "danger"
                      : "warning"
                }
              >
                {result.message}
              </Alert>

              {(result.product || result.batch) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {result.product && (
                    <div className="rounded-xl border border-slate-100 p-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <Package2 className="h-4 w-4" /> Product
                      </div>
                      <p className="font-semibold text-slate-900">
                        {result.product.name}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        {[
                          result.product.type,
                          result.product.size,
                          result.product.sku,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                      {result.product.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={result.product.imageUrl}
                          alt={result.product.name}
                          className="mt-3 w-full max-w-xs rounded-lg border border-slate-100 object-cover"
                        />
                      )}
                    </div>
                  )}
                  {result.batch && (
                    <div className="rounded-xl border border-slate-100 p-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <CalendarDays className="h-4 w-4" /> Batch
                      </div>
                      <p className="font-semibold text-slate-900">
                        Batch #{result.batch.number}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        Produced:{" "}
                        {result.batch.productionDate
                          ? new Date(
                              result.batch.productionDate,
                            ).toLocaleDateString()
                          : "—"}
                      </p>
                      {result.batch.expiryDate && (
                        <p className="text-sm text-slate-500">
                          Best before:{" "}
                          {new Date(
                            result.batch.expiryDate,
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-slate-500">Verification ID</p>
                  <p className="font-mono text-slate-800 break-words">
                    {result.verificationId}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-slate-500">Verified at</p>
                  <p className="font-medium text-slate-800">
                    {new Date(result.verifiedAt).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-slate-500">Total scans</p>
                  <p className="font-medium text-slate-800">
                    {result.scanCount}
                  </p>
                </div>
                {result.firstScannedAt && (
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-slate-500">First scanned</p>
                    <p className="font-medium text-slate-800">
                      {new Date(result.firstScannedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {(result.riskReason || result.recommendation) && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 space-y-2">
                  {result.riskReason && (
                    <p className="text-sm">
                      <span className="font-semibold text-amber-900">
                        Risk:{" "}
                      </span>
                      <span className="text-amber-800">
                        {result.riskReason}
                      </span>
                    </p>
                  )}
                  {result.recommendation && (
                    <p className="text-sm">
                      <span className="font-semibold text-amber-900">
                        Recommendation:{" "}
                      </span>
                      <span className="text-amber-800">
                        {result.recommendation}
                      </span>
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/complaints">
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4" /> Report a concern
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    ← Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <React.Suspense fallback={null}>
      <VerifyPageContent />
    </React.Suspense>
  );
}
