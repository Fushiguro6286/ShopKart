export const shortOrderId = (id) => id.slice(-8).toUpperCase();

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const STATUS_CLASS = {
  PENDING_PAYMENT: "badge-warn",
  PLACED: "badge-ok",
  CONFIRMED: "badge-ok",
  SHIPPED: "badge-info",
  DELIVERED: "badge-info",
};

export const statusClass = (status) => STATUS_CLASS[status] || "badge-warn";

export const statusLabel = (status) => status.replace("_", " ");
