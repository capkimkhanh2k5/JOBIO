import type { User } from '@/types/api';

export function getCandidateId(user: Pick<User, 'candidate_id' | 'recruiter_id'> | null | undefined) {
  return user?.candidate_id ?? user?.recruiter_id;
}
