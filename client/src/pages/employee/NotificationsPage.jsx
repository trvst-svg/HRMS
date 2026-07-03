import EmptyState from "../../components/ui/EmptyState";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="animate-fade-in">
      <h1
        style={{
          fontSize: "var(--font-size-2xl)",
          fontWeight: 700,
          marginBottom: "var(--space-6)",
        }}
      >
        Notifications
      </h1>
      <EmptyState
        icon={Bell}
        title="No notifications"
        message="You're all caught up!"
      />
    </div>
  );
}
