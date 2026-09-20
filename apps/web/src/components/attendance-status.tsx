import { FiCheck, FiMinus, FiX } from "react-icons/fi";

function statusPresentation(status: string) {
  if (status === "ABSENT") {
    return {
      Icon: FiX,
      badge: "bg-red-100 text-red-700",
      mark: "bg-red-100 text-red-700",
    };
  }
  if (status === "EXCUSED") {
    return {
      Icon: FiMinus,
      badge: "bg-amber-100 text-amber-800",
      mark: "bg-amber-100 text-amber-700",
    };
  }
  return {
    Icon: FiCheck,
    badge: "bg-emerald-100 text-emerald-800",
    mark: "bg-emerald-100 text-emerald-700",
  };
}

export function AttendanceStatusBadge({ status }: { status: string }) {
  const { Icon, badge } = statusPresentation(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${badge}`}
    >
      <Icon aria-hidden="true" />
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function AttendanceStatusMark({ status }: { status: string }) {
  const { Icon, mark } = statusPresentation(status);
  return (
    <span
      className={`grid size-11 shrink-0 place-items-center rounded-2xl ${mark}`}
      aria-label={status.replaceAll("_", " ")}
    >
      <Icon aria-hidden="true" />
    </span>
  );
}
