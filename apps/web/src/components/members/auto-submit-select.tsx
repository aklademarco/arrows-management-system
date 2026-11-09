"use client";

import type { SelectHTMLAttributes } from "react";

/** A select that submits its form as soon as the value changes. */
export function AutoSubmitSelect(
  props: SelectHTMLAttributes<HTMLSelectElement>,
) {
  return (
    <select
      {...props}
      onChange={(event) => event.currentTarget.form?.requestSubmit()}
    />
  );
}
