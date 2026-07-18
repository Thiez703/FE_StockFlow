import InboundsPage from '@/features/inbounds/pages/InboundsPage';
import InboundCreatePage from '@/features/inbounds/pages/InboundCreatePage';

// Route feature Phiếu nhập (thay goods-receipt cũ).
export const inboundRoutes = [
  { path: 'inbounds', element: <InboundsPage /> },
  { path: 'inbounds/create', element: <InboundCreatePage /> },
];
