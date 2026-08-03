import { createElement } from 'react';
import { Navigate } from 'react-router-dom';
import MasterDataPage from '@/features/master-data/pages/MasterDataPage';
import {
  MASTER_DATA_ITEMS,
  DEFAULT_MASTER_DATA_SLUG,
} from '@/features/master-data/constants/masterDataSections';

/**
 * Route gộp: Sản phẩm, Danh mục, Đơn vị tính, Vị trí, Lô hàng, Đối tác — mỗi
 * mục là một route con dưới khung MasterDataPage (trước đây là tab trong 1 route).
 *
 * Danh sách route con sinh thẳng từ MASTER_DATA_ITEMS để nav trái và route
 * không thể lệch nhau: thêm mục ở constants là có luôn cả hai.
 *
 * /master-data trần chuyển hướng về mục mặc định, `replace` để nút Back không
 * kẹt lại ở URL rỗng đó.
 */
export const masterDataRoutes = [
  {
    path: 'master-data',
    element: <MasterDataPage />,
    children: [
      { index: true, element: <Navigate to={DEFAULT_MASTER_DATA_SLUG} replace /> },
      ...MASTER_DATA_ITEMS.map((item) => ({
        path: item.slug,
        element: createElement(item.component),
      })),
    ],
  },
];
