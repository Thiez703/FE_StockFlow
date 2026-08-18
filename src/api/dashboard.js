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
  getStorageMap: async (warehouseId) => {
    try {
      return await axiosClient.get('/dashboard/storage-map', { params: { warehouseId } });
    } catch (error) {
      if (error.response?.status === 403) {
        // Fallback for STAFF
        const [allLocs, invSnapshot] = await Promise.all([
          axiosClient.get(`/storage-locations/warehouse/${warehouseId}`),
          axiosClient.get('/stocktakes/inventory-snapshot', { params: { warehouseId } })
        ]);

        const rowsMap = {};
        
        // Build base cells from all locations
        allLocs.forEach(loc => {
          // Assuming locationCode is like A01, B02...
          const match = loc.locationCode.match(/^([A-Z]+)(\d+)$/i);
          const rowLabel = match ? match[1].toUpperCase() : loc.locationCode.charAt(0).toUpperCase();
          const colIndex = match ? parseInt(match[2], 10) : 0;
          
          if (!rowsMap[rowLabel]) {
            rowsMap[rowLabel] = { rowLabel, cells: [] };
          }
          
          rowsMap[rowLabel].cells.push({
            locationId: loc.id,
            locationCode: loc.locationCode,
            rowLabel,
            colIndex,
            status: 'EMPTY',
            usedQuantity: 0,
            occupants: []
          });
        });

        // Fill occupants from inventory snapshot
        invSnapshot.forEach(inv => {
          if (!inv.locationCode) return;
          const match = inv.locationCode.match(/^([A-Z]+)(\d+)$/i);
          const rowLabel = match ? match[1].toUpperCase() : inv.locationCode.charAt(0).toUpperCase();
          
          const row = rowsMap[rowLabel];
          if (row) {
            const cell = row.cells.find(c => c.locationId === inv.locationId || c.locationCode === inv.locationCode);
            if (cell) {
              cell.occupants.push({
                ...inv,
                status: inv.status || 'NORMAL'
              });
              cell.usedQuantity += (inv.quantity || 0);
            }
          }
        });

        const rows = Object.values(rowsMap).sort((a, b) => a.rowLabel.localeCompare(b.rowLabel));
        rows.forEach(row => {
          row.cells.sort((a, b) => a.colIndex - b.colIndex);
          
          // Re-evaluate cell status
          row.cells.forEach(cell => {
            if (cell.occupants.length > 0) {
              const priority = { EXPIRED: 4, NEAR_EXPIRY: 3, BELOW_MIN: 2, NORMAL: 1 };
              cell.status = cell.occupants.reduce(
                (worst, o) => (priority[o.status] || 0) > (priority[worst] || 0) ? o.status : worst,
                'NORMAL'
              );
            }
          });
        });
        
        return { warehouseId, warehouseCode: 'N/A', rows };
      }
      throw error;
    }
  },
};
