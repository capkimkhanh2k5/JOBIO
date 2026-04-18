import { useState } from 'react';
import type { CandidateDetail } from '@/types/api';
import { User } from 'lucide-react';

export const ProfileCover = ({ profile }: { profile: CandidateDetail }) => {
    // Default Facebook-style cover and avatar background
    const defaultCoverBg = 'bg-[#F0F2F5]'; // Typical FB light gray

    const [imgError, setImgError] = useState(false);


    return (
        <div className="w-full bg-white relative">
            {/* Cover Photo */}
            <div className={`w-full h-64 md:h-80 ${defaultCoverBg} shadow-inner`}></div>

            <div className="container mx-auto px-4 max-w-6xl relative">
                <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-20 pb-6">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white overflow-hidden bg-white shadow-xl relative z-10">
                            {profile.user?.avatar_url && !imgError ? (
                                <img
                                    src={profile.user.avatar_url}
                                    alt={profile.user.full_name}
                                    className="w-full h-full object-cover"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <div className="w-full h-full bg-[#E4E6EB] flex items-center justify-center text-[#BCC0C4]">
                                    <User className="w-20 h-20" fill="currentColor" strokeWidth={0} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Name & Title */}
                    <div className="mt-4 md:mt-0 md:ml-6 flex-1 text-center md:text-left">
                        <h1 className="text-3xl font-bold text-slate-900">{profile.user?.full_name || 'Ứng viên'}</h1>
                        <p className="text-lg text-muted-foreground mt-1">
                            {(profile.years_of_experience ?? 0) > 0
                                ? `${profile.years_of_experience} năm kinh nghiệm`
                                : 'Mới tốt nghiệp'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
