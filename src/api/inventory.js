import axiosClient from './axiosClient';

export const inventoryApi = {
  getAll: () => axiosClient.get('/inventory'),
};
