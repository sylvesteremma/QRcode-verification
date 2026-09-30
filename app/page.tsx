import Link from "next/link";
import { appConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldCheck,
  QrCode,
  MessageSquare,
  Package,
  Newspaper,
  FileQuestion,
} from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "Verify Product Authenticity",
    description:
      "Scan any SEMEK product QR code or enter the code manually to confirm you have a genuine product.",
    href: "/verify",
    cta: "Verify a code",
  },
  {
    icon: MessageSquare,
    title: "File a Complaint",
    description:
      "Report tampering, counterfeits or quality issues. Each case is tracked and responded to.",
    href: "/complaints",
    cta: "Lodge complaint",
  },
  {
    icon: Newspaper,
    title: "News & Announcements",
    description:
      "Stay current with product recalls, new batches and company updates.",
    href: "/news",
    cta: "Read news",
  },
  {
    icon: Package,
    title: "Our Products",
    description: "Explore the full range of SEMEK pure water products.",
    href: "/products",
    cta: "Browse products",
  },
  {
    icon: FileQuestion,
    title: "Track a Complaint",
    description:
      "Already filed a complaint? Follow its progress with your reference number.",
    href: "/complaints/track",
    cta: "Track status",
  },
  {
    icon: ShieldCheck,
    title: "Customer Support",
    description: "Need help? Reach our support team through the contact form.",
    href: "/contact",
    cta: "Contact us",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="bg-hero-gradient border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 rounded-xl bg-brand-gradient flex items-center justify-center text-white shadow-lg">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-wider text-primary-700 font-semibold">
                {appConfig.companyName}
              </p>
              <p className="text-sm text-slate-500">{appConfig.tagline}</p>
            </div>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-slate-900 max-w-3xl leading-tight">
            Every bottle verified.{" "}
            <span className="text-primary-600">Every drop trusted.</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl">
            Scan the QR code on any SEMEK product or type the code in manually
            to confirm authenticity, see production details, and report
            suspicious products.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/verify">
              <Button size="lg">
                <QrCode className="h-5 w-5" />
                Verify a product
              </Button>
            </Link>
            <Link href="/complaints">
              <Button variant="outline" size="lg">
                Report an issue
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <div className="mb-10">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">
            What would you like to do?
          </h2>
          <p className="mt-2 text-slate-600">
            Everything you need is one click away.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="hover:shadow-popover transition">
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="h-11 w-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {f.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link href={f.href}>
                      <Button variant="secondary" size="sm">
                        {f.cta} →
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-slate-500 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <p>
            © {new Date().getFullYear()} {appConfig.companyFull}. All rights
            reserved.
          </p>
          <p>
            Questions? Email{" "}
            <a
              className="text-primary-600 hover:underline"
              href={`mailto:${appConfig.companyEmail}`}
            >
              {appConfig.companyEmail}
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
