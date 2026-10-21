import { Fraction } from '../types/game';

/**
 * Greatest Common Divisor
 */
export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x || 1;
}

/**
 * Simplify fraction to canonical form (denominator > 0)
 */
export function simplifyFraction(frac: Fraction): Fraction {
  if (frac.den === 0) {
    throw new Error('Mẫu số phải khác 0!');
  }
  if (frac.num === 0) {
    return { num: 0, den: 1 };
  }
  let num = frac.num;
  let den = frac.den;
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const d = gcd(num, den);
  return {
    num: Math.round(num / d),
    den: Math.round(den / d),
  };
}

/**
 * Safe parser for rational number input from user.
 * Accepts:
 * - Integer: "4", "-3", "0"
 * - Fraction: "3/4", "-3/4", "6/8", "3/-4"
 * - Decimal with dot or comma: "0.75", "0,75", "-1.5", "-1,5"
 * - Mixed fraction: "1 1/2", "-1 3/4"
 */
export interface ParseResult {
  isValid: boolean;
  fraction?: Fraction;
  decimalValue?: number;
  errorMessage?: string;
}

export function parseRationalInput(input: string): ParseResult {
  if (!input || !input.trim()) {
    return { isValid: false, errorMessage: 'Vui lòng nhập đáp án!' };
  }

  // Normalize string: replace commas with dots, trim spaces, replace unicode minus
  let s = input.trim()
    .replace(/[\u2212\u2013\u2014]/g, '-') // Replace unicode minus & dashes
    .replace(/\s+/g, ' ');

  // Strip common variable prefixes like "x =", "x=", "n =", "n="
  s = s.replace(/^[xXnNmM]\s*=\s*/, '');

  // Strip common units like "°C", "độ C", "độ", "nhịp", "vòng", "đơn vị"
  s = s.replace(/\s*(°C|độ C|độ|nhịp|vòng|đơn vị)$/i, '').trim();

  // Check for dangerous or forbidden characters (NO eval!)
  if (/[a-zA-Z;$:&|!<>{}()^]/.test(s.replace(/[\/,\.-]/g, ''))) {
    return {
      isValid: false,
      errorMessage: 'Chỉ chấp nhận số nguyên, phân số (ví dụ: -3/4) hoặc số thập phân!',
    };
  }

  // Mixed number e.g. "1 1/2" or "-1 3/4"
  const mixedMatch = s.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const num = parseInt(mixedMatch[2], 10);
    const den = parseInt(mixedMatch[3], 10);
    if (den === 0) {
      return { isValid: false, errorMessage: 'Mẫu số không được bằng 0!' };
    }
    const sign = whole < 0 ? -1 : 1;
    const finalNum = sign * (Math.abs(whole) * den + num);
    const frac = simplifyFraction({ num: finalNum, den });
    return {
      isValid: true,
      fraction: frac,
      decimalValue: frac.num / frac.den,
    };
  }

  // Fraction format e.g. "3/4" or "-6/8"
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length !== 2) {
      return { isValid: false, errorMessage: 'Định dạng phân số không hợp lệ (ví dụ đúng: -3/4)!' };
    }
    const numStr = parts[0].trim().replace(',', '.');
    const denStr = parts[1].trim().replace(',', '.');

    const num = parseFloat(numStr);
    const den = parseFloat(denStr);

    if (isNaN(num) || isNaN(den)) {
      return { isValid: false, errorMessage: 'Tử số và mẫu số phải là số!' };
    }
    if (Math.abs(den) < 1e-9) {
      return { isValid: false, errorMessage: 'Mẫu số không thể bằng 0!' };
    }

    // Convert decimal in fraction if any (e.g. 1.5/2 -> 3/4)
    let n = num;
    let d = den;
    while (!Number.isInteger(n) || !Number.isInteger(d)) {
      n *= 10;
      d *= 10;
    }
    const frac = simplifyFraction({ num: n, den: d });
    return {
      isValid: true,
      fraction: frac,
      decimalValue: frac.num / frac.den,
    };
  }

  // Decimal or integer format e.g. "-0.75" or "-0,75" or "5"
  const normalizedDecimal = s.replace(',', '.');
  const dec = parseFloat(normalizedDecimal);
  if (isNaN(dec)) {
    return { isValid: false, errorMessage: 'Số nhập vào không hợp lệ!' };
  }

  // Convert decimal to exact fraction
  let d = 1;
  let n = dec;
  let safety = 0;
  while (!Number.isInteger(n) && safety < 8) {
    n *= 10;
    d *= 10;
    n = Math.round(n * 1e6) / 1e6; // avoid float drift
    safety++;
  }
  const frac = simplifyFraction({ num: Math.round(n), den: d });

  return {
    isValid: true,
    fraction: frac,
    decimalValue: dec,
  };
}

/**
 * Check if two rational values are equivalent (e.g. 3/2 and 6/4 and 1.5)
 */
export function areFractionsEquivalent(f1: Fraction, f2: Fraction): boolean {
  if (f1.den === 0 || f2.den === 0) return false;
  // Cross-multiplication: a*d == b*c
  return BigInt(f1.num) * BigInt(f2.den) === BigInt(f2.num) * BigInt(f1.den);
}

/**
 * Format fraction nicely for display in Vietnamese math notation
 */
export function formatFractionText(frac: Fraction): string {
  const simplified = simplifyFraction(frac);
  if (simplified.den === 1) {
    return `${simplified.num}`;
  }
  return `${simplified.num}/${simplified.den}`;
}

/**
 * Diagnostic helper: Explains the exact difference between two rational numbers
 * for student feedback when they make an error.
 */
export function diagnoseRationalError(studentFrac: Fraction, expectedFrac: Fraction): string {
  const s = simplifyFraction(studentFrac);
  const e = simplifyFraction(expectedFrac);

  // Exact match
  if (areFractionsEquivalent(s, e)) {
    return 'Chính xác hoàn toàn!';
  }

  // Opposite sign error (Số đối)
  if (s.num === -e.num && s.den === e.den) {
    return 'Em đã nhầm dấu âm/dương! Đáp án đúng có dấu ngược lại.';
  }

  // Inverted fraction error (Nghịch đảo)
  if (s.num === e.den && s.den === e.num) {
    return 'Em đang đảo ngược tử số và mẫu số.';
  }

  // Magnitude comparison
  const sDec = s.num / s.den;
  const eDec = e.num / e.den;
  if (sDec < eDec) {
    return `Giá trị em chọn (${formatFractionText(s)}) nhỏ hơn giá trị cần tìm (${formatFractionText(e)}). Hãy kiểm tra lại phép tính!`;
  } else {
    return `Giá trị em chọn (${formatFractionText(s)}) lớn hơn giá trị cần tìm (${formatFractionText(e)}). Hãy kiểm tra lại phép tính!`;
  }
}
