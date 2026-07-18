import {
  DashboardOutlined,
  DropboxOutlined,
  ImportOutlined,
  ExportOutlined,
  DatabaseOutlined,
  ShopOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons';

/**
 * Cấu hình menu sidebar, chia theo nhóm.
 * `icon` lưu THAM CHIẾU component (không phải JSX) để file giữ đuôi .js;
 * phần render JSX nằm ở Sidebar.jsx.
 *
 * Lưu ý: hiện mới có route /dashboard và /goods-receipt/create là trang thật,
 * các mục còn lại tạm trỏ tới trang "Đang phát triển".
 */
export const NAV_GROUPS = [
  {
    key: 'grp-overview',
    label: 'Tổng quan',
    items: [{ key: '/dashboard', label: 'Bảng điều khiển', icon: DashboardOutlined }],
  },
  {
    key: 'grp-warehouse',
    label: 'Nghiệp vụ kho',
    items: [
      { key: '/products', label: 'Sản phẩm', icon: DropboxOutlined },
      { key: '/goods-receipt/create', label: 'Nhập kho', icon: ImportOutlined },
      { key: '/goods-issue', label: 'Xuất kho', icon: ExportOutlined },
      { key: '/inventory', label: 'Tồn kho', icon: DatabaseOutlined },
      { key: '/suppliers', label: 'Nhà cung cấp', icon: ShopOutlined },
    ],
  },
  {
    key: 'grp-system',
    label: 'Hệ thống',
    items: [
      { key: '/reports', label: 'Báo cáo', icon: BarChartOutlined },
      { key: '/settings', label: 'Cài đặt', icon: SettingOutlined },
    ],
  },
];
