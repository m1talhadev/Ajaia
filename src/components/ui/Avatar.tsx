const SIZES = { sm: "h-8 w-8 text-xs", md: "h-9 w-9 text-sm" };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function Avatar({ name, size = "md" }: { name: string; size?: keyof typeof SIZES }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-800 ${SIZES[size]}`}>
      {initials(name)}
    </span>
  );
}
