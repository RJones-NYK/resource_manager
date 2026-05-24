import { ContextBar, SectionTabs, adminTabs } from "@/components/layout/section-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ContextBar pill="Administration" meta="Reference data and setup" />
      <SectionTabs tabs={adminTabs} ariaLabel="Administration" />
      <div className="mx-auto max-w-[1100px] px-6 py-8">{children}</div>
    </>
  );
}
