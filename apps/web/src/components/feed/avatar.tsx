/** Small round photo, or initials when there is none. */
export function Avatar({
  name,
  photoUrl,
  size = "md",
}: {
  name: string | null;
  photoUrl: string | null;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "size-8 text-[11px]" : "size-10 text-xs";
  const initials =
    (name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote member photos
      <img
        alt=""
        className={`${box} shrink-0 rounded-full object-cover`}
        src={photoUrl}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`${box} grid shrink-0 place-items-center rounded-full bg-slate-100 font-semibold text-slate-600`}
    >
      {initials}
    </span>
  );
}
