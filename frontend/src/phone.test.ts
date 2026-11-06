import { describe, expect, it } from 'vitest';
import { displayPhone, maskPhone } from './phone';

describe('maskPhone', () => {
  it.each([
    ['', ''],
    ['4', '(4'],
    ['48', '(48'],
    ['483', '(48) 3'],
    ['483333', '(48) 3333'],
    ['4833334', '(48) 3333-4'],
    ['4833334444', '(48) 3333-4444'],
    ['48999998888', '(48) 99999-8888'],
  ])('formats %s as %s', (typed, masked) => {
    expect(maskPhone(typed)).toBe(masked);
  });

  it('ignores the punctuation already typed', () => {
    expect(maskPhone('(48) 3333-44445')).toBe('(48) 33334-4445');
  });

  it('drops letters and digits past the 11th', () => {
    expect(maskPhone('48a999998888123')).toBe('(48) 99999-8888');
  });
});

describe('displayPhone', () => {
  it('formats a landline and a mobile', () => {
    expect(displayPhone('4833334444')).toBe('(48) 3333-4444');
    expect(displayPhone('48999998888')).toBe('(48) 99999-8888');
  });

  it('formats a phone saved with punctuation', () => {
    expect(displayPhone('48 99999 8888')).toBe('(48) 99999-8888');
  });

  it('shows a phone without 10 or 11 digits as it is', () => {
    expect(displayPhone('3333-44')).toBe('3333-44');
  });
});
