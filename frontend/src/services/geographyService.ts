import api from './api';

export interface Province {
  id: number;
  province_name: string;
  province_type: string;
  region: string;
}

export interface Commune {
  id: number;
  commune_name: string;
  commune_type: string;
  province: number;
}

export const geographyService = {
  getProvinces: async () => {
    try {
      const response = await api.get<any>('/api/provinces/', {
        params: { page_size: 100 }
      });
      const data = response?.data;
      return Array.isArray(data) ? data : (data?.results ?? []);
    } catch (error) {
      console.error('Error fetching provinces:', error);
      return [];
    }
  },

  getCommunes: async (provinceId?: number | string) => {
    if (!provinceId) return [];
    try {
      const response = await api.get<any>('/api/communes/', {
        params: { province_id: provinceId, page_size: 100 }
      });
      const data = response?.data;
      return Array.isArray(data) ? data : (data?.results || []);
    } catch (error) {
      console.error('Error fetching communes:', error);
      return [];
    }
  }
};
