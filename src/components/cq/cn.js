/** Tiny class joiner. Falsy values drop out. */
export const cn = (...parts) => parts.filter(Boolean).join(' ');
