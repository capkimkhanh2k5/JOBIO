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

export interface Address {
  id: number;
  address_line: string;
  province: number;
  province_name?: string;
  commune: number | null;
  commune_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_verified?: boolean;
}

function asList<T>(data: T[] | { results?: T[] } | null | undefined): T[] {
  return Array.isArray(data) ? data : (data?.results ?? []);
}

export const geographyService = {
  getProvinces: async (): Promise<Province[]> => {
    try {
      const response = await api.get<Province[] | { results?: Province[] }>('/api/provinces/', {
        params: { page_size: 100 }
      });
      return asList(response?.data);
    } catch (error) {
      console.error('Error fetching provinces:', error);
      return [];
    }
  },

  getCommunes: async (provinceId?: number | string): Promise<Commune[]> => {
    if (!provinceId) return [];
    try {
      const response = await api.get<Commune[] | { results?: Commune[] }>('/api/communes/', {
        params: { province_id: provinceId, page_size: 100 }
      });
      return asList(response?.data);
    } catch (error) {
      console.error('Error fetching communes:', error);
      return [];
    }
  },

  createAddress: async (data: { address_line: string; province: number; commune?: number | null; latitude?: number | null; longitude?: number | null }) => {
    const response = await api.post<Address>('/api/addresses/', data);
    const created = response.data;

    if (created?.id) {
      return created;
    }

    const fallbackResponse = await api.get<Address[] | { results?: Address[] }>('/api/addresses/', {
      params: { page_size: 100 }
    });
    const addresses = asList(fallbackResponse?.data);

    const matched = addresses.find((address) =>
      address.address_line === data.address_line &&
      Number(address.province) === Number(data.province) &&
      Number(address.commune ?? 0) === Number(data.commune ?? 0)
    );

    if (!matched?.id) {
      throw new Error('Unable to resolve created address id');
    }

    return matched;
  },

  getAddress: async (id: number) => {
    const response = await api.get<Address>(`/api/addresses/${id}/`);
    return response.data;
  }
};
