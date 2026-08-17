import TransfersPage from '@/features/transfers/pages/TransfersPage';
import TransferCreatePage from '@/features/transfers/pages/TransferCreatePage';

export const transferRoutes = [
  { path: 'transfers', element: <TransfersPage /> },
  { path: 'transfers/create', element: <TransferCreatePage /> },
];
