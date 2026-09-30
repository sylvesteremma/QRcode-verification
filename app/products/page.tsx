"use client";

import * as React from "react";
import Link from "next/link";
import {
  Package2,
  Home,
  Search,
  Inbox,
  QrCode,
  Hash,
  Droplets,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import { Alert } from "@/components/ui/alert";
import { useProducts } from "@/lib/api/hooks";
import type { ProductJson } from "@/lib/types";
import { appConfig } from "@/lib/config";

function productTypeIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes("sachet")) return <Package className="h-6 w-6" />;
  if (t.includes("bottle") || t.includes("water")) return <Droplets className="h-6 w-6" />;
  return <Package2 className="h-6 w-6" />;
}

export default function ProductsPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = React.useDeferredValue(search);

  const productsQuery = useProducts(
    { page, pageSize: 12, search: debouncedSearch, status: "ACTIVE" },
  );

  const products: ProductJson[] = productsQuery.data?.data ?? [];
  const totalPages = productsQuery.data?.totalPages ?? 1;
  const total = productsQuery.data?.total ?? 0;

  return (
    <main className="min-h-screen bg-hero-gradient">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-primary-700 hover:underline mb-8">
          ← Back to {appConfig.companyName} home
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-11 w-11 rounded-xl bg-brand-gradient flex items-center justify-center text-white shadow-lg">
                <Package2 className="h-6 w-6" />
              </div>
              <Badge variant="neutral">Full range</Badge>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
              Our Products
            </h1>
            <p className="mt-3 text-slate-600 max-w-2xl">
              Explore every product in the {appConfig.companyName} {appConfig.tagline.toLowerCase()} range. Click any product to verify its authenticity or find out more.
            </p>
          </div>
          <div className="w-full sm:max-w-sm">
            <Input
              placeholder="Search by name, type, or SKU…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="h-4 w-4 text-slate-400" />}
            />
          </div>
        </div>

        {productsQuery.isError && (
          <Alert variant="danger" className="mb-8">
            {productsQuery.error?.message ?? "We couldn't load products right now. Please refresh."}
          </Alert>
        )}

        {productsQuery.isLoading && !productsQuery.data ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="h-12 w-12 text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">No products yet</p>
              <p className="mt-1 text-sm text-slate-500 max-w-md">
                {debouncedSearch
                  ? "No products match your search. Try a different name, type, or SKU."
                  : "Our product catalogue is being prepared. Check back soon for the full range."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {products.map((p) => (
                <Card
                  key={p.id}
                  className="hover:shadow-popover transition overflow-hidden flex flex-col"
                >
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-48 w-full object-cover border-b border-slate-100 bg-slate-50"
                    />
                  ) : (
                    <div className="h-48 w-full bg-gradient-to-br from-primary-50 via-white to-primary-100 border-b border-slate-100 flex items-center justify-center text-primary-600">
                      {productTypeIcon(p.type)}
                    </div>
                  )}
                  <CardContent className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <Badge variant="neutral" className="mb-2">
                          {p.type}
                        </Badge>
                        <h2 className="text-lg font-semibold text-slate-900 leading-snug">
                          {p.name}
                        </h2>
                      </div>
                      {p.size && (
                        <span className="shrink-0 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 border border-primary-100">
                          {p.size}
                        </span>
                      )}
                    </div>
                    {p.description && (
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed line-clamp-2 flex-1">
                        {p.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-100 pt-3">
                      <span className="inline-flex items-center gap-1">
                        <Hash className="h-3.5 w-3.5" />
                        SKU <span className="font-mono font-medium text-slate-700">{p.sku}</span>
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <Link href="/verify">
                        <Button variant="secondary" size="sm">
                          <QrCode className="h-4 w-4" /> Verify authenticity
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={(p) => {
                  setPage(p);
                  if (typeof window !== "undefined") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              />
            )}

            {total > 0 && (
              <p className="mt-6 text-center text-sm text-slate-500">
                Showing {products.length} of {total} product{total === 1 ? "" : "s"}
              </p>
            )}
          </>
        )}

        <footer className="mt-16 border-t border-slate-200 bg-white/60 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>
              Concerned about a product you purchased? Verify it or report an issue.
            </p>
            <div className="flex gap-3">
              <Link href="/verify">
                <Button variant="secondary" size="sm">
                  <QrCode className="h-4 w-4" /> Verify a code
                </Button>
              </Link>
              <Link href="/complaints">
                <Button variant="outline" size="sm">
                  Report a concern
                </Button>
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
