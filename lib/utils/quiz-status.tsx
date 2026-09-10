import { Badge } from "@/components/ui/badge";

export function getCompetitionStatusBadge(
  status?: string | null,
): React.ReactNode {
  if (!status) return null;
  const s = status.toLowerCase();
  if (s === "registration open") {
    return (
      <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
        Registration Open
      </Badge>
    );
  }
  if (s === "registration closed") {
    return (
      <Badge className="border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100">
        Registration Closed
      </Badge>
    );
  }
  if (s === "published") {
    return (
      <Badge className="border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-100">
        Published
      </Badge>
    );
  }
  if (s === "archived") {
    return (
      <Badge className="border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-100">
        Archived
      </Badge>
    );
  }
  return (
    <Badge className="border-gray-200 bg-gray-100 capitalize text-gray-800 hover:bg-gray-100">
      {status}
    </Badge>
  );
}

export function getRegistrationStatusBadge(
  status?: string | null,
): React.ReactNode {
  if (!status) return null;
  const s = status.toLowerCase();
  if (s === "approved") {
    return (
      <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
        Approved
      </Badge>
    );
  }
  if (s === "pending") {
    return (
      <Badge className="border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100">
        Pending
      </Badge>
    );
  }
  if (s === "rejected") {
    return (
      <Badge className="border-red-200 bg-red-100 text-red-800 hover:bg-red-100">
        Rejected
      </Badge>
    );
  }
  return (
    <Badge className="border-gray-200 bg-gray-100 capitalize text-gray-800 hover:bg-gray-100">
      {status}
    </Badge>
  );
}
