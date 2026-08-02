import axiosClient from './axiosClient';

// WarehouseResponse { id, code, name, address }
// Tạo cần { code*, name*, address }, sửa chỉ nhận { name*, address } (không đổi được code).
export const warehouseApi = {
  getAll: () => axiosClient.get('/warehouses'),
  getById: (id) => axiosClient.get(`/warehouses/${id}`),
  create: (data) => axiosClient.post('/warehouses', data),
  update: (id, data) => axiosClient.put(`/warehouses/${id}`, data),
  remove: (id) => axiosClient.delete(`/warehouses/${id}`),
};

// StorageLocationResponse { id, warehouseId, zoneCode, locationCode }
// Tạo cần { warehouseId*, locationCode*, zoneCode }, sửa chỉ nhận { locationCode*, zoneCode }
// -> không chuyển được vị trí sang kho khác.
export const storageLocationApi = {
  getAll: () => axiosClient.get('/storage-locations'),
  getByWarehouse: (warehouseId) => axiosClient.get(`/storage-locations/warehouse/${warehouseId}`),
  getById: (id) => axiosClient.get(`/storage-locations/${id}`),
  create: (data) => axiosClient.post('/storage-locations', data),
  update: (id, data) => axiosClient.put(`/storage-locations/${id}`, data),
  remove: (id) => axiosClient.delete(`/storage-locations/${id}`),
};
