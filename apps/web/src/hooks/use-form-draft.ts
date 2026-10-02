"use client";

import { useEffect, useRef } from "react";

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
type Draft = Record<string, string[]>;

const SENSITIVE = ["password", "token", "secret"];
const SKIP_TYPES = ["password", "file", "hidden", "submit", "button"];
const isCheckable = (el: Field): el is HTMLInputElement =>
  el instanceof HTMLInputElement &&
  (el.type === "checkbox" || el.type === "radio");

const read = (el: Field): string[] =>
  el instanceof HTMLSelectElement
    ? Array.from(el.selectedOptions, (o) => o.value)
    : isCheckable(el)
      ? el.checked
        ? [el.value]
        : []
      : [el.value];

function write(el: Field, vals: string[]) {
  if (el instanceof HTMLSelectElement && el.multiple)
    for (const o of Array.from(el.options)) o.selected = vals.includes(o.value);
  else if (isCheckable(el)) el.checked = vals.includes(el.value);
  else el.value = vals[0] ?? "";
}

export function useFormDraft(
  draftKey: string,
  { exclude = [], clear = false }: { exclude?: string[]; clear?: boolean } = {},
) {
  const formRef = useRef<HTMLFormElement>(null);
  const key = `acms:form-draft:${draftKey}`;
  const skip = exclude.join(","); 

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const blocked = [...SENSITIVE, ...skip.split(",")]
      .filter(Boolean)
      .map((s) => s.toLowerCase());

    const fields = () =>
      Array.from(form.elements).filter(
        (el): el is Field =>
          (el instanceof HTMLInputElement ||
            el instanceof HTMLTextAreaElement ||
            el instanceof HTMLSelectElement) &&
          !!el.name &&
          !el.disabled &&
          !SKIP_TYPES.includes(el.type) &&
          !blocked.some((b) => el.name.toLowerCase().includes(b)),
      );

    try {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const draft: Draft = JSON.parse(saved);
        for (const el of fields()) write(el, draft[el.name] ?? []);
      }
    } catch {
        try {
          sessionStorage.removeItem(key);
        } catch {}
    }

    let timer: number;
    const save = () => {
      const draft: Draft = {};
      for (const el of fields())
        draft[el.name] = [...(draft[el.name] ?? []), ...read(el)];
      try {
        sessionStorage.setItem(key, JSON.stringify(draft));
      } catch {}
    };
    const onInput = () => {
      clearTimeout(timer);
      timer = window.setTimeout(save, 300);
    };

    form.addEventListener("input", onInput);
    return () => {
      clearTimeout(timer);
      form.removeEventListener("input", onInput);
    };
  }, [key, skip]);

  useEffect(() => {
    if (clear)
      try {
        sessionStorage.removeItem(key);
      } catch {}
  }, [clear, key]);

  return { formRef };
}
