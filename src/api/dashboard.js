import axiosClient from './axiosClient';

// StorageMapResponse { warehouseId, warehouseCode, rows }
//   rows: [{ rowLabel, cells }], luôn 6 dãy (A-F) x 6 ô/dãy, BE đã sắp sẵn thứ tự.
//   cells: [{ locationId, locationCode, rowLabel, colIndex, status, lotId, lotCode,
//             expDate, daysToExpiry, productId, productCode, productName, unit,
//             quantity, minStock }]
//   status: 'EMPTY' | 'NORMAL' | 'BELOW_MIN' | 'NEAR_EXPIRY' | 'EXPIRED'
//   Ô trống: mọi field lô/sản phẩm = null, status = 'EMPTY'.
// Chỉ ADMIN / MANAGER / ACCOUNTANT gọi được — STAFF nhận 403.
export const dashboardApi = {
  getStorageMap: (warehouseId) => axiosClient.get('/dashboard/storage-map', { params: { warehouseId } }),
};
