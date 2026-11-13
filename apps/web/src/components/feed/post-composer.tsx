"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";
import {
  FiArrowLeft,
  FiCalendar,
  FiImage,
  FiMapPin,
  FiTag,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import {
  saveAnnouncement,
  type SaveAnnouncementInput,
} from "@/app/announcement-actions";
import type { Announcement, PublishingPortal } from "@/lib/announcements";
import { isoToChurchWallTime } from "@/lib/church-time";
import { ACCEPTED_IMAGE_TYPES, prepareImage } from "@/lib/prepare-image";

import { Sheet, SheetHeader, sheetOption } from "./sheet";

const TITLE_MAX = 180;
const CAPTION_MAX = 2000;

type Step = "select" | "details";

/**
 * Instagram-style create flow: pick a photo, then add a title and caption,
 * then Share. Also edits an existing feed post.
 */
export function PostComposer({
  portal,
  editing,
  closeHref,
}: {
  portal: PublishingPortal;
  editing: Announcement | null;
  closeHref: string;
}) {
  const router = useRouter();
  const titleId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>(editing ? "details" : "select");
  /** A newly chosen photo and its local preview URL. */
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState(editing?.title ?? "");
  const [caption, setCaption] = useState(editing?.description ?? "");
  const [theme, setTheme] = useState(editing?.theme ?? "");
  const [location, setLocation] = useState(editing?.locationName ?? "");
  const [startsAt, setStartsAt] = useState(
    isoToChurchWallTime(editing?.startsAt ?? null),
  );
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharing, startSharing] = useTransition();

  // Free the preview's memory once it is replaced or the composer closes.
  useEffect(() => {
    if (!photo) return;
    return () => URL.revokeObjectURL(photo.url);
  }, [photo]);

  const existingPhoto = removeExisting ? null : (editing?.flyerUrl ?? null);
  const shownPhoto = photo?.url ?? existingPhoto;
  const dirty =
    Boolean(photo) ||
    removeExisting ||
    title !== (editing?.title ?? "") ||
    caption !== (editing?.description ?? "") ||
    theme !== (editing?.theme ?? "") ||
    location !== (editing?.locationName ?? "") ||
    startsAt !== isoToChurchWallTime(editing?.startsAt ?? null);

  const close = () => {
    // The discard sheet handles its own Escape.
    if (sharing || confirmDiscard) return;
    if (dirty) setConfirmDiscard(true);
    else router.push(closeHref);
  };

  // Escape closes the composer, as it would close an app's modal.
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const choose = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("Choose a JPEG, PNG, or WebP photo.");
      return;
    }
    setError(null);
    setPhoto({ file, url: URL.createObjectURL(file) });
    setStep("details");
  };

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    choose(event.currentTarget.files?.[0]);
    event.currentTarget.value = "";
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    choose(event.dataTransfer.files[0]);
  };

  const removePhoto = () => {
    setPhoto(null);
    if (editing?.flyerUrl) setRemoveExisting(true);
  };

  const share = () => {
    setError(null);
    startSharing(async () => {
      let flyer: SaveAnnouncementInput["flyer"] =
        removeExisting && !photo ? { action: "remove" } : { action: "keep" };
      if (photo) {
        try {
          flyer = { action: "replace", dataUrl: await prepareImage(photo.file) };
        } catch (caught) {
          setError(
            caught instanceof Error ? caught.message : "The photo could not be prepared.",
          );
          return;
        }
      }
      const result = await saveAnnouncement({
        portal,
        destination: "feed",
        id: editing?.id,
        kind: "ANNOUNCEMENT",
        title,
        theme,
        description: caption,
        locationName: location,
        startsAt,
        // An end time needs a start time; keep the saved one only alongside it.
        endsAt: startsAt ? isoToChurchWallTime(editing?.endsAt ?? null) : "",
        flyer,
      });
      // On success the action redirects to the feed.
      if (result?.error) setError(result.error);
    });
  };

  const canShare = title.trim().length > 0 && !sharing;
  const heading =
    step === "select" ? "Create new post" : editing ? "Edit post" : "New post";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={`relative flex h-full w-full flex-col overflow-hidden bg-white text-slate-900 shadow-2xl sm:h-[min(88vh,720px)] sm:rounded-xl ${
          step === "select" ? "sm:max-w-[640px]" : "sm:max-w-[980px]"
        }`}
        role="dialog"
      >
        <header className="grid h-12 shrink-0 grid-cols-[4rem_1fr_4rem] items-center border-b border-slate-200 px-2">
          {step === "details" && !editing ? (
            <button
              aria-label="Back to choosing a photo"
              className="grid size-10 place-items-center rounded-full text-[22px] hover:bg-slate-100"
              disabled={sharing}
              onClick={() => setStep("select")}
              type="button"
            >
              <FiArrowLeft aria-hidden />
            </button>
          ) : (
            <button
              aria-label="Close"
              className="grid size-10 place-items-center rounded-full text-[22px] hover:bg-slate-100"
              onClick={close}
              type="button"
            >
              <FiX aria-hidden />
            </button>
          )}
          <h1 className="text-center text-base font-semibold" id={titleId}>
            {heading}
          </h1>
          {step === "details" ? (
            <button
              className="justify-self-end px-2 text-sm font-bold text-black transition hover:text-slate-500 disabled:text-slate-300"
              disabled={!canShare}
              onClick={share}
              type="button"
            >
              {editing ? "Save" : "Share"}
            </button>
          ) : (
            <span />
          )}
        </header>

        <input
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          className="sr-only"
          onChange={onFile}
          ref={fileInput}
          tabIndex={-1}
          type="file"
        />

        {step === "select" ? (
          <div
            className={`flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center transition ${dragging ? "bg-slate-100" : ""}`}
            onDragLeave={() => setDragging(false)}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDrop={onDrop}
          >
            <span aria-hidden className="relative h-24 w-28 text-slate-900">
              <FiImage className="absolute left-0 top-3 -rotate-6 text-[72px]" />
              <FiImage className="absolute right-0 top-0 rotate-6 bg-white text-[72px]" />
            </span>
            <p className="text-xl">
              <span className="hidden sm:inline">Drag a photo here</span>
              <span className="sm:hidden">Choose a photo to share</span>
            </p>
            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            <button
              className="h-9 rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={() => fileInput.current?.click()}
              type="button"
            >
              Select from device
            </button>
            <button
              className="text-sm font-semibold text-slate-500 transition hover:text-slate-900"
              onClick={() => {
                setError(null);
                setStep("details");
              }}
              type="button"
            >
              Post without a photo
            </button>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:overflow-hidden">
            {/* Preview */}
            <div className="relative shrink-0 bg-black">
              {shownPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                <img
                  alt="Preview of your photo"
                  className="mx-auto aspect-square max-h-[45vh] w-full object-contain lg:aspect-auto lg:h-full lg:max-h-none"
                  src={shownPhoto}
                />
              ) : (
                <div className="grid aspect-square max-h-[45vh] w-full place-items-center px-8 text-center text-white lg:aspect-auto lg:h-full lg:max-h-none">
                  <p
                    className={`text-balance text-2xl font-bold leading-tight sm:text-3xl ${title.trim() ? "" : "text-white/40"}`}
                  >
                    {title.trim() || "Your title appears here"}
                  </p>
                </div>
              )}
              <div className="absolute bottom-3 left-3 flex gap-2">
                <button
                  className="flex h-9 items-center gap-2 rounded-full bg-black/70 px-3 text-xs font-semibold text-white backdrop-blur transition hover:bg-black"
                  onClick={() => fileInput.current?.click()}
                  type="button"
                >
                  <FiImage aria-hidden />
                  {shownPhoto ? "Change photo" : "Add photo"}
                </button>
                {shownPhoto ? (
                  <button
                    aria-label="Remove photo"
                    className="grid size-9 place-items-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-black"
                    onClick={removePhoto}
                    type="button"
                  >
                    <FiTrash2 aria-hidden />
                  </button>
                ) : null}
              </div>
            </div>

            {/* Details */}
            <div className="flex min-h-0 flex-col lg:overflow-y-auto">
              {error ? (
                <p className="bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="px-4 pt-4">
                <label className="sr-only" htmlFor="post-title">
                  Title
                </label>
                <input
                  autoFocus
                  className="w-full bg-transparent text-lg font-semibold outline-none placeholder:text-slate-400"
                  id="post-title"
                  maxLength={TITLE_MAX}
                  onChange={(event) => setTitle(event.currentTarget.value)}
                  placeholder="Add a title…"
                  value={title}
                />
                <label className="sr-only" htmlFor="post-caption">
                  Caption
                </label>
                <textarea
                  className="field-sizing-content mt-2 min-h-36 w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-slate-400"
                  id="post-caption"
                  maxLength={CAPTION_MAX}
                  onChange={(event) => setCaption(event.currentTarget.value)}
                  placeholder="Write a caption…"
                  value={caption}
                />
                <p className="pb-3 text-right text-xs text-slate-400">
                  {caption.length.toLocaleString()}/{CAPTION_MAX.toLocaleString()}
                </p>
              </div>

              <div className="border-t border-slate-200">
                <OptionRow icon={<FiTag aria-hidden />} label="Add theme">
                  <input
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-900"
                    maxLength={180}
                    onChange={(event) => setTheme(event.currentTarget.value)}
                    placeholder="Add theme"
                    value={theme}
                  />
                </OptionRow>
                <OptionRow icon={<FiMapPin aria-hidden />} label="Add location">
                  <input
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-900"
                    maxLength={200}
                    onChange={(event) => setLocation(event.currentTarget.value)}
                    placeholder="Add location"
                    value={location}
                  />
                </OptionRow>
                <OptionRow icon={<FiCalendar aria-hidden />} label="Add date and time">
                  <input
                    className={`w-full bg-transparent text-sm outline-none ${startsAt ? "" : "text-slate-400"}`}
                    onChange={(event) => setStartsAt(event.currentTarget.value)}
                    type="datetime-local"
                    value={startsAt}
                  />
                </OptionRow>
              </div>
              <p className="px-4 py-3 text-xs leading-5 text-slate-500">
                Your post appears in the church feed. Members can react and
                comment.
              </p>
            </div>
          </div>
        )}

        {sharing ? (
          <div
            aria-live="polite"
            className="absolute inset-0 z-10 grid place-items-center bg-white/90"
            role="status"
          >
            <div className="text-center">
              <span
                aria-hidden
                className="mx-auto block size-16 animate-spin rounded-full border-4 border-slate-200 border-t-black"
              />
              <p className="mt-4 text-lg font-semibold">
                {editing ? "Saving…" : "Sharing…"}
              </p>
            </div>
          </div>
        ) : null}
      </section>

      <Sheet
        label="Discard post?"
        onClose={() => setConfirmDiscard(false)}
        open={confirmDiscard}
      >
        <SheetHeader
          detail="If you leave, your changes won't be saved."
          title={editing ? "Discard changes?" : "Discard post?"}
        />
        <button
          className={sheetOption("danger")}
          onClick={() => router.push(closeHref)}
          type="button"
        >
          Discard
        </button>
        <button
          className={sheetOption()}
          onClick={() => setConfirmDiscard(false)}
          type="button"
        >
          Cancel
        </button>
      </Sheet>
    </div>
  );
}

/** A tappable settings-style row, like Instagram's "Add location". */
function OptionRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex min-h-12 items-center gap-3 border-b border-slate-200 px-4 text-lg text-slate-900 focus-within:bg-slate-50">
      <span className="sr-only">{label}</span>
      {icon}
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  );
}
