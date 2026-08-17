import axiosClient from './axiosClient';

export const transferApi = {
  create: (data) => axiosClient.post('/transfers', data),
  getAll: (params) => axiosClient.get('/transfers', { params }),
  getById: (id) => axiosClient.get(`/transfers/${id}`),
};
