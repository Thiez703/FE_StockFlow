import { useMockAuth } from '@/hooks/useMockAuth';

/**
 * Trả về object các quyền dựa trên role của user hiện tại.
 * Role: 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'STAFF'
 */
export function usePermissions() {
  const user = useMockAuth();
  const role = user?.role ?? 'STAFF';

  return {
    role,
    canCreateInbound:    ['MANAGER', 'STAFF'].includes(role),
    canCreateOutbound:   ['MANAGER', 'STAFF'].includes(role),
    canCreateRetail:     ['MANAGER', 'STAFF'].includes(role),
    canCreateStocktake:  ['MANAGER', 'ACCOUNTANT', 'STAFF'].includes(role),
    canCreateAbnormal:   ['MANAGER', 'ACCOUNTANT', 'STAFF'].includes(role),
    canApproveDocs:      ['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(role),
    canManageMasterData: ['MANAGER'].includes(role),
    canManageUsers:      ['ADMIN'].includes(role),
    canViewLogs:         ['ADMIN'].includes(role),
    canViewReports:      ['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(role),
  };
}
