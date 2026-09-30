"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Newspaper,
  Home,
  CalendarDays,
  User,
  ArrowLeft,
  MessageSquarePlus,
  Send,
  CheckCircle2,
  Inbox,
  Clock,
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
import { Spinner } from "@/components/ui/spinner";
import { useNews, useCreateFeedback } from "@/lib/api/hooks";
import type { NewsPostJson, FeedbackJson } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/utils";
import { appConfig } from "@/lib/config";

const feedbackSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().email("Please enter a valid email address"),
  message: z.string().trim().min(5, "Message is too short").max(2000),
});

type FeedbackForm = z.infer<typeof feedbackSchema>;

export default function NewsDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const newsQuery = useNews({ pageSize: 100 });
  const post: NewsPostJson | undefined = newsQuery.data?.data.find(
    (item) => item.slug === slug,
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema),
  });

  const [feedbackSent, setFeedbackSent] = React.useState(false);
  const createFeedback = useCreateFeedback(post?.id ?? "", {
    onSuccess: () => {
      setFeedbackSent(true);
      reset();
    },
  });

  function onFeedbackSubmit(values: FeedbackForm) {
    setFeedbackSent(false);
    createFeedback.mutate(values);
  }

  if (newsQuery.isLoading && !newsQuery.data) {
    return (
      <main className="min-h-screen bg-hero-gradient">
        <div className="mx-auto max-w-4xl px-6 py-20 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-hero-gradient">
        <div className="mx-auto max-w-3xl px-6 py-12 lg:py-16">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm text-primary-700 hover:underline mb-8"
          >
            <ArrowLeft className="h-4 w-4" /> Back to news
          </Link>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Newspaper className="h-12 w-12 text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">Article not found</p>
              <p className="mt-1 text-sm text-slate-500 max-w-md">
                This article may have been removed or unpublished. Return to the
                news listing to see current announcements.
              </p>
              <div className="mt-6 flex gap-3">
                <Link href="/news">
                  <Button>
                    <Newspaper className="h-4 w-4" /> Browse all news
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="ghost">
                    <Home className="h-4 w-4" /> Home
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
      <div className="mx-auto max-w-4xl px-6 py-12 lg:py-16">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-sm text-primary-700 hover:underline mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back to all news
        </Link>

        <article>
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="default">
                {post.status === "PUBLISHED" ? "Published" : post.status}
              </Badge>
            </div>
            <h1 className="text-3xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              {post.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {formatDate(post.publishedAt || post.createdAt)}
              </span>
              {post.authorName && (
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {post.authorName}
                </span>
              )}
            </div>
          </header>

          {post.featuredImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.featuredImageUrl}
              alt={post.title}
              className="w-full h-64 lg:h-80 object-cover rounded-2xl border border-slate-100 shadow-card mb-10"
            />
          ) : (
            <div className="w-full h-48 lg:h-64 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl border border-slate-100 flex items-center justify-center text-primary-600 mb-10">
              <Newspaper className="h-16 w-16" />
            </div>
          )}

          <section className="prose prose-slate max-w-none mb-10">
            <p className="text-lg text-slate-700 font-medium italic mb-6 leading-relaxed">
              {post.excerpt}
            </p>
            <div className="space-y-4 text-slate-700 leading-7 whitespace-pre-wrap">
              {post.content}
            </div>
          </section>
        </article>

        <section className="border-t border-slate-200 pt-10 mt-10">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                  <MessageSquarePlus className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Share your thoughts</CardTitle>
                  <CardDescription className="mt-1">
                    We read every comment. Your feedback helps us improve.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {feedbackSent && (
                <Alert variant="success" className="mb-5">
                  Thank you — your feedback has been submitted and will be
                  reviewed by our moderation team.
                </Alert>
              )}

              <form
                onSubmit={handleSubmit(onFeedbackSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Your name"
                    placeholder="Display name"
                    error={errors.name?.message}
                    {...register("name")}
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com (not published)"
                    error={errors.email?.message}
                    {...register("email")}
                  />
                </div>
                <textarea
                  {...register("message")}
                  className={`w-full rounded-xl border px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition text-sm text-slate-900 placeholder:text-slate-400 resize-y ${errors.message ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "border-slate-200"}`}
                  rows={4}
                  placeholder="What did you think about this announcement? Ask a question or share your perspective."
                />
                {errors.message && (
                  <p className="text-sm text-red-600">
                    {errors.message.message}
                  </p>
                )}

                {createFeedback.isError && (
                  <Alert variant="danger">
                    {createFeedback.error?.message ??
                      "We couldn't submit your feedback right now. Please try again in a moment."}
                  </Alert>
                )}

                <div className="flex justify-end">
                  <Button type="submit" loading={createFeedback.isPending}>
                    <Send className="h-4 w-4" /> Post feedback
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        <div className="mt-10 flex flex-wrap justify-between items-center gap-4">
          <Link href="/news">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" /> More announcements
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost">
              <Home className="h-4 w-4" /> Home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
