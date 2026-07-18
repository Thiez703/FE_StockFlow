/**
 * Vị trí lưu trữ trong kho: Khu (zone) → Kệ (rack) → Ô (bin). Mã dạng A-01-02.
 * `capacity`/`used` (%) để hiển thị mức lấp đầy. Vị trí DEFAULT dùng cho hàng chưa xếp.
 */
export const LOCATIONS = [
  { id: 'LOC-000', code: 'DEFAULT', zone: 'Khu tạm', rack: '—', bin: '—', type: 'Mặc định', capacity: 100, used: 12, status: 'active' },
  { id: 'LOC-001', code: 'A-01-01', zone: 'Khu A', rack: 'Kệ 01', bin: 'Ô 01', type: 'Bia lon', capacity: 100, used: 82, status: 'active' },
  { id: 'LOC-002', code: 'A-01-02', zone: 'Khu A', rack: 'Kệ 01', bin: 'Ô 02', type: 'Bia lon', capacity: 100, used: 76, status: 'active' },
  { id: 'LOC-003', code: 'A-01-03', zone: 'Khu A', rack: 'Kệ 01', bin: 'Ô 03', type: 'Bia lon', capacity: 100, used: 40, status: 'active' },
  { id: 'LOC-004', code: 'A-02-01', zone: 'Khu A', rack: 'Kệ 02', bin: 'Ô 01', type: 'Bia cao cấp', capacity: 100, used: 55, status: 'active' },
  { id: 'LOC-005', code: 'A-03-02', zone: 'Khu A', rack: 'Kệ 03', bin: 'Ô 02', type: 'Nước tăng lực', capacity: 100, used: 63, status: 'active' },
  { id: 'LOC-006', code: 'B-01-01', zone: 'Khu B', rack: 'Kệ 01', bin: 'Ô 01', type: 'Nước ngọt', capacity: 100, used: 90, status: 'active' },
  { id: 'LOC-007', code: 'B-01-02', zone: 'Khu B', rack: 'Kệ 01', bin: 'Ô 02', type: 'Nước ngọt', capacity: 100, used: 48, status: 'active' },
  { id: 'LOC-008', code: 'B-02-03', zone: 'Khu B', rack: 'Kệ 02', bin: 'Ô 03', type: 'Nước tăng lực', capacity: 100, used: 20, status: 'active' },
  { id: 'LOC-009', code: 'C-01-01', zone: 'Khu C', rack: 'Kệ 01', bin: 'Ô 01', type: 'Nước suối', capacity: 100, used: 88, status: 'active' },
  { id: 'LOC-010', code: 'C-01-02', zone: 'Khu C', rack: 'Kệ 01', bin: 'Ô 02', type: 'Nước suối', capacity: 100, used: 71, status: 'maintenance' },
];

export const LOCATION_OPTIONS = LOCATIONS.map((l) => ({ value: l.code, label: l.code }));
