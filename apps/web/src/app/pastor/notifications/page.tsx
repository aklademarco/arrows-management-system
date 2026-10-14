import { NotificationInbox } from "@/components/notification-inbox";
export default function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <NotificationInbox
      searchParams={searchParams}
      basePath="/pastor/notifications"
    />
  );
}
