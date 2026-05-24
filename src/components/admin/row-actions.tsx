"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

export function RowActions({
  editHref,
  deleteAction,
  recordId,
  recordLabel,
}: {
  editHref: string;
  deleteAction: (formData: FormData) => Promise<void>;
  recordId: string;
  recordLabel: string;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={editHref}
        className="inline-flex items-center justify-center rounded-lg p-1.5 text-g500 transition hover:bg-teal-soft hover:text-teal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        aria-label={`Edit ${recordLabel}`}
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </Link>
      <form
        action={deleteAction}
        onSubmit={(event) => {
          if (
            !window.confirm(`Delete ${recordLabel}? This cannot be undone.`)
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={recordId} />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg p-1.5 text-g500 transition hover:bg-magenta-soft hover:text-magenta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          aria-label={`Delete ${recordLabel}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
