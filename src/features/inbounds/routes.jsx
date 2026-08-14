import InboundsPage from '@/features/inbounds/pages/InboundsPage';
import InboundCreatePage from '@/features/inbounds/pages/InboundCreatePage';

// Route feature Phiếu nhập
export const inboundRoutes = [
  { path: 'inbounds', element: <InboundsPage /> },
  { path: 'inbounds/create', element: <InboundCreatePage /> },
  { path: 'inbounds/create/new', element: <InboundCreatePage /> },
  { path: 'inbounds/create/old', element: <InboundCreatePage /> }, // Temporary reuse of create page
];
