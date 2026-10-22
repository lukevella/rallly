import { PastDueAlert } from "@/features/billing/components/past-due-alert";

// Poll Admin takes the whole screen, without the space sidebar. Bounded to
// the viewport so the poll header stays put while the content scrolls.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      id="main-content"
      tabIndex={-1}
      className="flex h-svh min-w-0 flex-col bg-sidebar"
    >
      <PastDueAlert />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
