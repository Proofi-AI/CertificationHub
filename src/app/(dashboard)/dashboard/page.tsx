import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { CertificateCard } from "@/components/certificates/CertificateCard";
import { Award, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [total, expiringSoon, expired, recent] = await Promise.all([
    prisma.certificate.count({ where: { userId, deletedAt: null } }),
    prisma.certificate.count({
      where: { userId, deletedAt: null, expiryDate: { gte: now, lte: in30Days } },
    }),
    prisma.certificate.count({
      where: { userId, deletedAt: null, expiryDate: { lt: now } },
    }),
    prisma.certificate.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session.user.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s an overview of your certifications.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Certificates"
          value={total}
          icon={<Award className="h-5 w-5" />}
        />
        <StatsCard
          title="Expiring in 30 Days"
          value={expiringSoon}
          icon={<Clock className="h-5 w-5" />}
          variant={expiringSoon > 0 ? "warning" : "default"}
        />
        <StatsCard
          title="Expired"
          value={expired}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant={expired > 0 ? "danger" : "default"}
        />
        <StatsCard
          title="Active"
          value={total - expired}
          icon={<TrendingUp className="h-5 w-5" />}
          description="Certificates not expired"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recently Added</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/certificates">View all</Link>
          </Button>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <Award className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No certificates yet.</p>
            <Button className="mt-4" asChild>
              <Link href="/certificates/new">Add your first certificate</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((cert) => (
              <CertificateCard key={cert.id} certificate={cert} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
