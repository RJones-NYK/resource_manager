import { isDevEnvironment } from "@/lib/env";

export function DevBanner() {
  if (!isDevEnvironment()) {
    return null;
  }

  return (
    <div className="dev-banner" role="status">
      Development — connected to resource_manager_dev on Mac mini
    </div>
  );
}
