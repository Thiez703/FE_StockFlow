import GoodsReceiptCreatePage from '@/features/goods-receipt/pages/GoodsReceiptCreatePage';

// Route riêng của feature nhập kho. Được routes/index.jsx spread vào MainLayout.
export const goodsReceiptRoutes = [
  { path: 'goods-receipt/create', element: <GoodsReceiptCreatePage /> },
];
