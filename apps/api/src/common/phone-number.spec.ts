import {
  GHANA_E164_PHONE_PATTERN,
  normalizeGhanaPhoneNumber,
} from './phone-number';

describe('normalizeGhanaPhoneNumber', () => {
  it.each([
    ['0241234567', '+233241234567'],
    ['024 123 4567', '+233241234567'],
    ['024-123-4567', '+233241234567'],
    ['(024) 123 4567', '+233241234567'],
    ['241234567', '+233241234567'],
    ['233241234567', '+233241234567'],
    ['+233 24 123 4567', '+233241234567'],
    ['00233 24 123 4567', '+233241234567'],
    ['+233 (0) 24 123 4567', '+233241234567'],
  ])('normalizes %s', (input, expected) => {
    expect(normalizeGhanaPhoneNumber(input)).toBe(expected);
    expect(expected).toMatch(GHANA_E164_PHONE_PATTERN);
  });

  it.each(['123', '+2348012345678', '024ABC4567', '024123456789'])(
    'leaves invalid input for the validator to reject: %s',
    (input) => {
      expect(normalizeGhanaPhoneNumber(input)).toBe(input);
    },
  );

  it('preserves null and undefined and treats blank input as omitted', () => {
    expect(normalizeGhanaPhoneNumber(null)).toBeNull();
    expect(normalizeGhanaPhoneNumber(undefined)).toBeUndefined();
    expect(normalizeGhanaPhoneNumber('   ')).toBeUndefined();
  });
});
