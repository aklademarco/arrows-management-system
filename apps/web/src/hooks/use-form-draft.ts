"use client";

import { useCallback, useEffect, useRef, useMemo} from "react";

type DraftValue = string | string[] | boolean;
type FormDraft = Record<string, DraftValue>;

type UseFormDraftOptions = {
  exclude?: string[];
};

const SENSITIVE_FIELDS = [
  "password",
  "confirmPassword",
  "currentPassword",
  "newPassword",
  "token",
  "secret",
];

export function useFormDraft(
  draftKey: string,
  options: UseFormDraftOptions = {},
) {
  const formRef = useRef<HTMLFormElement>(null);
  

  const storageKey = `acms:form-draft:${draftKey}`;

  const excludedFields = useMemo(
    () => new Set([...SENSITIVE_FIELDS, ...(options.exclude ?? [])]),
    [options.exclude],
  );

  const shouldExclude = useCallback(
    (name: string) => {
      const normalizedName = name.toLowerCase();

      return [...excludedFields].some((field) =>
        normalizedName.includes(field.toLowerCase()),
      );
    },
    [excludedFields],
  );

  const saveDraft = useCallback(() => {
    const form = formRef.current;

    if (!form) return;

    const draft: FormDraft = {};

    for (const element of Array.from(form.elements)) {
      if (
        !(
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLSelectElement
        )
      ) {
        continue;
      }

      if (!element.name || shouldExclude(element.name)) {
        continue;
      }

      if (
        element instanceof HTMLInputElement &&
        ["password", "file", "hidden", "submit", "button"].includes(
          element.type,
        )
      ) {
        continue;
      }

      if (element instanceof HTMLInputElement && element.type === "checkbox") {
        draft[element.name] = element.checked;
        continue;
      }

      if (element instanceof HTMLInputElement && element.type === "radio") {
        if (element.checked) {
          draft[element.name] = element.value;
        }

        continue;
      }

      if (element instanceof HTMLSelectElement && element.multiple) {
        draft[element.name] = Array.from(element.selectedOptions).map(
          (option) => option.value,
        );

        continue;
      }

      draft[element.name] = element.value;
    }

    sessionStorage.setItem(storageKey, JSON.stringify(draft));
  }, [shouldExclude, storageKey]);

  const clearDraft = useCallback(() => {
    sessionStorage.removeItem(storageKey);
  }, [storageKey]);

  useEffect(() => {
    const form = formRef.current;
    const savedDraft = sessionStorage.getItem(storageKey);

    if (!form || !savedDraft) return;

    try {
      const draft = JSON.parse(savedDraft) as FormDraft;

      for (const element of Array.from(form.elements)) {
        if (
          !(
            element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement ||
            element instanceof HTMLSelectElement
          )
        ) {
          continue;
        }

        if (!element.name || !(element.name in draft)) {
          continue;
        }

        const value = draft[element.name];

        if (
          element instanceof HTMLInputElement &&
          element.type === "checkbox"
        ) {
          element.checked = value === true;
          continue;
        }

        if (element instanceof HTMLInputElement && element.type === "radio") {
          element.checked = element.value === value;
          continue;
        }

        if (
          element instanceof HTMLSelectElement &&
          element.multiple &&
          Array.isArray(value)
        ) {
          for (const option of Array.from(element.options)) {
            option.selected = value.includes(option.value);
          }

          continue;
        }

        if (typeof value === "string") {
          element.value = value;
        }
      }
    } catch {
      sessionStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  return {
    formRef,
    saveDraft,
    clearDraft,
  };
}
