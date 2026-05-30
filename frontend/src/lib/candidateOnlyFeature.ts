import { toast } from 'sonner';

export function showCandidateOnlyFeatureWarning(featureName: string) {
    toast.warning('Chức năng này không dành cho bạn', {
        description: `Tính năng "${featureName}" chỉ dành cho tài khoản Người tìm việc.`,
    });
}
