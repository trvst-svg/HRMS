import "./Badge.css";

export default function Badge({ children, variant = "default", size = "md" }) {
  return (
    <span className={`badge badge--${variant} badge--${size}`}>{children}</span>
  );
}

/** Convenience for leave/document/payroll status */
export function StatusBadge({ status }) {
  const map = {
    Pending: "warning",
    Approved: "success",
    Rejected: "danger",
    Cancelled: "muted",
    Processed: "info",
    Paid: "success",
    Present: "success",
    Absent: "danger",
    "Half Day Present": "warning",
    Leave: "info",
    WFH: "brand",
    active: "success",
    inactive: "muted",
    layoff: "danger",
  };
  return <Badge variant={map[status] || "default"}>{status}</Badge>;
}
