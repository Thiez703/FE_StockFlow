import {
  DashboardOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
  DropboxOutlined,
  TagsOutlined,
  ContainerOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  SwapOutlined,
  ImportOutlined,
  ExportOutlined,
  ShoppingCartOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  WarningOutlined,
  BarChartOutlined,
  FileSearchOutlined,
  ProfileOutlined,
  AlertOutlined,
  SettingOutlined,
  UserOutlined,
  HistoryOutlined,
} from '@ant-design/icons';

/**
 * Cấu hình điều hướng TOP-NAV, gom theo 6 nhóm; hover 1 nhóm sẽ sổ mega-dropdown
 * liệt kê các trang con. `icon` lưu THAM CHIẾU component (không phải JSX) để file
 * giữ đuôi .js — phần render JSX nằm ở TopNav.jsx.
 *
 * `key` của item = đường dẫn route (không có tiền tố /admin theo cấu trúc dự án).
 * Các nhóm 1 trang (Tổng quan) render như 1 link trực tiếp, không sổ dropdown.
 */
export const NAV_GROUPS = [
  {
    key: 'overview',
    label: 'Tổng quan',
    icon: DashboardOutlined,
    items: [
      {
        key: '/dashboard',
        label: 'Bảng điều khiển',
        icon: DashboardOutlined,
        desc: 'KPI tồn kho & hoạt động hôm nay',
      },
    ],
  },
  {
    key: 'master-data',
    label: 'Dữ liệu nền',
    icon: DatabaseOutlined,
    items: [
      {
        key: '/categories',
        label: 'Danh mục',
        icon: AppstoreOutlined,
        desc: 'Nhóm hàng cha – con',
      },
      {
        key: '/products',
        label: 'Sản phẩm',
        icon: DropboxOutlined,
        desc: 'Danh mục hàng hoá, barcode',
      },
      {
        key: '/units',
        label: 'Đơn vị tính',
        icon: TagsOutlined,
        desc: 'Lon / Lốc / Thùng & quy đổi',
      },
      {
        key: '/lots',
        label: 'Lô hàng',
        icon: ContainerOutlined,
        desc: 'NSX – HSD, cảnh báo cận hạn',
      },
      {
        key: '/partners',
        label: 'Nhà cung cấp & Khách hàng',
        icon: TeamOutlined,
        desc: 'Đối tác nhập – xuất',
      },
      {
        key: '/locations',
        label: 'Vị trí lưu trữ',
        icon: EnvironmentOutlined,
        desc: 'Khu, kệ, vị trí trong kho',
      },
    ],
  },
  {
    key: 'warehouse-ops',
    label: 'Nghiệp vụ kho',
    icon: SwapOutlined,
    items: [
      {
        key: '/inbounds',
        label: 'Phiếu nhập',
        icon: ImportOutlined,
        desc: 'Nhập hàng từ nhà cung cấp',
      },
      {
        key: '/outbounds',
        label: 'Phiếu xuất',
        icon: ExportOutlined,
        desc: 'Xuất sỉ / trả NCC / nội bộ',
      },
      {
        key: '/retail',
        label: 'Bán lẻ tại kho',
        icon: ShoppingCartOutlined,
        desc: 'Màn hình POS bán nhanh',
      },
    ],
  },
  {
    key: 'control',
    label: 'Kiểm soát',
    icon: SafetyCertificateOutlined,
    items: [
      {
        key: '/stocktakes',
        label: 'Kiểm kê',
        icon: AuditOutlined,
        desc: 'Đếm thực tế & chênh lệch',
      },
      {
        key: '/abnormal-stocks',
        label: 'Hàng bất thường',
        icon: WarningOutlined,
        desc: 'Hỏng / vỡ / mất / hết hạn',
      },
    ],
  },
  {
    key: 'inventory-report',
    label: 'Tồn kho & Báo cáo',
    icon: BarChartOutlined,
    items: [
      {
        key: '/inventory',
        label: 'Tra cứu tồn',
        icon: FileSearchOutlined,
        desc: 'Tồn hiện tại theo SP / lô / vị trí',
      },
      {
        key: '/stock-card',
        label: 'Thẻ kho',
        icon: ProfileOutlined,
        desc: 'Sổ cái biến động, số dư dồn',
      },
      {
        key: '/alerts',
        label: 'Cảnh báo',
        icon: AlertOutlined,
        desc: 'Tồn thấp & cận hạn',
      },
      {
        key: '/reports',
        label: 'Báo cáo',
        icon: BarChartOutlined,
        desc: 'Nhập – Xuất – Tồn theo kỳ',
      },
    ],
  },
  {
    key: 'system',
    label: 'Hệ thống',
    icon: SettingOutlined,
    items: [
      {
        key: '/users',
        label: 'Người dùng',
        icon: UserOutlined,
        desc: 'Tài khoản & phân quyền',
      },
      {
        key: '/logs',
        label: 'Nhật ký hoạt động',
        icon: HistoryOutlined,
        desc: 'Lịch sử thao tác hệ thống',
      },
    ],
  },
];

// Danh sách kho (mock) cho ô "chọn kho" trên TopNav.
export const WAREHOUSES = [
  { value: 'kho-tong', label: 'Kho Tổng — Bình Tân' },
  { value: 'kho-q7', label: 'Kho Quận 7' },
  { value: 'kho-thu-duc', label: 'Kho Thủ Đức' },
];

// Tất cả key (đường dẫn) phẳng — tiện dò nhóm đang active theo path hiện tại.
export const FLAT_NAV_KEYS = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.key));
