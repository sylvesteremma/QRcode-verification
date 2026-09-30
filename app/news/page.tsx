"use client";

import * as React from "react";
import Link from "next/link";
import {
  Newspaper,
  Home,
  CalendarDays,
  User,
  Search,
  Inbox,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import { Alert } from "@/components/ui/alert";
import { useNews } from "@/lib/api/hooks";
import type { NewsPostJson } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { appConfig } from "@/lib/config";

export default function NewsPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = React.useDeferredValue(search);

  const newsQuery = useNews(
    { page, pageSize: 9, search: debouncedSearch },
  );

  const posts: NewsPostJson[] = newsQuery.data?.data ?? [];
  const totalPages = newsQuery.data?.totalPages ?? 1;
  const total = newsQuery.data?.total ?? 0;

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
                <Newspaper className="h-6 w-6" />
              </div>
              <Badge variant="neutral">Announcements</Badge>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
              News & Announcements
            </h1>
            <p className="mt-3 text-slate-600 max-w-2xl">
              Product recalls, new batch releases, company updates and important public notices from {appConfig.companyFull}.
            </p>
          </div>
          <div className="w-full sm:max-w-sm">
            <Input
              placeholder="Search articles…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="h-4 w-4 text-slate-400" />}
            />
          </div>
        </div>

        {newsQuery.isError && (
          <Alert variant="danger" className="mb-8">
            {newsQuery.error?.message ?? "We couldn't load news right now. Please refresh."}
          </Alert>
        )}

        {newsQuery.isLoading && !newsQuery.data ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="h-12 w-12 text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">No articles yet</p>
              <p className="mt-1 text-sm text-slate-500 max-w-md">
                {debouncedSearch
                  ? "No articles match your search. Try a different keyword."
                  : "Check back soon for important announcements and product updates."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {posts.map((post) => (
                <Card key={post.id} className="hover:shadow-popover transition overflow-hidden flex flex-col">
                  {post.featuredImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.featuredImageUrl}
                      alt={post.title}
                      className="h-44 w-full object-cover border-b border-slate-100"
                    />
                  ) : (
                    <div className="h-44 w-full bg-gradient-to-br from-primary-50 to-primary-100 border-b border-slate-100 flex items-center justify-center text-primary-600">
                      <Newspaper className="h-12 w-12" />
                    </div>
                  )}
                  <CardContent className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(post.publishedAt || post.createdAt)}
                      </span>
                      {post.authorName && (
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {post.authorName}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {post.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed flex-1 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="pt-4 mt-3">
                      <Link href={`/news/${post.slug}`}>
                        <Button variant="secondary" size="sm">
                          Read article <ChevronRight className="h-4 w-4" />
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
                Showing {posts.length} of {total} article{total === 1 ? "" : "s"}
              </p>
            )}
          </>
        )}

        <footer className="mt-16 border-t border-slate-200 bg-white/60 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>
              Questions about a recall or notice? Reach our support team.
            </p>
            <Link href="/contact">
              <Button variant="outline" size="sm">
                Contact support
              </Button>
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
