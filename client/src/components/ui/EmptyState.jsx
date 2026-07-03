import { Inbox } from "lucide-react";
import "./EmptyState.css";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "No data yet",
  message = "",
}) {
  return (
    <div className="empty-state animate-fade-in">
      <div className="empty-state__icon">
        <Icon size={40} />
      </div>
      <h3 className="empty-state__title">{title}</h3>
      {message && <p className="empty-state__message">{message}</p>}
    </div>
  );
}
