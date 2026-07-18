/**
 * Tồn kho hiện tại (theo SP × lô × vị trí) và Thẻ kho (sổ cái biến động, số dư dồn).
 * `value` = onHand × đơn giá vốn ước tính. Dùng cho trang Tra cứu tồn & Thẻ kho.
 */
export const INVENTORY = [
  { id: 'INV-01', productId: 'SP-001', productName: 'Bia Saigon Lager lon 330ml', sku: 'BIA-SG-LAGER-330', categoryName: 'Bia lon', lot: 'L2405-SG', location: 'A-01-01', unit: 'Lon', onHand: 3188, minStock: 480, value: 3188 * 10000 },
  { id: 'INV-02', productId: 'SP-003', productName: 'Bia Tiger Bạc lon 330ml', sku: 'BIA-TIGER-BAC-330', categoryName: 'Bia lon', lot: 'L2404-TG', location: 'A-01-02', unit: 'Lon', onHand: 4100, minStock: 720, value: 4100 * 15000 },
  { id: 'INV-03', productId: 'SP-005', productName: 'Bia Heineken lon 330ml', sku: 'BIA-HEINEKEN-330', categoryName: 'Bia lon', lot: 'L2312-HK', location: 'A-02-01', unit: 'Lon', onHand: 640, minStock: 600, value: 640 * 16500 },
  { id: 'INV-04', productId: 'SP-007', productName: 'Bia 333 lon 330ml', sku: 'BIA-333-330', categoryName: 'Bia lon', lot: 'L2312-333', location: 'A-01-03', unit: 'Lon', onHand: 995, minStock: 480, value: 995 * 11000 },
  { id: 'INV-05', productId: 'SP-008', productName: 'Coca-Cola lon 330ml', sku: 'CC-COKE-330', categoryName: 'Cola', lot: 'L2401-CC', location: 'B-01-01', unit: 'Lon', onHand: 520, minStock: 600, value: 520 * 8000 },
  { id: 'INV-06', productId: 'SP-009', productName: 'Pepsi lon 330ml', sku: 'PEPSI-330', categoryName: 'Cola', lot: 'L2402-PP', location: 'B-01-02', unit: 'Lon', onHand: 872, minStock: 600, value: 872 * 7500 },
  { id: 'INV-07', productId: 'SP-010', productName: '7Up lon 330ml', sku: '7UP-330', categoryName: 'Có gas khác', lot: 'L2404-7UP', location: 'B-01-03', unit: 'Lon', onHand: 394, minStock: 360, value: 394 * 7500 },
  { id: 'INV-08', productId: 'SP-013', productName: 'Sting Dâu chai 330ml', sku: 'STING-DAU-330', categoryName: 'Nước tăng lực', lot: 'L2311-ST', location: 'B-02-03', unit: 'Chai', onHand: 0, minStock: 480, value: 0 },
  { id: 'INV-09', productId: 'SP-014', productName: 'Red Bull lon 250ml', sku: 'REDBULL-250', categoryName: 'Nước tăng lực', lot: 'L2403-RB', location: 'A-03-02', unit: 'Lon', onHand: 1512, minStock: 300, value: 1512 * 12500 },
  { id: 'INV-10', productId: 'SP-015', productName: 'Aquafina 500ml', sku: 'AQUAFINA-500', categoryName: 'Nước suối', lot: 'L2405-AQ', location: 'C-01-01', unit: 'Chai', onHand: 6100, minStock: 720, value: 6100 * 4200 },
  { id: 'INV-11', productId: 'SP-016', productName: 'Lavie 500ml', sku: 'LAVIE-500', categoryName: 'Nước suối', lot: 'L2405-LV', location: 'C-01-02', unit: 'Chai', onHand: 7100, minStock: 720, value: 7100 * 4600 },
  { id: 'INV-12', productId: 'SP-018', productName: 'Trà Ô Long TEA+ chai 455ml', sku: 'TEA-PLUS-455', categoryName: 'Trà đóng chai', lot: 'L2401-TEA', location: 'B-03-01', unit: 'Chai', onHand: 251, minStock: 240, value: 251 * 9000 },
];

// Thẻ kho: biến động theo thời gian của 1 SP, cột "balance" là số dư chạy dồn.
export const STOCK_CARDS = {
  'SP-001': {
    productName: 'Bia Saigon Lager lon 330ml',
    unit: 'Lon',
    opening: 1188,
    rows: [
      { date: '2026-07-08', docCode: 'PN-2026-0135', type: 'Nhập', inQty: 0, outQty: 0, balance: 1188, note: 'Tồn đầu kỳ' },
      { date: '2026-07-11', docCode: 'PX-2026-0090', type: 'Xuất', inQty: 0, outQty: 480, balance: 708, note: 'Xuất sỉ Minh Phát' },
      { date: '2026-07-15', docCode: 'PN-2026-0138', type: 'Nhập', inQty: 2880, outQty: 0, balance: 3588, note: 'Nhập từ SABECO' },
      { date: '2026-07-17', docCode: 'PX-2026-0098', type: 'Xuất', inQty: 0, outQty: 400, balance: 3188, note: 'Xuất sỉ Minh Phát' },
      { date: '2026-07-17', docCode: 'KK-2026-0007', type: 'Kiểm kê', inQty: 0, outQty: 12, balance: 3176, note: 'Điều chỉnh kiểm kê' },
    ],
  },
  'SP-008': {
    productName: 'Coca-Cola lon 330ml',
    unit: 'Lon',
    opening: 928,
    rows: [
      { date: '2026-07-09', docCode: 'PN-2026-0130', type: 'Nhập', inQty: 0, outQty: 0, balance: 928, note: 'Tồn đầu kỳ' },
      { date: '2026-07-13', docCode: 'PX-2026-0094', type: 'Xuất', inQty: 0, outQty: 1200, balance: -272, note: 'Xuất GreenMart' },
      { date: '2026-07-14', docCode: 'PN-2026-0139', type: 'Nhập', inQty: 3600, outQty: 0, balance: 3328, note: 'Nhập từ Coca-Cola VN' },
      { date: '2026-07-15', docCode: 'BT-2026-0009', type: 'Bất thường', inQty: 0, outQty: 24, balance: 3304, note: 'Hàng hỏng' },
      { date: '2026-07-16', docCode: 'PX-2026-0099', type: 'Xuất', inQty: 0, outQty: 2784, balance: 520, note: 'Xuất sỉ nhiều đơn' },
    ],
  },
};

export const STOCK_CARD_OPTIONS = Object.entries(STOCK_CARDS).map(([id, c]) => ({
  value: id,
  label: c.productName,
}));
