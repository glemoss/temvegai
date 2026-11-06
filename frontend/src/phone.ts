// Phones are stored as digits, area code first: 10 for a landline and 11
// for a mobile.

// What has been typed so far, formatted as "(48) 3333-4444" or
// "(48) 99999-8888". Up to 10 digits it reads as a landline, and the 11th
// turns it into a mobile; digits past the 11th are dropped.
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) {
    return digits && `(${digits}`;
  }
  const areaCode = digits.slice(0, 2);
  const number = digits.slice(2);
  if (number.length <= 4) {
    return `(${areaCode}) ${number}`;
  }
  const split = digits.length === 11 ? 5 : 4;
  return `(${areaCode}) ${number.slice(0, split)}-${number.slice(split)}`;
}

// A stored phone as people read it. One without 10 or 11 digits, left as
// it was by the migration to digits, is shown as it is.
export function displayPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return /^\d{10,11}$/.test(digits) ? maskPhone(digits) : phone;
}
