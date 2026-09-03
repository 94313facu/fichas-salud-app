import api from './api';

const whatsappService = {
  async getStatus() {
    const response = await api.get('/api/whatsapp/status');
    return response.data;
  },

  async logout() {
    const response = await api.post('/api/whatsapp/logout');
    return response.data;
  },

  async restart() {
    const response = await api.post('/api/whatsapp/restart');
    return response.data;
  },

  async getConfig() {
    const response = await api.get('/api/whatsapp/config');
    return response.data;
  },

  async updateConfig(config) {
    const response = await api.put('/api/whatsapp/config', config);
    return response.data;
  }
};

export default whatsappService;
