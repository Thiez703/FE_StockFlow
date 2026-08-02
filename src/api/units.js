import axiosClient from './axiosClient';

// UnitResponse { id, code, name, status: ACTIVE | INACTIVE | EXPIRED }
// UnitRequest  { code (tối đa 10 ký tự), name (tối đa 20) }
// BE không có DELETE — ngừng dùng một đơn vị thì gọi deactivate.
export const unitApi = {
  getAll: () => axiosClient.get('/units'),
  getById: (id) => axiosClient.get(`/units/${id}`),
  create: (data) => axiosClient.post('/units', data),
  update: (id, data) => axiosClient.put(`/units/${id}`, data),
  activate: (id) => axiosClient.patch(`/units/${id}/activate`),
  deactivate: (id) => axiosClient.patch(`/units/${id}/deactivate`),
};
