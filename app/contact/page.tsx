"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Home,
  Headphones,
  CheckCircle2,
  Clock,
  MessageSquare,
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
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { useCreateContact } from "@/lib/api/hooks";
import { appConfig } from "@/lib/config";

const contactFormSchema = z.object({
  fullName: z.string().trim().min(2, "Name is too short").max(120),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  subject: z.string().trim().min(3, "Subject is too short").max(200),
  message: z
    .string()
    .trim()
    .min(10, "Please tell us a bit more (at least 10 characters)")
    .max(5000),
});

type ContactForm = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactFormSchema),
  });

  const [sent, setSent] = React.useState(false);
  const sendMessage = useCreateContact({
    onSuccess: () => {
      setSent(true);
      reset();
    },
  });

  function onSubmit(values: ContactForm) {
    setSent(false);
    const payload = {
      fullName: values.fullName,
      email: values.email,
      phone: values.phone || undefined,
      subject: values.subject,
      message: values.message,
    };
    sendMessage.mutate(payload);
  }

  if (sent) {
    return (
      <main className="min-h-screen bg-hero-gradient">
        <div className="mx-auto max-w-2xl px-6 py-12 lg:py-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-primary-700 hover:underline mb-8"
          >
            <Home className="h-4 w-4" /> Back to {appConfig.companyName} home
          </Link>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Message Sent</CardTitle>
                  <CardDescription className="mt-1">
                    Thank you for reaching out — we&apos;ve received your
                    message.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <Alert variant="success">
                Our customer support team will review your message and respond
                to the email you provided within 1–2 business days.
              </Alert>

              <div className="rounded-xl border border-slate-100 p-5 bg-slate-50/60 space-y-4">
                <h3 className="font-semibold text-slate-900">
                  Other ways to reach us
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                      <Mail className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">Email</p>
                      <a
                        className="text-primary-700 hover:underline"
                        href={`mailto:${appConfig.companyEmail}`}
                      >
                        {appConfig.companyEmail}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                      <Phone className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">Phone</p>
                      <p className="text-slate-600">{appConfig.companyPhone}</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                      <Clock className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">
                        Response time
                      </p>
                      <p className="text-slate-600">
                        Mon–Fri, 1–2 business days
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/">
                  <Button>
                    <Home className="h-4 w-4" /> Return home
                  </Button>
                </Link>
                <Link href="/complaints">
                  <Button variant="ghost">
                    <MessageSquare className="h-4 w-4" /> File a formal
                    complaint
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
      <div className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-primary-700 hover:underline mb-8"
        >
          ← Back to {appConfig.companyName} home
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-brand-gradient flex items-center justify-center text-white shadow-lg">
                    <Headphones className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle>Contact Customer Support</CardTitle>
                    <CardDescription className="mt-1">
                      Have a question, suggestion, or need help? Send us a
                      message and our team will get back to you.
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Phone (optional)"
                      type="tel"
                      placeholder="+234 ..."
                      error={errors.phone?.message}
                      {...register("phone")}
                    />
                    <Input
                      label="Subject"
                      placeholder="What is this about?"
                      error={errors.subject?.message}
                      {...register("subject")}
                    />
                  </div>

                  <Textarea
                    label="Your message"
                    placeholder="Describe your question, issue, or feedback in as much detail as you can. Include relevant product info, batch numbers, or codes if applicable."
                    rows={6}
                    error={errors.message?.message}
                    {...register("message")}
                  />

                  {sendMessage.isError && (
                    <Alert variant="danger">
                      {sendMessage.error?.message ??
                        "We couldn't send your message right now. Please try again in a moment."}
                    </Alert>
                  )}

                  <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
                    <p className="text-xs text-slate-500 max-w-sm">
                      By submitting this form you agree to our processing of the
                      information you provided for customer-support purposes.
                    </p>
                    <Button
                      type="submit"
                      loading={sendMessage.isPending}
                      size="lg"
                    >
                      <Send className="h-5 w-5" /> Send message
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-5">
                <h3 className="font-semibold text-slate-900">Get in touch</h3>

                <ul className="space-y-4 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="h-10 w-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                      <Mail className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">Email us</p>
                      <a
                        className="text-primary-700 hover:underline break-words"
                        href={`mailto:${appConfig.companyEmail}`}
                      >
                        {appConfig.companyEmail}
                      </a>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Response within 1–2 business days
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="h-10 w-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                      <Phone className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">Call us</p>
                      <p className="text-slate-700">{appConfig.companyPhone}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Mon–Fri during business hours
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="h-10 w-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">Office</p>
                      <p className="text-slate-700">
                        {appConfig.companyAddress}
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-semibold text-slate-900">Quick links</h3>
                <div className="flex flex-col gap-2 text-sm">
                  <Link
                    href="/verify"
                    className="text-primary-700 hover:underline inline-flex items-center gap-1.5"
                  >
                    Verify a product QR code
                  </Link>
                  <Link
                    href="/complaints"
                    className="text-primary-700 hover:underline inline-flex items-center gap-1.5"
                  >
                    File a formal complaint
                  </Link>
                  <Link
                    href="/complaints/track"
                    className="text-primary-700 hover:underline inline-flex items-center gap-1.5"
                  >
                    Track an existing complaint
                  </Link>
                  <Link
                    href="/news"
                    className="text-primary-700 hover:underline inline-flex items-center gap-1.5"
                  >
                    News, recalls & announcements
                  </Link>
                  <Link
                    href="/products"
                    className="text-primary-700 hover:underline inline-flex items-center gap-1.5"
                  >
                    Browse our products
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
