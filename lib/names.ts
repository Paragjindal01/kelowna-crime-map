// Display-name safety validation, enforced server-side on signup and on
// admin renames. Public posts show only this display name — never the email.

const RESERVED_TERMS = [
  "admin", "administrator", "moderator", "mod", "support", "staff",
  "official", "safekelowna", "geodash", "rcmp", "police", "cityofkelowna",
  "city of kelowna", "kelowna police", "emergency", "911", "bylaw",
  "government", "verified",
];

// Common obscenities / slurs blocklist (substring match, lowercased).
// Deliberately short — moderation handles the long tail via admin rename.
const BLOCKED_TERMS = [
  "fuck", "shit", "cunt", "bitch", "nigger", "nigga", "faggot", "retard",
  "whore", "slut", "rapist", "nazi", "hitler", "pedo",
];

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE_RE = /(\+?\d[\d\s().-]{6,}\d)/;
const URL_RE = /(https?:\/\/|www\.|\.(com|net|org|ca|io)\b)/i;
const ALLOWED_CHARS_RE = /^[\p{L}\p{N} '\-_.]+$/u;

type NameResult = { ok: boolean; name: string; error: string };

const bad = (error: string): NameResult => ({ ok: false, name: "", error });

/**
 * Validates and normalizes a public display name.
 * Returns { ok: true, name } with the cleaned name, or { ok: false, error }.
 */
export function validateDisplayName(raw: unknown): NameResult {
  // Trim and collapse repeated whitespace.
  const name = String(raw ?? "").trim().replace(/\s+/g, " ");
  const lower = name.toLowerCase();

  if (name.length < 2 || name.length > 40) {
    return bad("Display name must be 2–40 characters");
  }
  if (!ALLOWED_CHARS_RE.test(name)) {
    return bad("Display name can only use letters, numbers, spaces, hyphens, underscores, apostrophes, and periods");
  }
  if (EMAIL_RE.test(name) || URL_RE.test(name)) {
    return bad("Display names can't contain email addresses or links");
  }
  if (PHONE_RE.test(name)) {
    return bad("Display names can't contain phone numbers");
  }
  for (const term of RESERVED_TERMS) {
    if (lower === term || lower.includes(term)) {
      return bad("That name is reserved or could be mistaken for an official account — please choose another");
    }
  }
  for (const term of BLOCKED_TERMS) {
    if (lower.includes(term)) {
      return bad("That name isn't appropriate for a community platform — please choose another");
    }
  }
  return { ok: true, name, error: "" };
}
