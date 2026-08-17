import axiosClient from './axiosClient';

// InventoryResponse { id, warehouseId, warehouseCode, productId, productCode,
//     productName, lotId, lotCode, locationId, locationCode, quantity, updatedAt }
//
// InventoryTransactionResponse { id, refType, refId, refCode, productId, productCode,
//     productName, lotId, lotCode, locationId, locationCode,
//     quantityChange, balanceAfter, performedBy, performedAt }
//
// refType enum: INBOUND, INBOUND_VOID, OUTBOUND, OUTBOUND_VOID, STOCKTAKE, TRANSFER, TRANSFER_VOID
//
// Cả 3 endpoint trả Page<T> (page, size, sort).
export const inventoryApi = {
  // Tồn kho hiện tại: productId?, lotId?, locationId?, phân trang.
  getAll: (params) => axiosClient.get('/inventory', { params }),

  // Tồn kho gộp chung theo sản phẩm: phân trang
  getByProduct: (params) => axiosClient.get('/inventory/by-product', { params }),

  // Lịch sử biến động: productId?, lotId?, locationId?, from?, to?, refType?, phân trang.
  getTransactions: (params) =>
    axiosClient.get('/inventory-transactions', { params }),

  // Biến động theo sản phẩm: phân trang.
  getTransactionsByProduct: (productId, params) =>
    axiosClient.get(`/inventory-transactions/by-product/${productId}`, { params }),
};
