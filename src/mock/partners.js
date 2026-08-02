/**
 * Đối tác: Nhà cung cấp (nhập hàng) và Khách hàng (xuất hàng).
 */
const SUPPLIERS = [
  { id: 'NCC-001', code: 'NCC-001', name: 'Tổng CTCP Bia – Rượu – NGK Sài Gòn (SABECO)', phone: '028 3829 4081', email: 'sales@sabeco.com.vn', taxCode: '0300583659', address: '187 Nguyễn Chí Thanh, Q.5, TP.HCM', status: 'active' },
  { id: 'NCC-002', code: 'NCC-002', name: 'Nhà máy Bia Heineken Việt Nam', phone: '028 3822 1234', email: 'order@heineken.com.vn', taxCode: '0301234567', address: '170 Lê Văn Sỹ, Q.3, TP.HCM', status: 'active' },
  { id: 'NCC-003', code: 'NCC-003', name: 'Suntory PepsiCo Việt Nam', phone: '028 3910 5555', email: 'cskh@suntorypepsico.vn', taxCode: '0302345678', address: 'Tầng 5, Sài Gòn Centre, Q.1, TP.HCM', status: 'active' },
  { id: 'NCC-004', code: 'NCC-004', name: 'Coca-Cola Việt Nam', phone: '028 3896 5678', email: 'order@coca-cola.vn', taxCode: '0303456789', address: '485 Hà Nội, Thủ Đức, TP.HCM', status: 'active' },
  { id: 'NCC-005', code: 'NCC-005', name: 'Công ty TNHH La Vie', phone: '0274 3823 456', email: 'sales@lavie.com.vn', taxCode: '0304567890', address: 'KCN Nam Tân Uyên, Bình Dương', status: 'inactive' },
];

const CUSTOMERS = [
  { id: 'KH-001', code: 'KH-001', name: 'Đại lý Bia Minh Phát', phone: '0908 111 222', type: 'Sỉ', address: '12 Lê Lợi, Gò Vấp, TP.HCM', status: 'active' },
  { id: 'KH-002', code: 'KH-002', name: 'Nhà hàng Hải Sản Biển Đông', phone: '0913 333 444', type: 'Sỉ', address: '88 Hoàng Sa, Q.1, TP.HCM', status: 'active' },
  { id: 'KH-003', code: 'KH-003', name: 'Siêu thị mini GreenMart', phone: '0977 555 666', type: 'Sỉ', address: '256 Quang Trung, Q.12, TP.HCM', status: 'active' },
  { id: 'KH-004', code: 'KH-004', name: 'Tạp hoá Cô Ba', phone: '0932 777 888', type: 'Lẻ', address: '45 Nơ Trang Long, Bình Thạnh, TP.HCM', status: 'active' },
  { id: 'KH-005', code: 'KH-005', name: 'Quán nhậu Bình Dân 79', phone: '0966 999 000', type: 'Sỉ', address: '79 Phạm Văn Đồng, Thủ Đức, TP.HCM', status: 'inactive' },
  { id: 'KH-006', code: 'KH-006', name: 'Khách lẻ tại kho', phone: '—', type: 'Lẻ', address: 'Bán tại quầy', status: 'active' },
];

export const SUPPLIER_OPTIONS = SUPPLIERS.filter((s) => s.status === 'active').map((s) => ({
  value: s.id,
  label: s.name,
}));

export const CUSTOMER_OPTIONS = CUSTOMERS.filter((c) => c.status === 'active').map((c) => ({
  value: c.id,
  label: c.name,
}));
