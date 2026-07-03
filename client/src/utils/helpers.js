export function formatDate(dateStr, options = {}) {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...options,
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function formatTime(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return "—";
  return `Rs. ${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatMonth(monthStr) {
  if (!monthStr) return "—";
  try {
    const [year, month] = monthStr.split("-");
    const date = new Date(year, month - 1);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  } catch {
    return monthStr;
  }
}

export function getInitials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}
