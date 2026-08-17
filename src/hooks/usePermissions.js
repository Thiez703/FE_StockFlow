import { useSelector } from 'react-redux';

/**
 * Trả về object các quyền dựa trên role của user hiện tại.
 * Role: 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'STAFF'
 */
export function usePermissions() {
  const user = useSelector((state) => state.auth.user);
  const rawRole = user?.role ?? 'STAFF';
  // Backend có thể trả 'ROLE_ACCOUNTANT' thay vì 'ACCOUNTANT' — chuẩn hoá.
  const role = rawRole.replace(/^ROLE_/i, '');

  // Theo SRS, ADMIN có toàn quyền — không cần liệt kê 'ADMIN' ở từng dòng dưới.
  const can = (...roles) => role === 'ADMIN' || roles.includes(role);

  return {
    role,
    user,
    isAdmin: role === 'ADMIN',
    canCreateInbound:    can('MANAGER', 'STAFF'),
    canCreateOutbound:   can('MANAGER', 'STAFF'),
    // Phiếu nhập/xuất không sửa được, sai thì huỷ — và người huỷ phải khác người lập.
    // Backend chỉ cho ADMIN / ACCOUNTANT huỷ, MANAGER và STAFF đều không được.
    canVoidInbound:      can('ACCOUNTANT'),
    canVoidOutbound:     can('ACCOUNTANT'),
    canCreateStocktake:  can('MANAGER', 'ACCOUNTANT', 'STAFF'),
    canApproveDocs:      can('MANAGER', 'ACCOUNTANT'),
    canManageMasterData: can('MANAGER'),
    canManageUsers:      can(),
    canViewLogs:         can(),
    canViewReports:      can('MANAGER', 'ACCOUNTANT'),
    canViewInventory:    can('MANAGER', 'ACCOUNTANT'),
    canViewStorageMap:   can('MANAGER', 'ACCOUNTANT'),
  };
}
