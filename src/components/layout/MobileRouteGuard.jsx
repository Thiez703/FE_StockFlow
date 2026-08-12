import { useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';
import { usePermissions } from '@/hooks/usePermissions';
import { isMobileAllowedPath } from '@/constants/navigation';
import DesktopOnlyPage from '@/components/feedback/DesktopOnlyPage';

export default function MobileRouteGuard({ children }) {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const permissions = usePermissions();

  if (isMobile && !isMobileAllowedPath(pathname, permissions)) {
    return <DesktopOnlyPage />;
  }

  return children;
}
