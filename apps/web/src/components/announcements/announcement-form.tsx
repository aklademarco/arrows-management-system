"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { FiImage, FiLoader, FiTrash2, FiUpload, FiX } from "react-icons/fi";

import {
  saveAnnouncement,
  type SaveAnnouncementInput,
} from "@/app/announcement-actions";
import type {
  Announcement,
  AnnouncementKind,
  PublishingPortal,
} from "@/lib/announcements";
import { isoToChurchWallTime } from "@/lib/church-time";
import { ACCEPTED_IMAGE_TYPES, prepareImage } from "@/lib/prepare-image";

type AnnouncementFormProps = {
  portal: PublishingPortal;
  basePath: string;
  /** The post being edited; omitted when creating. */
  initial?: Announcement;
  /** Fixes the post type and hides the picker. */
  lockedKind?: AnnouncementKind;
  /** Which page the save returns to. */
  destination?: "events" | "feed";
};

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100";
const labelClass = "grid gap-1.5 text-sm font-medium text-slate-700";

export function AnnouncementForm({
  portal,
  basePath,
  initial,
  lockedKind,
  destination = "events",
}: AnnouncementFormProps) {
  const [kind, setKind] = useState<AnnouncementKind>(
    lockedKind ?? initial?.kind ?? "EVENT",
  );
  const [descriptionLength, setDescriptionLength] = useState(
    initial?.description?.length ?? 0,
  );
  /** A newly chosen flyer and its local preview URL. */
  const [newFlyer, setNewFlyer] = useState<{ file: File; url: string } | null>(
    null,
  );
  const [removeFlyer, setRemoveFlyer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Free the preview's memory once it is replaced or the form closes.
  useEffect(() => {
    if (!newFlyer) return;
    return () => URL.revokeObjectURL(newFlyer.url);
  }, [newFlyer]);

  const shownFlyer =
    newFlyer?.url ?? (removeFlyer ? null : (initial?.flyerUrl ?? null));
  const isEvent = kind === "EVENT";

  return (
    <form
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        const form = new FormData(event.currentTarget);
        const text = (name: string) => String(form.get(name) ?? "");
        startTransition(async () => {
          let flyer: SaveAnnouncementInput["flyer"] = removeFlyer
            ? { action: "remove" }
            : { action: "keep" };
          if (newFlyer) {
            try {
              flyer = {
                action: "replace",
                dataUrl: await prepareImage(newFlyer.file),
              };
            } catch (caught) {
              setError(
                caught instanceof Error
                  ? caught.message
                  : "The flyer could not be prepared.",
              );
              return;
            }
          }
          const result = await saveAnnouncement({
            portal,
            destination,
            id: initial?.id,
            kind,
            title: text("title"),
            theme: text("theme"),
            description: text("description"),
            locationName: text("locationName"),
            startsAt: text("startsAt"),
            endsAt: text("endsAt"),
            flyer,
          });
          // On success the action redirects back to the board; a returned
          // value means the save failed.
          if (result?.error) setError(result.error);
        });
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {initial
              ? "Edit post"
              : lockedKind === "ANNOUNCEMENT"
                ? "New feed post"
                : lockedKind === "EVENT"
                  ? "New church event"
                  : "New post"}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {kind === "ANNOUNCEMENT"
              ? "Members see this in the church feed and can react and comment."
              : "Members see this under church events. No attendance is taken."}
          </p>
        </div>
        <Link
          aria-label="Close the form"
          className="grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          href={basePath}
          scroll={false}
        >
          <FiX aria-hidden />
        </Link>
      </div>

      <fieldset className={lockedKind ? "hidden" : "mt-5"}>
        <legend className="text-sm font-medium text-slate-700">Type</legend>
        <div className="mt-1.5 inline-flex rounded-lg bg-slate-100 p-1">
          {(
            [
              ["EVENT", "Event"],
              ["ANNOUNCEMENT", "Announcement"],
            ] as const
          ).map(([value, label]) => (
            <label
              className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-slate-300 ${kind === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              key={value}
            >
              <input
                checked={kind === value}
                className="sr-only"
                name="kind"
                onChange={() => setKind(value)}
                type="radio"
                value={value}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_16rem]">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          <label className={`${labelClass} sm:col-span-2`}>
            Title
            <input
              className={inputClass}
              defaultValue={initial?.title}
              maxLength={180}
              name="title"
              placeholder={isEvent ? "Youth Night" : "New service times"}
              required
            />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            <span>
              Theme <span className="font-normal text-slate-400">(optional)</span>
            </span>
            <input
              className={inputClass}
              defaultValue={initial?.theme ?? ""}
              maxLength={180}
              name="theme"
              placeholder="Rooted in Christ"
            />
          </label>
          <label className={labelClass}>
            <span>
              Starts{" "}
              {isEvent ? null : (
                <span className="font-normal text-slate-400">(optional)</span>
              )}
            </span>
            <input
              className={inputClass}
              defaultValue={isoToChurchWallTime(initial?.startsAt ?? null)}
              name="startsAt"
              required={isEvent}
              type="datetime-local"
            />
          </label>
          <label className={labelClass}>
            <span>
              Ends <span className="font-normal text-slate-400">(optional)</span>
            </span>
            <input
              className={inputClass}
              defaultValue={isoToChurchWallTime(initial?.endsAt ?? null)}
              name="endsAt"
              type="datetime-local"
            />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            <span>
              Location{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </span>
            <input
              className={inputClass}
              defaultValue={initial?.locationName ?? ""}
              maxLength={200}
              name="locationName"
              placeholder="Main auditorium"
            />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            <span className="flex justify-between">
              <span>
                Description{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </span>
              <span className="text-xs font-normal text-slate-400">
                {descriptionLength}/2000
              </span>
            </span>
            <textarea
              className={`${inputClass} h-auto min-h-28 py-2 leading-6`}
              defaultValue={initial?.description ?? ""}
              maxLength={2000}
              name="description"
              onChange={(event) =>
                setDescriptionLength(event.currentTarget.value.length)
              }
              placeholder="A short note about what to expect."
            />
          </label>
        </div>

        <div className="grid content-start gap-2">
          <span className="text-sm font-medium text-slate-700">
            Flyer <span className="font-normal text-slate-400">(optional)</span>
          </span>
          <div className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
            {shownFlyer ? (
              // A local blob preview cannot go through next/image.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt="Flyer preview"
                className="size-full object-contain"
                src={shownFlyer}
              />
            ) : (
              <div className="px-4 text-center text-slate-400">
                <FiImage aria-hidden className="mx-auto text-3xl" />
                <p className="mt-2 text-xs">JPEG, PNG or WebP</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-slate-300">
              <FiUpload aria-hidden />
              {shownFlyer ? "Replace" : "Upload flyer"}
              <input
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                className="sr-only"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0] ?? null;
                  event.currentTarget.value = "";
                  if (file && !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
                    setError("Choose a JPEG, PNG, or WebP image.");
                    return;
                  }
                  setError(null);
                  setNewFlyer(
                    file ? { file, url: URL.createObjectURL(file) } : null,
                  );
                  setRemoveFlyer(false);
                }}
                type="file"
              />
            </label>
            {shownFlyer ? (
              <button
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={() => {
                  setNewFlyer(null);
                  setRemoveFlyer(true);
                }}
                type="button"
              >
                <FiTrash2 aria-hidden />
                Remove
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <p
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
        <Link
          className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          href={basePath}
          scroll={false}
        >
          Cancel
        </Link>
        <button
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? <FiLoader aria-hidden className="animate-spin" /> : null}
          {pending ? "Saving…" : initial ? "Save changes" : "Publish"}
        </button>
      </div>
    </form>
  );
}
