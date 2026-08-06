import {
  DashboardOutlined,
  SwapOutlined,
  ImportOutlined,
  ExportOutlined,
  ShoppingCartOutlined,
  RollbackOutlined,
  DeleteOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  BarChartOutlined,
  FileSearchOutlined,
  ProfileOutlined,
  AlertOutlined,
  SettingOutlined,
  UserOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { MASTER_DATA_ITEMS } from '@/features/master-data/constants/masterDataSections';

/**
 * Cấu hình điều hướng nghiệp vụ, gom theo 5 nhóm. `icon` lưu THAM CHIẾU
 * component (không phải JSX) để file giữ đuôi .js — phần render JSX nằm ở
 * AppSidebar.jsx và TopNav.jsx.
 *
 * Nhóm "Dữ liệu nền" KHÔNG nằm ở đây mà khai tại
 * features/master-data/constants/masterDataSections.js (vì mỗi mục còn gắn với
 * một component route con). Hai nguồn được ghép lại ở SIDEBAR_GROUPS bên dưới.
 *
 * `key` của item = đường dẫn route (không có tiền tố /admin theo cấu trúc dự án).
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
        label: 'Phiếu xuất', // Sẽ được override dựa trên role ở component
        icon: ExportOutlined,
        desc: 'Danh sách phiếu xuất',
        end: true,
      },
      {
        key: '/outbounds/create/retail',
        label: 'Tạo phiếu xuất bán',
        icon: ShoppingCartOutlined,
        desc: 'Xuất hàng bán cho khách hàng',
        roles: ['STAFF', 'ADMIN', 'MANAGER'],
      },
      {
        key: '/outbounds/create/return_supplier',
        label: 'Tạo phiếu trả NCC',
        icon: RollbackOutlined,
        desc: 'Trả hàng cho nhà cung cấp',
        roles: ['STAFF', 'ADMIN', 'MANAGER'],
      },
      {
        key: '/outbounds/create/disposal',
        label: 'Tạo phiếu xuất hủy',
        icon: DeleteOutlined,
        desc: 'Xuất hủy hàng hỏng / hết hạn',
        roles: ['STAFF', 'ADMIN', 'MANAGER'],
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
        roles: ['ADMIN', 'STAFF', 'ACCOUNTANT', 'MANAGER'],
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
        roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
      },
      {
        key: '/stock-card',
        label: 'Thẻ kho',
        icon: ProfileOutlined,
        desc: 'Sổ cái biến động, số dư dồn',
        roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
      },
      {
        key: '/alerts',
        label: 'Cảnh báo',
        icon: AlertOutlined,
        desc: 'Tồn thấp & cận hạn',
        roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
      },
      {
        key: '/reports',
        label: 'Báo cáo',
        icon: BarChartOutlined,
        desc: 'Nhập – Xuất – Tồn theo kỳ',
        roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
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
        roles: ['ADMIN'], // Chỉ Admin
      },
      {
        key: '/logs',
        label: 'Nhật ký hoạt động',
        icon: HistoryOutlined,
        desc: 'Lịch sử thao tác hệ thống',
        roles: ['ADMIN'], // Chỉ Admin
      },
    ],
  },
];

/**
 * Toàn bộ điều hướng cho SIDEBAR TRÁI và Drawer màn hẹp — nguồn duy nhất để hai
 * chỗ đó không lệch nhau.
 *
 * Ghép NAV_GROUPS (nghiệp vụ) với các mục Dữ liệu nền, quy về cùng một dạng
 * `item.path`: NAV_GROUPS dùng `item.key` làm đường dẫn còn MASTER_DATA_ITEMS
 * dùng `item.path`, nên phần render chỉ cần một nhánh.
 *
 * Dữ liệu nền xếp ngay sau Tổng quan, giữ đúng thứ tự IA hồi còn ở top-nav; 3
 * cụm con (Hàng hoá / Kho bãi / Đối tác) gộp phẳng thành 1 nhóm cho ngang hàng
 * với các nhóm nghiệp vụ.
 */
export const SIDEBAR_GROUPS = [
  ...NAV_GROUPS.slice(0, 1).map(normalizeGroup),
  { key: 'master-data', label: 'Dữ liệu nền', items: MASTER_DATA_ITEMS },
  ...NAV_GROUPS.slice(1).map(normalizeGroup),
];

function normalizeGroup(group) {
  return {
    key: group.key,
    label: group.label,
    items: group.items.map((item) => ({ ...item, path: item.key, end: item.end })),
  };
}

// Tất cả key (đường dẫn) phẳng — tiện dò nhóm đang active theo path hiện tại.
export const FLAT_NAV_KEYS = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.key));

export function getVisibleSidebarGroups(userRole) {
  return SIDEBAR_GROUPS.map((group) => {
    const items = group.items
      .filter((item) => !item.roles || item.roles.includes(userRole))
      .map((item) => {
        let label = item.label;
        if (item.path === '/outbounds' || item.key === '/outbounds') {
          label = ['ADMIN', 'MANAGER'].includes(userRole) ? 'Quản lý phiếu xuất' : 'Phiếu xuất của tôi';
        }
        return { ...item, label };
      });
    return { ...group, items };
  }).filter((group) => group.items.length > 0);
}
