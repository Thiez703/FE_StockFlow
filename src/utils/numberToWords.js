/**
 * Đọc số tiền thành chữ tiếng Việt — dòng "Tổng số tiền (viết bằng chữ)" bắt buộc
 * có trên phiếu nhập/xuất kho in ra giấy.
 */

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const SCALES = ['', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ', ' triệu tỷ'];

/**
 * Đọc một nhóm 3 chữ số. `full` = true khi nhóm đứng sau nhóm khác nên phải đọc
 * đủ cả hàng trăm ("một nghìn không trăm linh năm").
 */
function readGroup(n, full) {
  const hundred = Math.floor(n / 100);
  const ten = Math.floor((n % 100) / 10);
  const unit = n % 10;
  let out = '';

  if (hundred > 0 || full) out += `${DIGITS[hundred]} trăm`;

  if (ten === 0) {
    if (unit > 0) out += out ? ` linh ${DIGITS[unit]}` : DIGITS[unit];
  } else if (ten === 1) {
    out += out ? ' mười' : 'mười';
    if (unit === 5) out += ' lăm';
    else if (unit > 0) out += ` ${DIGITS[unit]}`;
  } else {
    out += `${out ? ' ' : ''}${DIGITS[ten]} mươi`;
    if (unit === 1) out += ' mốt';
    else if (unit === 4) out += ' tư';
    else if (unit === 5) out += ' lăm';
    else if (unit > 0) out += ` ${DIGITS[unit]}`;
  }

  return out.trim();
}

/**
 * 39840000 -> "Ba mươi chín triệu tám trăm bốn mươi nghìn đồng".
 */
export function readMoneyVi(amount) {
  let n = Math.round(Math.abs(Number(amount) || 0));
  const negative = Number(amount) < 0;
  if (n === 0) return 'Không đồng';

  // Tách thành các nhóm 3 chữ số từ phải sang trái.
  const groups = [];
  while (n > 0) {
    groups.unshift(n % 1000);
    n = Math.floor(n / 1000);
  }

  const parts = groups
    .map((g, i) => {
      const scale = SCALES[groups.length - 1 - i] ?? '';
      if (g === 0) return '';
      return readGroup(g, i > 0) + scale;
    })
    .filter(Boolean);

  const text = parts.join(' ').replace(/\s+/g, ' ').trim();
  const sentence = `${negative ? 'Âm ' : ''}${text} đồng`;
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
