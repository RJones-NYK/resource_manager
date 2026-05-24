import { ResourceExternalTag } from "@/components/ui/resource-tags";

type PlannerResourceLabelProps = {
  name: string;
  roleName?: string | null;
  isExternal?: boolean;
};

export function PlannerResourceLabel({
  name,
  roleName,
  isExternal = false,
}: PlannerResourceLabelProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex flex-wrap items-center gap-1.5">
        {name}
        {isExternal ? <ResourceExternalTag /> : null}
      </span>
      {roleName ? (
        <span className="text-[11px] font-light leading-tight text-g500">
          {roleName}
        </span>
      ) : null}
    </div>
  );
}
