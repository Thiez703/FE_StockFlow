import AbnormalStocksPage from '@/features/abnormal-stocks/pages/AbnormalStocksPage';
import AbnormalStockCreatePage from '@/features/abnormal-stocks/pages/AbnormalStockCreatePage';

export const abnormalStockRoutes = [
  { path: 'abnormal-stocks', element: <AbnormalStocksPage /> },
  { path: 'abnormal-stocks/create', element: <AbnormalStockCreatePage /> },
];
