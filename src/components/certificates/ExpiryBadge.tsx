import { Badge } from "@/components/ui/badge";
import { getExpiryStatus, getDaysUntilExpiry } from "@/lib/utils";

interface ExpiryBadgeProps {
  expiryDate: Date | string | null | undefined;
}

export function ExpiryBadge({ expiryDate }: ExpiryBadgeProps) {
  const status = getExpiryStatus(expiryDate);
  const days = getDaysUntilExpiry(expiryDate);

  if (status === "no-expiry") {
    return <Badge variant="secondary">No Expiry</Badge>;
  }

  if (status === "expired") {
    return <Badge variant="destructive">Expired</Badge>;
  }

  if (status === "critical") {
    return (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
        Expires in {days}d
      </Badge>
    );
  }

  if (status === "warning") {
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
        Expires in {days}d
      </Badge>
    );
  }

  return (
    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
      Valid
    </Badge>
  );
}
