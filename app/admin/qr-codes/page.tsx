"use client";

import * as React from "react";
import QRCode from "qrcode";
import { Download, QrCode } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";

type GeneratedCode = {
  id: string;
  code: string;
  data: string;
  status: "VALID" | "USED" | "EXPIRED";
  createdAt: string;
  expiresAt: string | null;
  admin: { fullName: string; email: string };
};

export default function AdminQRCodesPage() {
  const session = useSession();
  const isAdmin = session.data?.user?.role === "ADMIN";
  const [rows, setRows] = React.useState<GeneratedCode[]>([]);
  const [data, setData] = React.useState("");
  const [preview, setPreview] = React.useState<{ code: string; image: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const refresh = React.useCallback(async () => {
    const result = await apiFetch<GeneratedCode[]>("/admin/qr-codes");
    setRows(result);
  }, []);

  React.useEffect(() => {
    if (!isAdmin) return;
    void refresh().catch((e: Error) => setError(e.message)).finally(() => setLoading(false));
  }, [isAdmin, refresh]);

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const saved = await apiFetch<GeneratedCode & { qrDataURL: string }>("/admin/qr-codes", {
        method: "POST",
        body: { data },
      });
      // Render in the browser for the preview and PNG download.
      const image = await QRCode.toDataURL(saved.code);
      setPreview({ code: saved.code, image });
      setData("");
      setRows((current) => [saved, ...current]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate QR code.");
    } finally {
      setSaving(false);
    }
  }

  async function download(row: GeneratedCode) {
    try {
      const image = await QRCode.toDataURL(row.code);
      const link = document.createElement("a");
      link.href = image;
      link.download = `${row.code}.png`;
      link.click();
    } catch {
      setError("Could not create the PNG download.");
    }
  }

  if (session.isLoading || (isAdmin && loading)) return <main className="min-h-screen grid place-items-center"><Spinner size="lg" /></main>;
  if (!isAdmin) return <main className="mx-auto max-w-3xl px-6 py-12"><Alert variant="danger">Admin access required.</Alert></main>;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div><h1 className="text-2xl font-bold text-slate-900">QR Code Generator</h1><p className="mt-1 text-sm text-slate-500">Create and download database-verified QR codes.</p></div>
        {error && <Alert variant="danger">{error}</Alert>}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" /> Generate QR Code</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={generate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Input label="Data / label" value={data} onChange={(event) => setData(event.target.value)} required maxLength={1000} placeholder="What does this code represent?" className="flex-1" />
              <Button type="submit" loading={saving}>Generate QR Code</Button>
            </form>
            {preview && <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}<img src={preview.image} alt={`QR code for ${preview.code}`} className="h-40 w-40" />
              <div><p className="font-semibold">Generated preview</p><p className="mt-1 break-all font-mono text-sm text-slate-600">{preview.code}</p><Button className="mt-3" variant="outline" onClick={() => { const a = document.createElement("a"); a.href = preview.image; a.download = `${preview.code}.png`; a.click(); }}><Download className="h-4 w-4" /> Download PNG</Button></div>
            </div>}
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Generated codes</CardTitle></CardHeader><CardContent>
          {rows.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No QR codes have been generated.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs uppercase text-slate-500"><th className="px-3 py-3">Label / data</th><th className="px-3 py-3">Code</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Created</th><th className="px-3 py-3">Generated by</th><th className="px-3 py-3">Download</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b last:border-0"><td className="px-3 py-3">{row.data}</td><td className="px-3 py-3 font-mono text-xs">{row.code}</td><td className="px-3 py-3"><Badge variant={row.status === "VALID" ? "success" : "neutral"}>{row.status}</Badge></td><td className="px-3 py-3 whitespace-nowrap">{new Date(row.createdAt).toLocaleString()}</td><td className="px-3 py-3">{row.admin.fullName}</td><td className="px-3 py-3"><Button size="sm" variant="outline" onClick={() => void download(row)}><Download className="h-4 w-4" /> PNG</Button></td></tr>)}</tbody></table></div>}
        </CardContent></Card>
      </div>
    </main>
  );
}
