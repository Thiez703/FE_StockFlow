import axiosClient from './axiosClient';
import axios from 'axios';
import { ACCESS_TOKEN_KEY } from './axiosClient';

// InventorySummaryResponse { productId, productCode, productName, unit,
//     lotId, lotCode, unitPrice,
//     openingQty, openingValue, inboundQty, inboundValue,
//     outboundQty, outboundValue, closingQty, closingValue }
//
// StocktakeVarianceResponse { stocktakeId, stocktakeCode, warehouseId, warehouseCode,
//     approvedAt, productId, productCode, productName,
//     lotId, lotCode, locationId, locationCode,
//     systemQty, actualQty, diffQty, note }
export const reportApi = {
  // Báo cáo NXT: from/to bắt buộc (date-time), productId tuỳ chọn, phân trang.
  getInventorySummary: (params) =>
    axiosClient.get('/reports/inventory-summary', { params }),

  // Chênh lệch kiểm kê: from/to bắt buộc (date-time), phân trang.
  getStocktakeVariance: (params) =>
    axiosClient.get('/reports/stocktake-variance', { params }),

  // Xuất Excel: trả blob, không parse JSON.
  exportInventorySummary: ({ warehouseId, from, to, productId }) => {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    return axios.get(`${BASE_URL}/reports/inventory-summary/export`, {
      params: { warehouseId, from, to, ...(productId ? { productId } : {}) },
      responseType: 'blob',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
