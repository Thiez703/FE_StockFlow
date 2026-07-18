/**
 * Phiếu kiểm kê. Trạng thái: PENDING (chờ duyệt) / APPROVED (đã duyệt) / REJECTED (từ chối).
 * Mỗi dòng có `systemQty` (tồn hệ thống) và `countedQty` (đếm thực tế); chênh lệch = counted - system.
 * Mã dạng KK-2026-0xxx.
 */
export const STOCKTAKES = [
  {
    id: 'ST-007', code: 'KK-2026-0007', warehouse: 'Kho Tổng — Bình Tân', date: '2026-07-17',
    status: 'PENDING', createdBy: 'Thủ kho A', note: 'Kiểm kê định kỳ khu A',
    items: [
      { productName: 'Bia Saigon Lager lon 330ml', lot: 'L2405-SG', unit: 'Lon', systemQty: 3200, countedQty: 3188 },
      { productName: 'Bia Tiger Bạc lon 330ml', lot: 'L2404-TG', unit: 'Lon', systemQty: 4100, countedQty: 4100 },
      { productName: 'Bia 333 lon 330ml', lot: 'L2312-333', unit: 'Lon', systemQty: 980, countedQty: 995 },
    ],
  },
  {
    id: 'ST-006', code: 'KK-2026-0006', warehouse: 'Kho Quận 7', date: '2026-07-14',
    status: 'APPROVED', createdBy: 'Thủ kho B', note: '',
    items: [
      { productName: 'Pepsi lon 330ml', lot: 'L2402-PP', unit: 'Lon', systemQty: 880, countedQty: 872 },
      { productName: 'Coca-Cola lon 330ml', lot: 'L2401-CC', unit: 'Lon', systemQty: 520, countedQty: 520 },
    ],
  },
  {
    id: 'ST-005', code: 'KK-2026-0005', warehouse: 'Kho Tổng — Bình Tân', date: '2026-07-10',
    status: 'REJECTED', createdBy: 'Bán hàng C', note: 'Số liệu chưa khớp, kiểm lại',
    items: [
      { productName: 'Aquafina 500ml', lot: 'L2405-AQ', unit: 'Chai', systemQty: 6400, countedQty: 6100 },
    ],
  },
  {
    id: 'ST-004', code: 'KK-2026-0004', warehouse: 'Kho Thủ Đức', date: '2026-07-05',
    status: 'APPROVED', createdBy: 'Thủ kho A', note: '',
    items: [
      { productName: 'Red Bull lon 250ml', lot: 'L2403-RB', unit: 'Lon', systemQty: 1500, countedQty: 1512 },
      { productName: 'Sting Dâu chai 330ml', lot: 'L2311-ST', unit: 'Chai', systemQty: 180, countedQty: 168 },
    ],
  },
];
