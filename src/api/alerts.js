import axiosClient from './axiosClient';

// LowStockAlertResponse { productId, productCode, productName, unit,
//                         currentStock, threshold, thresholdSource,
//                         velocity30d, estimatedDaysRemaining }
//
// OutOfStockAlertResponse { productId, productCode, productName, unit, velocity30d }
//
// SellThroughRiskResponse { lotId, lotCode, productId, productCode, productName,
//                           currentStock, velocity30d, estimatedDaysToSellOut,
//                           expDate, daysUntilExpiry, atRisk }
//
// Cả 3 endpoint trả Page<T> (page, size, sort).
export const alertApi = {
  getLowStock: (params) => axiosClient.get('/alerts/low-stock', { params }),
  getOutOfStock: (params) => axiosClient.get('/alerts/out-of-stock', { params }),
  getSellThroughRisk: (params) => axiosClient.get('/alerts/sell-through-risk', { params }),
};
