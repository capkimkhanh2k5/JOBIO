import api from './api';
import { Referral, ReferralProgram, PaginatedResponse } from '@/types/api';

export const referralService = {
  /** List active referral programs */
  listPrograms: async (): Promise<PaginatedResponse<ReferralProgram>> => {
    const response = await api.get('/api/social/referral-programs/');
    return response.data;
  },

  /** List referrals made by current user */
  listReferrals: async (): Promise<PaginatedResponse<Referral>> => {
    const response = await api.get('/api/social/referrals/');
    return response.data;
  },

  /** Create a new referral */
  createReferral: async (data: {
    program?: number;
    job: number;
    referred_email: string;
    referred_name: string;
    referred_phone?: string;
    notes?: string;
  }): Promise<Referral> => {
    const response = await api.post('/api/social/referrals/', data);
    return response.data;
  }
};

export default referralService;
