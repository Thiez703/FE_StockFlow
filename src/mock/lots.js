/**
 * Lô hàng (theo NSX/HSD). Một số lô cố tình đặt HSD gần "hôm nay" (2026-07-18)
 * để phô cảnh báo cận hạn / quá hạn trên UI. `productName` denormalize cho tiện hiển thị.
 */
export const LOTS = [
  { id: 'L001', code: 'L2405-SG', productId: 'SP-001', productName: 'Bia Saigon Lager lon 330ml', mfgDate: '2026-05-02', expDate: '2027-05-02', quantity: 3200, location: 'A-01-01', status: 'active' },
  { id: 'L002', code: 'L2404-TG', productId: 'SP-003', productName: 'Bia Tiger Bạc lon 330ml', mfgDate: '2026-04-18', expDate: '2027-04-18', quantity: 4100, location: 'A-01-02', status: 'active' },
  { id: 'L003', code: 'L2312-HK', productId: 'SP-005', productName: 'Bia Heineken lon 330ml', mfgDate: '2025-12-20', expDate: '2026-08-05', quantity: 640, location: 'A-02-01', status: 'active' },
  { id: 'L004', code: 'L2401-CC', productId: 'SP-008', productName: 'Coca-Cola lon 330ml', mfgDate: '2026-01-10', expDate: '2026-07-30', quantity: 520, location: 'B-01-01', status: 'active' },
  { id: 'L005', code: 'L2402-PP', productId: 'SP-009', productName: 'Pepsi lon 330ml', mfgDate: '2026-02-05', expDate: '2026-08-25', quantity: 880, location: 'B-01-02', status: 'active' },
  { id: 'L006', code: 'L2311-ST', productId: 'SP-013', productName: 'Sting Dâu chai 330ml', mfgDate: '2025-11-15', expDate: '2026-07-12', quantity: 180, location: 'B-02-03', status: 'expired' },
  { id: 'L007', code: 'L2405-AQ', productId: 'SP-015', productName: 'Aquafina 500ml', mfgDate: '2026-05-01', expDate: '2027-05-01', quantity: 6400, location: 'C-01-01', status: 'active' },
  { id: 'L008', code: 'L2403-RB', productId: 'SP-014', productName: 'Red Bull lon 250ml', mfgDate: '2026-03-22', expDate: '2027-03-22', quantity: 1500, location: 'A-03-02', status: 'active' },
  { id: 'L009', code: 'L2312-333', productId: 'SP-007', productName: 'Bia 333 lon 330ml', mfgDate: '2025-12-28', expDate: '2026-09-10', quantity: 980, location: 'A-01-03', status: 'active' },
  { id: 'L010', code: 'L2404-7UP', productId: 'SP-010', productName: '7Up lon 330ml', mfgDate: '2026-04-02', expDate: '2026-08-15', quantity: 430, location: 'B-01-03', status: 'active' },
  { id: 'L011', code: 'L2405-LV', productId: 'SP-016', productName: 'Lavie 500ml', mfgDate: '2026-05-11', expDate: '2027-05-11', quantity: 7100, location: 'C-01-02', status: 'active' },
  { id: 'L012', code: 'L2401-TEA', productId: 'SP-018', productName: 'Trà Ô Long TEA+ chai 455ml', mfgDate: '2026-01-20', expDate: '2026-07-28', quantity: 260, location: 'B-03-01', status: 'active' },
];
