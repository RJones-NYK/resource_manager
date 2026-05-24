import { revalidatePath } from "next/cache";

export function revalidateAfterAdminChange(section: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/${section}`);
  revalidatePath("/planner/by-resource");
  revalidatePath("/planner/by-project");
}

export function revalidateAdminExtras(...paths: string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}
