import axiosClient from './axiosClient';

export const chatApi = {
  chat: (data) => {
    return axiosClient.post('/chat', data);
  },
  
  getConversations: () => {
    return axiosClient.get('/chat/conversations');
  },
  
  getMessages: (conversationId) => {
    return axiosClient.get(`/chat/conversations/${conversationId}/messages`);
  },

  deleteConversation: (id) => {
    return axiosClient.delete(`/chat/conversations/${id}`);
  }
};
