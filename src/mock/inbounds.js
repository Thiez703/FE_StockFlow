/**
 * Phiếu nhập kho. Trạng thái: POSTED (đã ghi sổ), PENDING (chờ duyệt), VOIDED (đã huỷ).
 * `total` = tổng tiền các dòng hàng (đã tính sẵn). Mã dạng PN-2026-0xxx.
 */
export const INBOUNDS = [
  {
    id: 'IN-142', code: 'PN-2026-0142', supplierId: 'NCC-001', supplierName: 'SABECO', warehouse: 'Kho Tổng — Bình Tân',
    date: '2026-07-17', createdBy: 'Thiên Nguyễn', status: 'POSTED', note: 'Nhập bia Tết trung tuần 7',
    items: [
      { productId: 'SP-001', productName: 'Bia Saigon Lager lon 330ml', lot: 'L2405-SG', unit: 'Thùng (lon)', quantity: 100, unitPrice: 240000 },
      { productId: 'SP-007', productName: 'Bia 333 lon 330ml', lot: 'L2312-333', unit: 'Thùng (lon)', quantity: 60, unitPrice: 264000 },
    ],
    total: 100 * 240000 + 60 * 264000,
  },
  {
    id: 'IN-141', code: 'PN-2026-0141', supplierId: 'NCC-002', supplierName: 'Heineken VN', warehouse: 'Kho Tổng — Bình Tân',
    date: '2026-07-16', createdBy: 'Thủ kho A', status: 'POSTED', note: '',
    items: [
      { productId: 'SP-005', productName: 'Bia Heineken lon 330ml', lot: 'L2312-HK', unit: 'Thùng (lon)', quantity: 80, unitPrice: 396000 },
    ],
    total: 80 * 396000,
  },
  {
    id: 'IN-140', code: 'PN-2026-0140', supplierId: 'NCC-003', supplierName: 'Suntory PepsiCo', warehouse: 'Kho Quận 7',
    date: '2026-07-15', createdBy: 'Thủ kho B', status: 'PENDING', note: 'Chờ kế toán duyệt',
    items: [
      { productId: 'SP-009', productName: 'Pepsi lon 330ml', lot: 'L2402-PP', unit: 'Thùng (lon)', quantity: 120, unitPrice: 180000 },
      { productId: 'SP-013', productName: 'Sting Dâu chai 330ml', lot: 'L2311-ST', unit: 'Két', quantity: 40, unitPrice: 216000 },
    ],
    total: 120 * 180000 + 40 * 216000,
  },
  {
    id: 'IN-139', code: 'PN-2026-0139', supplierId: 'NCC-004', supplierName: 'Coca-Cola VN', warehouse: 'Kho Tổng — Bình Tân',
    date: '2026-07-14', createdBy: 'Thiên Nguyễn', status: 'POSTED', note: '',
    items: [
      { productId: 'SP-008', productName: 'Coca-Cola lon 330ml', lot: 'L2401-CC', unit: 'Thùng (lon)', quantity: 150, unitPrice: 192000 },
      { productId: 'SP-011', productName: 'Sprite lon 330ml', lot: 'L2404-7UP', unit: 'Thùng (lon)', quantity: 50, unitPrice: 192000 },
    ],
    total: 150 * 192000 + 50 * 192000,
  },
  {
    id: 'IN-138', code: 'PN-2026-0138', supplierId: 'NCC-001', supplierName: 'SABECO', warehouse: 'Kho Thủ Đức',
    date: '2026-07-12', createdBy: 'Thủ kho A', status: 'VOIDED', note: 'Huỷ do sai nhà cung cấp',
    items: [
      { productId: 'SP-002', productName: 'Bia Saigon Special lon 330ml', lot: 'L2405-SG', unit: 'Thùng (lon)', quantity: 40, unitPrice: 300000 },
    ],
    total: 40 * 300000,
  },
  {
    id: 'IN-137', code: 'PN-2026-0137', supplierId: 'NCC-002', supplierName: 'Heineken VN', warehouse: 'Kho Tổng — Bình Tân',
    date: '2026-07-11', createdBy: 'Thủ kho B', status: 'POSTED', note: '',
    items: [
      { productId: 'SP-003', productName: 'Bia Tiger Bạc lon 330ml', lot: 'L2404-TG', unit: 'Thùng (lon)', quantity: 90, unitPrice: 384000 },
      { productId: 'SP-006', productName: 'Bia Heineken Silver lon 330ml', lot: 'L2312-HK', unit: 'Thùng (lon)', quantity: 45, unitPrice: 408000 },
    ],
    total: 90 * 384000 + 45 * 408000,
  },
  {
    id: 'IN-136', code: 'PN-2026-0136', supplierId: 'NCC-005', supplierName: 'La Vie', warehouse: 'Kho Quận 7',
    date: '2026-07-10', createdBy: 'Thiên Nguyễn', status: 'PENDING', note: '',
    items: [
      { productId: 'SP-016', productName: 'Lavie 500ml', lot: 'L2405-LV', unit: 'Thùng (chai)', quantity: 200, unitPrice: 66000 },
    ],
    total: 200 * 66000,
  },
  {
    id: 'IN-135', code: 'PN-2026-0135', supplierId: 'NCC-003', supplierName: 'Suntory PepsiCo', warehouse: 'Kho Tổng — Bình Tân',
    date: '2026-07-08', createdBy: 'Thủ kho A', status: 'POSTED', note: '',
    items: [
      { productId: 'SP-014', productName: 'Red Bull lon 250ml', lot: 'L2403-RB', unit: 'Thùng (lon)', quantity: 70, unitPrice: 336000 },
    ],
    total: 70 * 336000,
  },
];
