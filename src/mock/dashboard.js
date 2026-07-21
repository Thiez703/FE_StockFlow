import { INVENTORY } from '@/mock/inventory';

/**
 * Số liệu tổng hợp cho Dashboard. Giá trị tồn lấy trực tiếp từ mock tồn kho để
 * nhất quán giữa các trang.
 */
export const KPIS = {
  totalInventoryValue: INVENTORY.reduce((sum, r) => sum + r.value, 0),
  pendingDocs: 6,
  outboundToday: 214, // số thùng đã xuất trong ngày
};

// Chuỗi Nhập – Xuất – Tồn theo tháng (triệu VND) cho biểu đồ cột tĩnh.
export const TREND = [
  { label: 'T2', inbound: 820, outbound: 690, stock: 1180 },
  { label: 'T3', inbound: 910, outbound: 760, stock: 1330 },
  { label: 'T4', inbound: 760, outbound: 880, stock: 1210 },
  { label: 'T5', inbound: 1040, outbound: 820, stock: 1430 },
  { label: 'T6', inbound: 980, outbound: 900, stock: 1510 },
  { label: 'T7', inbound: 1150, outbound: 960, stock: 1700 },
];

// Hoạt động gần đây (dòng thời gian nghiệp vụ).
export const RECENT_ACTIVITIES = [
  { id: 'a1', code: 'PN-2026-0142', kind: 'inbound', title: 'Nhập kho từ SABECO', amount: 39840000, status: 'POSTED', time: '17/07 · 17:32', user: 'Thiên Nguyễn' },
  { id: 'a2', code: 'PX-2026-0098', kind: 'outbound', title: 'Xuất sỉ — Đại lý Minh Phát', amount: 34080000, status: 'POSTED', time: '17/07 · 16:58', user: 'Phạm Thu Hà' },
  { id: 'a3', code: 'KK-2026-0007', kind: 'stocktake', title: 'Kiểm kê khu A', amount: null, status: 'PENDING', time: '17/07 · 15:10', user: 'Lê Minh Quân' },
  { id: 'a4', code: 'BT-2026-0011', kind: 'abnormal', title: 'Hàng hết hạn — Sting Dâu', amount: null, status: 'PENDING', time: '16/07 · 11:47', user: 'Đặng Bảo Ngọc' },
  { id: 'a5', code: 'PN-2026-0139', kind: 'inbound', title: 'Nhập kho từ Coca-Cola VN', amount: 38400000, status: 'POSTED', time: '14/07 · 10:05', user: 'Thiên Nguyễn' },
];
