export function toError(err: unknown, fallback = 'Đã xảy ra lỗi') {
  if (err instanceof Error) return err;

  if (typeof err === 'string') return new Error(err);

  const anyErr = err as any;

  const msg =
    anyErr?.context?.body?.message ||
    anyErr?.message ||
    anyErr?.error_description ||
    anyErr?.error ||
    fallback;

  const e = new Error(String(msg));

  // keep original for debugging
  (e as any).cause = err;

  return e;
}