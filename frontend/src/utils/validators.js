export function isRequired(value) {
  return value !== null && value !== undefined && value.toString().trim() !== '';
}

export function isPositiveNumber(value) {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
}

export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}