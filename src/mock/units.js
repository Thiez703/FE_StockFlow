/**
 * Đơn vị tính & tỷ lệ quy đổi về đơn vị cơ sở (Lon hoặc Chai).
 * `ratio` = số đơn vị cơ sở trong 1 đơn vị này.
 */
export const UNITS = [
  { id: 'DV-01', code: 'LON', name: 'Lon', baseUnit: 'Lon', ratio: 1, isBase: true, note: 'Đơn vị cơ sở cho hàng lon' },
  { id: 'DV-02', code: 'LOC', name: 'Lốc', baseUnit: 'Lon', ratio: 6, isBase: false, note: 'Lốc 6 lon' },
  { id: 'DV-03', code: 'THUNG-LON', name: 'Thùng (lon)', baseUnit: 'Lon', ratio: 24, isBase: false, note: 'Thùng 24 lon' },
  { id: 'DV-04', code: 'CHAI', name: 'Chai', baseUnit: 'Chai', ratio: 1, isBase: true, note: 'Đơn vị cơ sở cho hàng chai' },
  { id: 'DV-05', code: 'KET', name: 'Két', baseUnit: 'Chai', ratio: 24, isBase: false, note: 'Két 24 chai' },
  { id: 'DV-06', code: 'THUNG-CHAI', name: 'Thùng (chai)', baseUnit: 'Chai', ratio: 12, isBase: false, note: 'Thùng 12 chai nước suối' },
  { id: 'DV-07', code: 'LOC-4', name: 'Lốc 4', baseUnit: 'Lon', ratio: 4, isBase: false, note: 'Lốc 4 lon bia cao cấp' },
];

export const UNIT_OPTIONS = UNITS.map((u) => ({
  value: u.id,
  label: u.ratio > 1 ? `${u.name} (×${u.ratio})` : u.name,
}));
