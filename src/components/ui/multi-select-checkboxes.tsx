"use client";

import { useState } from "react";

type Option = { value: string; label: string };

export function MultiSelectCheckboxes({
  id,
  name,
  options,
  defaultSelected = [],
}: {
  id: string;
  name: string;
  options: Option[];
  defaultSelected?: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(defaultSelected),
  );
  const allSelected =
    options.length > 0 && selected.size === options.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(options.map((o) => o.value)));
  }

  function toggle(value: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  return (
    <div className="multi-select-checkboxes" id={id}>
      {options.length > 1 ? (
        <label className="multi-select-checkboxes__select-all">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
          />
          Select all
        </label>
      ) : null}
      <div className="multi-select-checkboxes__list">
        {options.map((option) => (
          <label key={option.value} className="checkbox-row">
            <input
              type="checkbox"
              name={name}
              value={option.value}
              checked={selected.has(option.value)}
              onChange={() => toggle(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}
