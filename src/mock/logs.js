/**
 * Nhật ký hoạt động hệ thống. `action` mô tả thao tác, `target` là đối tượng bị tác động.
 */
export const LOG_ACTIONS = ['Tạo', 'Cập nhật', 'Duyệt', 'Từ chối', 'Xoá', 'Đăng nhập', 'Huỷ'];

export const LOGS = [
  { id: 'LG-0001', time: '2026-07-18 08:12', user: 'thien.nguyen', action: 'Đăng nhập', target: 'Hệ thống', ip: '10.0.12.4' },
  { id: 'LG-0002', time: '2026-07-17 17:32', user: 'thien.nguyen', action: 'Tạo', target: 'Phiếu nhập PN-2026-0142', ip: '10.0.12.4' },
  { id: 'LG-0003', time: '2026-07-17 16:58', user: 'ha.pham', action: 'Tạo', target: 'Phiếu xuất PX-2026-0098', ip: '10.0.12.9' },
  { id: 'LG-0004', time: '2026-07-17 15:20', user: 'hong.tran', action: 'Duyệt', target: 'Phiếu kiểm kê KK-2026-0006', ip: '10.0.12.7' },
  { id: 'LG-0005', time: '2026-07-16 14:05', user: 'quan.le', action: 'Cập nhật', target: 'Sản phẩm SP-005', ip: '10.0.12.5' },
  { id: 'LG-0006', time: '2026-07-16 11:47', user: 'ngoc.dang', action: 'Tạo', target: 'Phiếu bất thường BT-2026-0011', ip: '10.0.12.11' },
  { id: 'LG-0007', time: '2026-07-15 09:33', user: 'hong.tran', action: 'Từ chối', target: 'Phiếu kiểm kê KK-2026-0005', ip: '10.0.12.7' },
  { id: 'LG-0008', time: '2026-07-14 10:12', user: 'quan.le', action: 'Huỷ', target: 'Phiếu nhập PN-2026-0138', ip: '10.0.12.5' },
  { id: 'LG-0009', time: '2026-07-13 08:40', user: 'thien.nguyen', action: 'Tạo', target: 'Người dùng U-006', ip: '10.0.12.4' },
  { id: 'LG-0010', time: '2026-07-12 16:25', user: 'huy.vo', action: 'Xoá', target: 'Lô hàng L2310-XX', ip: '10.0.12.8' },
  { id: 'LG-0011', time: '2026-07-11 13:18', user: 'ha.pham', action: 'Cập nhật', target: 'Khách hàng KH-003', ip: '10.0.12.9' },
  { id: 'LG-0012', time: '2026-07-10 09:02', user: 'thien.nguyen', action: 'Đăng nhập', target: 'Hệ thống', ip: '10.0.12.4' },
];
