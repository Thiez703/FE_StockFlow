import {
  AppstoreOutlined,
  ApartmentOutlined,
  TagsOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import ProductsTab from '@/features/master-data/components/ProductsTab';
import CategoriesTab from '@/features/master-data/components/CategoriesTab';
import LotsTab from '@/features/master-data/components/LotsTab';
import PartnersTab from '@/features/master-data/components/PartnersTab';

/**
 * Các mục Dữ liệu nền, gom thành 3 cụm để sidebar đọc được theo mảng nghiệp vụ
 * thay vì một danh sách 6 dòng phẳng.
 *
 * Đây là NGUỒN DUY NHẤT cho cả sidebar, mục trong Drawer của TopNav lẫn khai
 * báo route con — thêm một mục ở đây là có đủ cả ba, không phải sửa 3 chỗ rồi
 * lệch nhau.
 *
 * `icon` và `component` lưu THAM CHIẾU component (không phải JSX) để file giữ
 * đuôi .js — cùng quy ước với constants/navigation.js; phần render JSX nằm ở
 * MasterDataSidebar.jsx, TopNav.jsx và routes.jsx.
 *
 * `slug` ghép sau /master-data/ thành đường dẫn thật, nhờ đó mục đang xem nằm
 * trên URL: F5 không mất chỗ, và gửi link thẳng tới một mục được.
 */
const MASTER_DATA_BASE = '/master-data';

const MASTER_DATA_ROLES = ['ADMIN', 'MANAGER'];

const RAW_GROUPS = [
  {
    key: 'goods',
    label: 'Hàng hoá',
    items: [
      {
        slug: 'products',
        label: 'Sản phẩm',
        icon: AppstoreOutlined,
        desc: 'Mã, tên, danh mục và đơn vị tính của sản phẩm',
        component: ProductsTab,
        roles: MASTER_DATA_ROLES,
      },
      {
        slug: 'categories',
        label: 'Danh mục',
        icon: ApartmentOutlined,
        desc: 'Cây danh mục phân loại sản phẩm',
        component: CategoriesTab,
        roles: MASTER_DATA_ROLES,
      },
    ],
  },
  {
    key: 'warehouse',
    label: 'Kho bãi',
    items: [
      {
        slug: 'lots',
        label: 'Lô hàng',
        icon: TagsOutlined,
        desc: 'Lô hàng theo ngày sản xuất và hạn dùng',
        component: LotsTab,
        roles: MASTER_DATA_ROLES,
      },
    ],
  },
  {
    key: 'partners',
    label: 'Đối tác',
    items: [
      {
        slug: 'partners',
        label: 'Nhà cung cấp & Khách hàng',
        icon: TeamOutlined,
        desc: 'Đối tác mua vào và bán ra',
        component: PartnersTab,
        roles: MASTER_DATA_ROLES,
      },
    ],
  },
];

/**
 * Bơm sẵn `path` tuyệt đối vào từng mục. Sidebar hiển thị ở MỌI trang nên link
 * bắt buộc phải tuyệt đối — để `to="products"` thì React Router sẽ ghép tương
 * đối với route đang đứng và ra /inbounds/products khi đang ở trang Phiếu nhập.
 */
export const MASTER_DATA_GROUPS = RAW_GROUPS.map((group) => ({
  ...group,
  items: group.items.map((item) => ({ ...item, path: `${MASTER_DATA_BASE}/${item.slug}` })),
}));

// Tất cả mục phẳng — tiện dò mục đang active theo slug trên URL.
export const MASTER_DATA_ITEMS = MASTER_DATA_GROUPS.flatMap((g) => g.items);

export const DEFAULT_MASTER_DATA_SLUG = 'products';
