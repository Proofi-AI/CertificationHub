import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CertificateCard } from "@/components/certificates/CertificateCard";
import { SearchBar } from "@/components/search/SearchBar";
import { FilterPanel } from "@/components/search/FilterPanel";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Award } from "lucide-react";
import type { CertificateCategory, Prisma } from "@prisma/client";
import { Suspense } from "react";

interface PageProps {
  searchParams: {
    search?: string;
    category?: string;
    expiryStatus?: string;
    sortBy?: string;
    order?: string;
    page?: string;
  };
}

export default async function CertificatesPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { search, category, expiryStatus, sortBy = "createdAt", order = "desc", page = "1" } = searchParams;
  const pageNum = Math.max(1, Number(page));
  const limit = 12;
  const now = new Date();

  const where: Prisma.CertificateWhereInput = {
    userId: session.user.id,
    deletedAt: null,
    ...(category && { category: category as CertificateCategory }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { issuer: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  if (expiryStatus === "expired") {
    where.expiryDate = { lt: now };
  } else if (expiryStatus === "expiring_soon") {
    where.expiryDate = { gte: now, lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) };
  } else if (expiryStatus === "valid") {
    where.OR = [{ expiryDate: null }, { expiryDate: { gt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) } }];
  }

  const sortField = ["expiryDate", "createdAt", "name"].includes(sortBy) ? sortBy : "createdAt";
  const sortOrder = order === "asc" ? "asc" : "desc";

  const [certificates, total] = await Promise.all([
    prisma.certificate.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      skip: (pageNum - 1) * limit,
      take: limit,
    }),
    prisma.certificate.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
          <p className="text-gray-500 mt-1">{total} certificate{total !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild>
          <Link href="/certificates/new">
            <Plus className="h-4 w-4 mr-1" />
            Add Certificate
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>
        <Suspense>
          <FilterPanel />
        </Suspense>
      </div>

      {certificates.length === 0 ? (
        <div className="rounded-lg border border-dashed p-16 text-center">
          <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No certificates found</p>
          <p className="text-gray-500 text-sm mt-1">
            {search || category || expiryStatus
              ? "Try adjusting your filters."
              : "Add your first certificate to get started."}
          </p>
          {!search && !category && !expiryStatus && (
            <Button className="mt-4" asChild>
              <Link href="/certificates/new">Add Certificate</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((cert) => (
              <CertificateCard key={cert.id} certificate={cert} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === pageNum ? "default" : "outline"}
                  size="sm"
                  asChild
                >
                  <Link
                    href={`/certificates?${new URLSearchParams({
                      ...searchParams,
                      page: String(p),
                    })}`}
                  >
                    {p}
                  </Link>
                </Button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
