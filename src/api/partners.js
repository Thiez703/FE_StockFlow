import axiosClient from './axiosClient';

// SupplierResponse { id, code, name, taxCode, contactPerson, phone, email, address, note, status }
// SupplierRequest  { code*, name*, taxCode, contactPerson, phone, email, address, note }
// Request không có `status` — bật/tắt đi qua activate/deactivate riêng.
export const supplierApi = {
  getAll: () => axiosClient.get('/suppliers'),
  getById: (id) => axiosClient.get(`/suppliers/${id}`),
  create: (data) => axiosClient.post('/suppliers', data),
  update: (id, data) => axiosClient.put(`/suppliers/${id}`, data),
  remove: (id) => axiosClient.delete(`/suppliers/${id}`),
  activate: (id) => axiosClient.patch(`/suppliers/${id}/activate`),
  deactivate: (id) => axiosClient.patch(`/suppliers/${id}/deactivate`),
};

// CustomerResponse { id, name, phone, address, status }
// CustomerRequest  { name*, phone, address }  — không có code, không có loại khách
export const customerApi = {
  getAll: () => axiosClient.get('/customers'),
  getById: (id) => axiosClient.get(`/customers/${id}`),
  create: (data) => axiosClient.post('/customers', data),
  update: (id, data) => axiosClient.put(`/customers/${id}`, data),
  remove: (id) => axiosClient.delete(`/customers/${id}`),
  activate: (id) => axiosClient.patch(`/customers/${id}/activate`),
  deactivate: (id) => axiosClient.patch(`/customers/${id}/deactivate`),
};
