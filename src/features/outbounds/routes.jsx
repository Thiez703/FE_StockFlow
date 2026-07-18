import OutboundsPage from '@/features/outbounds/pages/OutboundsPage';
import OutboundCreatePage from '@/features/outbounds/pages/OutboundCreatePage';

export const outboundRoutes = [
  { path: 'outbounds', element: <OutboundsPage /> },
  { path: 'outbounds/create', element: <OutboundCreatePage /> },
];
