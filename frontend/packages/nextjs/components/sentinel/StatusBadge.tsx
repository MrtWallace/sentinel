type StatusBadgeProps = {
  status: "executed" | "rejected" | "confirm_needed" | "failed" | "passed" | "review";
  label?: string;
};

const statusStyles: Record<StatusBadgeProps["status"], string> = {
  executed: "border-[#88d6b6]/40 bg-[#88d6b6]/10 text-[#a4f3d1]",
  passed: "border-[#88d6b6]/40 bg-[#88d6b6]/10 text-[#a4f3d1]",
  rejected: "border-[#ffb4ab]/40 bg-[#ffb4ab]/10 text-[#ffdad6]",
  confirm_needed: "border-amber-300/40 bg-amber-300/10 text-amber-100",
  failed: "border-rose-300/40 bg-rose-300/10 text-rose-100",
  review: "border-[#bcc7de]/40 bg-[#bcc7de]/10 text-[#d8e3fb]",
};

const statusLabels: Record<StatusBadgeProps["status"], string> = {
  executed: "EXECUTED",
  passed: "PASSED",
  rejected: "REJECTED",
  confirm_needed: "MANUAL REVIEW",
  failed: "FAILED",
  review: "MANUAL REVIEW",
};

export function getStatusLabel(status: StatusBadgeProps["status"]): string {
  return statusLabels[status];
}

export const StatusBadge = ({ status, label }: StatusBadgeProps) => {
  return (
    <span
      className={`inline-flex h-6 items-center whitespace-nowrap rounded-md border px-2 font-mono text-[11px] font-semibold ${statusStyles[status]}`}
    >
      {label ?? getStatusLabel(status)}
    </span>
  );
};
