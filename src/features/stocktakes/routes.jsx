import StocktakesPage from '@/features/stocktakes/pages/StocktakesPage';
import StocktakeCreatePage from '@/features/stocktakes/pages/StocktakeCreatePage';

export const stocktakeRoutes = [
  { path: 'stocktakes', element: <StocktakesPage /> },
  { path: 'stocktakes/create', element: <StocktakeCreatePage /> },
];
