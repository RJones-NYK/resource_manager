import { isDevEnvironment } from "@/lib/env";

export function DevBanner() {
  if (!isDevEnvironment()) {
    return null;
  }

  return (
    <div className="bg-warning-bg px-4 py-2 text-center text-sm font-medium text-warning">
      Development environment — connected to resource_manager_dev
    </div>
  );
}
