/**
 * Dữ liệu cảnh báo: hàng tồn dưới định mức và hàng cận hạn.
 * `daysLeft` để trống — trang Cảnh báo tự tính từ expDate (utils/date.js) để luôn nhất quán.
 */
export const LOW_STOCK = [
  { productName: 'Coca-Cola lon 330ml', sku: 'CC-COKE-330', unit: 'Lon', onHand: 520, minStock: 600, location: 'B-01-01' },
  { productName: 'Sting Dâu chai 330ml', sku: 'STING-DAU-330', unit: 'Chai', onHand: 0, minStock: 480, location: 'B-02-03' },
  { productName: '7Up lon 330ml', sku: '7UP-330', unit: 'Lon', onHand: 394, minStock: 360, location: 'B-01-03' },
  { productName: 'Trà Ô Long TEA+ chai 455ml', sku: 'TEA-PLUS-455', unit: 'Chai', onHand: 251, minStock: 240, location: 'B-03-01' },
  { productName: 'Bia Heineken lon 330ml', sku: 'BIA-HEINEKEN-330', unit: 'Lon', onHand: 640, minStock: 600, location: 'A-02-01' },
];

export const NEAR_EXPIRY = [
  { productName: 'Sting Dâu chai 330ml', lot: 'L2311-ST', unit: 'Chai', quantity: 180, expDate: '2026-07-12' },
  { productName: 'Trà Ô Long TEA+ chai 455ml', lot: 'L2401-TEA', unit: 'Chai', quantity: 260, expDate: '2026-07-28' },
  { productName: 'Coca-Cola lon 330ml', lot: 'L2401-CC', unit: 'Lon', quantity: 520, expDate: '2026-07-30' },
  { productName: 'Bia Heineken lon 330ml', lot: 'L2312-HK', unit: 'Lon', quantity: 640, expDate: '2026-08-05' },
  { productName: '7Up lon 330ml', lot: 'L2404-7UP', unit: 'Lon', quantity: 430, expDate: '2026-08-15' },
  { productName: 'Pepsi lon 330ml', lot: 'L2402-PP', unit: 'Lon', quantity: 880, expDate: '2026-08-25' },
];
