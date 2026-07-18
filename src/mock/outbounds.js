/**
 * Phiếu xuất kho. `type`: Sỉ / Trả NCC / Hủy / Nội bộ.
 * Trạng thái: POSTED / PENDING / VOIDED. Mã dạng PX-2026-0xxx.
 */
export const OUTBOUND_TYPES = ['Sỉ', 'Trả NCC', 'Hủy', 'Nội bộ'];

export const OUTBOUNDS = [
  {
    id: 'OUT-098', code: 'PX-2026-0098', type: 'Sỉ', partnerName: 'Đại lý Bia Minh Phát', warehouse: 'Kho Tổng — Bình Tân',
    date: '2026-07-17', createdBy: 'Bán hàng C', status: 'POSTED', note: 'Giao trong ngày',
    items: [
      { productName: 'Bia Saigon Lager lon 330ml', lot: 'L2405-SG', unit: 'Thùng (lon)', quantity: 60, unitPrice: 288000 },
      { productName: 'Bia Tiger Bạc lon 330ml', lot: 'L2404-TG', unit: 'Thùng (lon)', quantity: 40, unitPrice: 420000 },
    ],
    total: 60 * 288000 + 40 * 420000,
  },
  {
    id: 'OUT-097', code: 'PX-2026-0097', type: 'Sỉ', partnerName: 'Nhà hàng Hải Sản Biển Đông', warehouse: 'Kho Tổng — Bình Tân',
    date: '2026-07-16', createdBy: 'Bán hàng C', status: 'POSTED', note: '',
    items: [
      { productName: 'Bia Heineken lon 330ml', lot: 'L2312-HK', unit: 'Thùng (lon)', quantity: 30, unitPrice: 468000 },
    ],
    total: 30 * 468000,
  },
  {
    id: 'OUT-096', code: 'PX-2026-0096', type: 'Trả NCC', partnerName: 'Suntory PepsiCo', warehouse: 'Kho Quận 7',
    date: '2026-07-15', createdBy: 'Thủ kho B', status: 'PENDING', note: 'Trả hàng cận hạn',
    items: [
      { productName: 'Sting Dâu chai 330ml', lot: 'L2311-ST', unit: 'Két', quantity: 8, unitPrice: 240000 },
    ],
    total: 8 * 240000,
  },
  {
    id: 'OUT-095', code: 'PX-2026-0095', type: 'Hủy', partnerName: '—', warehouse: 'Kho Quận 7',
    date: '2026-07-14', createdBy: 'Thủ kho B', status: 'POSTED', note: 'Huỷ hàng quá hạn theo biên bản',
    items: [
      { productName: 'Sting Dâu chai 330ml', lot: 'L2311-ST', unit: 'Chai', quantity: 60, unitPrice: 10000 },
    ],
    total: 60 * 10000,
  },
  {
    id: 'OUT-094', code: 'PX-2026-0094', type: 'Sỉ', partnerName: 'Siêu thị mini GreenMart', warehouse: 'Kho Tổng — Bình Tân',
    date: '2026-07-13', createdBy: 'Bán hàng D', status: 'POSTED', note: '',
    items: [
      { productName: 'Coca-Cola lon 330ml', lot: 'L2401-CC', unit: 'Thùng (lon)', quantity: 50, unitPrice: 216000 },
      { productName: '7Up lon 330ml', lot: 'L2404-7UP', unit: 'Thùng (lon)', quantity: 30, unitPrice: 204000 },
    ],
    total: 50 * 216000 + 30 * 204000,
  },
  {
    id: 'OUT-093', code: 'PX-2026-0093', type: 'Nội bộ', partnerName: 'Kho Thủ Đức', warehouse: 'Kho Tổng — Bình Tân',
    date: '2026-07-12', createdBy: 'Thiên Nguyễn', status: 'POSTED', note: 'Điều chuyển nội bộ',
    items: [
      { productName: 'Aquafina 500ml', lot: 'L2405-AQ', unit: 'Thùng (chai)', quantity: 100, unitPrice: 60000 },
    ],
    total: 100 * 60000,
  },
  {
    id: 'OUT-092', code: 'PX-2026-0092', type: 'Sỉ', partnerName: 'Quán nhậu Bình Dân 79', warehouse: 'Kho Thủ Đức',
    date: '2026-07-10', createdBy: 'Bán hàng D', status: 'VOIDED', note: 'Khách huỷ đơn',
    items: [
      { productName: 'Bia 333 lon 330ml', lot: 'L2312-333', unit: 'Thùng (lon)', quantity: 25, unitPrice: 300000 },
    ],
    total: 25 * 300000,
  },
];
