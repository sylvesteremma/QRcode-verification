"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Shield,
  Mail,
  KeyRound,
  LogIn,
  Home,
  AlertTriangle,
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
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useLogin } from "@/lib/api/hooks";
import { appConfig } from "@/lib/config";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

function AdminLoginPageContent() {
  const search = useSearchParams();
  const router = useRouter();
  const nextPath = search.get("next")?.trim() || "/admin";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const [redirectTriggered, setRedirectTriggered] = React.useState(false);
  const login = useLogin({
    onSuccess: () => {
      setRedirectTriggered(true);
      const safeNext = nextPath.startsWith("/") ? nextPath : "/admin";
      setTimeout(() => {
        router.push(safeNext);
      }, 300);
    },
  });

  function onSubmit(values: LoginForm) {
    login.mutate({
      email: values.email,
      password: values.password,
    });
  }

  return (
    <main className="min-h-screen bg-hero-gradient flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 mb-5"
          >
            <Home className="h-3.5 w-3.5" />
            Back to public site
          </Link>
          <div className="h-14 w-14 rounded-2xl bg-brand-gradient flex items-center justify-center text-white shadow-lg mb-4">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
            {appConfig.companyName} Admin
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to the operations dashboard
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Sign in</CardTitle>
                <CardDescription className="mt-1">
                  Enter your admin credentials.
                </CardDescription>
              </div>
              <Badge variant="neutral">Staff only</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Email address"
                type="email"
                placeholder="admin@semek.com"
                autoComplete="email"
                error={errors.email?.message}
                leftIcon={<Mail className="h-4 w-4 text-slate-400" />}
                {...register("email")}
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                error={errors.password?.message}
                leftIcon={<KeyRound className="h-4 w-4 text-slate-400" />}
                {...register("password")}
              />

              {redirectTriggered && (
                <Alert variant="success">
                  Signed in successfully — redirecting you to the dashboard…
                </Alert>
              )}

              {login.isError && (
                <Alert variant="danger">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Sign in failed</p>
                      <p className="text-sm mt-0.5 opacity-95">
                        {login.error?.message ??
                          "Please verify your credentials and try again."}
                      </p>
                    </div>
                  </div>
                </Alert>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={login.isPending || redirectTriggered}
              >
                <LogIn className="h-5 w-5" />
                Sign in
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
              <p>
                <strong className="text-slate-600">Default admin:</strong>{" "}
                <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                  admin@semek.com
                </code>
              </p>
              <p>
                <strong className="text-slate-600">Need help?</strong> Contact
                the system administrator or use the{" "}
                <Link
                  href="/contact"
                  className="text-primary-700 hover:underline"
                >
                  public contact form
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} {appConfig.companyFull}. Admin console —
          authorised personnel only.
        </p>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <React.Suspense fallback={null}>
      <AdminLoginPageContent />
    </React.Suspense>
  );
}
