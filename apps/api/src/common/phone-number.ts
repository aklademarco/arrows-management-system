export const GHANA_E164_PHONE_PATTERN = /^\+233\d{9}$/;

const PHONE_INPUT_PATTERN = /^[\d\s()+.-]+$/;

export function normalizeGhanaPhoneNumber(value: unknown): unknown {
  if (value === null || value === undefined || typeof value !== 'string') {
    return value;
  }

  const input = value.trim();
  if (!input) return undefined;
  if (!PHONE_INPUT_PATTERN.test(input)) return input;

  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);

  // People commonly write the national trunk prefix after +233.
  if (digits.startsWith('2330') && digits.length === 13) {
    digits = `233${digits.slice(4)}`;
  } else if (digits.startsWith('0') && digits.length === 10) {
    digits = `233${digits.slice(1)}`;
  } else if (digits.length === 9) {
    digits = `233${digits}`;
  }

  const normalized = `+${digits}`;
  return GHANA_E164_PHONE_PATTERN.test(normalized) ? normalized : input;
}
