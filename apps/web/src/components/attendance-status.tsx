import { FiCheck, FiClock, FiMinus, FiX } from "react-icons/fi";

function statusPresentation(status: string) {
  if (status === "ABSENT") {
    return { Icon: FiX, tone: "absent" };
  }
  if (status === "EXCUSED") {
    return { Icon: FiMinus, tone: "excused" };
  }
  if (status === "LATE") {
    return { Icon: FiClock, tone: "late" };
  }
  return { Icon: FiCheck, tone: "present" };
}

export function attendanceStatusTone(status: string) {
  return statusPresentation(status).tone;
}

export function AttendanceStatusBadge({ status }: { status: string }) {
  const { Icon, tone } = statusPresentation(status);
  return (
    <span className={"attendance-status-badge attendance-status-" + tone}>
      <Icon aria-hidden="true" />
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function AttendanceStatusMark({ status }: { status: string }) {
  const { Icon, tone } = statusPresentation(status);
  return (
    <span
      className={"attendance-status-mark attendance-status-" + tone}
      aria-label={status.replaceAll("_", " ")}
    >
      <Icon aria-hidden="true" />
    </span>
  );
}
