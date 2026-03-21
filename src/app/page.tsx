import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Award, Shield, Bell, Globe } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-4">
          <span className="text-xl font-bold text-blue-600">proofi.ai</span>
          <div className="flex gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-24 text-center">
          <h1 className="text-5xl font-bold text-gray-900 leading-tight">
            Your professional certifications,
            <br />
            <span className="text-blue-600">all in one place</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
            Securely store, organize, track, and showcase your certifications throughout your career.
            Never miss an expiry again.
          </p>
          <div className="mt-10 flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">Start for free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="border-t bg-gray-50 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Everything you need to manage your credentials
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: <Award className="h-8 w-8 text-blue-600" />,
                  title: "Centralized Storage",
                  desc: "Upload PDFs and images or manually enter your certification details in one secure place.",
                },
                {
                  icon: <Bell className="h-8 w-8 text-blue-600" />,
                  title: "Expiry Alerts",
                  desc: "Get email reminders 90, 30, and 7 days before your certifications expire.",
                },
                {
                  icon: <Globe className="h-8 w-8 text-blue-600" />,
                  title: "Public Profile",
                  desc: "Share a beautiful public profile page with your credentials at a custom URL.",
                },
                {
                  icon: <Shield className="h-8 w-8 text-blue-600" />,
                  title: "Privacy Control",
                  desc: "Choose which certificates appear on your public profile with per-certificate toggles.",
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="rounded-lg border bg-white p-6">
                  <div className="mb-4">{icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} proofi.ai. Free and open source.
        </div>
      </footer>
    </div>
  );
}
