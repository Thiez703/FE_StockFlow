// Định dạng số tiền theo chuẩn Việt Nam, vd: 1250000 -> "1.250.000 ₫".
export function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

// Định dạng số có phân tách hàng nghìn, vd: 12000 -> "12.000".
export function formatNumber(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value) || 0);
}
