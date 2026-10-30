export async function copyPageLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
  } catch {
    throw new Error("Couldn't copy the link. Copy it from the address bar instead.");
  }
}
