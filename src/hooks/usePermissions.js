import { useSelector } from 'react-redux';

/**
 * Trả về object các quyền dựa trên role của user hiện tại.
 * Role: 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'STAFF'
 */
export function usePermissions() {
  const user = useSelector((state) => state.auth.user);
  const role = user?.role ?? 'STAFF';

  // Theo SRS, ADMIN có toàn quyền — không cần liệt kê 'ADMIN' ở từng dòng dưới.
  const can = (...roles) => role === 'ADMIN' || roles.includes(role);

  return {
    role,
    isAdmin: role === 'ADMIN',
    canCreateInbound:    can('MANAGER', 'STAFF'),
    canCreateOutbound:   can('MANAGER', 'STAFF'),
    canCreateStocktake:  can('MANAGER', 'ACCOUNTANT', 'STAFF'),
    canCreateAbnormal:   can('MANAGER', 'ACCOUNTANT', 'STAFF'),
    canApproveDocs:      can('MANAGER', 'ACCOUNTANT'),
    canManageMasterData: can('MANAGER'),
    canManageUsers:      can(),
    canViewLogs:         can(),
    canViewReports:      can('MANAGER', 'ACCOUNTANT'),
    canViewStorageMap:   can('MANAGER', 'ACCOUNTANT'),
  };
}
