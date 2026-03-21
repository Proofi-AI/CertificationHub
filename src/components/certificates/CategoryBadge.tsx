import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS } from "@/lib/utils";
import type { CertificateCategory } from "@prisma/client";

export function CategoryBadge({ category }: { category: CertificateCategory }) {
  return (
    <Badge variant="outline" className="text-xs">
      {CATEGORY_LABELS[category] ?? category}
    </Badge>
  );
}
