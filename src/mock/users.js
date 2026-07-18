/**
 * Người dùng hệ thống. `role`: Quản trị / Thủ kho / Kế toán / Bán hàng.
 * `status`: active (đang hoạt động) / locked (đã khoá).
 */
export const USER_ROLES = ['Quản trị', 'Thủ kho', 'Kế toán', 'Bán hàng'];

export const USERS = [
  { id: 'U-001', fullName: 'Nguyễn Văn Thiên', username: 'thien.nguyen', role: 'Quản trị', email: 'thien@stockflow.vn', phone: '0901 234 567', status: 'active', lastLogin: '2026-07-18 08:12' },
  { id: 'U-002', fullName: 'Trần Thị Hồng', username: 'hong.tran', role: 'Kế toán', email: 'hong@stockflow.vn', phone: '0902 345 678', status: 'active', lastLogin: '2026-07-17 17:40' },
  { id: 'U-003', fullName: 'Lê Minh Quân', username: 'quan.le', role: 'Thủ kho', email: 'quan@stockflow.vn', phone: '0903 456 789', status: 'active', lastLogin: '2026-07-18 07:55' },
  { id: 'U-004', fullName: 'Phạm Thu Hà', username: 'ha.pham', role: 'Bán hàng', email: 'ha@stockflow.vn', phone: '0904 567 890', status: 'active', lastLogin: '2026-07-17 16:03' },
  { id: 'U-005', fullName: 'Võ Đức Huy', username: 'huy.vo', role: 'Thủ kho', email: 'huy@stockflow.vn', phone: '0905 678 901', status: 'locked', lastLogin: '2026-06-30 09:20' },
  { id: 'U-006', fullName: 'Đặng Bảo Ngọc', username: 'ngoc.dang', role: 'Bán hàng', email: 'ngoc@stockflow.vn', phone: '0906 789 012', status: 'active', lastLogin: '2026-07-16 11:47' },
  { id: 'U-007', fullName: 'Hoàng Gia Bảo', username: 'bao.hoang', role: 'Kế toán', email: 'bao@stockflow.vn', phone: '0907 890 123', status: 'locked', lastLogin: '2026-05-12 14:10' },
];
