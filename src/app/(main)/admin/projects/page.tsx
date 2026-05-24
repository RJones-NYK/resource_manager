export const dynamic = "force-dynamic";

import { getProjects } from "@/lib/queries";
import { ProjectForm } from "@/components/admin/project-form";
import { ProjectsList } from "@/components/admin/projects-list";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorAlert } from "@/components/ui/data-display";

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  let items: Awaited<ReturnType<typeof getProjects>> = [];
  let error: string | null = null;

  try {
    items = await getProjects();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load projects";
  }

  const editing = edit ? items.find((item) => item.id === edit) : undefined;
  const clientSuggestions = [
    ...new Set(
      items
        .map((item) => item.client?.trim())
        .filter((client): client is string => Boolean(client)),
    ),
  ].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Pipeline and delivery statuses below; finished work is kept in the completed list."
      />
      {error && <ErrorAlert message={error} />}
      <ProjectForm
        key={edit ?? "new"}
        project={editing}
        clientSuggestions={clientSuggestions}
      />
      <ProjectsList projects={items} editingId={editing?.id} />
    </div>
  );
}
