/**
 * Mock user authentication — thay thế cho auth store chưa có.
 * Đổi MOCK_ROLE để test các role khác: 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'STAFF'
 *
 * Mapping với tên vai trò tiếng Việt trong hệ thống:
 *   Quản trị  → ADMIN
 *   Thủ kho   → MANAGER
 *   Kế toán   → ACCOUNTANT
 *   Bán hàng  → STAFF
 */

const MOCK_ROLE = 'MANAGER ';

const MOCK_USER = {
  id: 'U-001',
  fullName: 'Nguyễn Văn Thiên',
  username: 'thien.nguyen',
  role: MOCK_ROLE,
};

export function useMockAuth() {
  return MOCK_USER;
}
