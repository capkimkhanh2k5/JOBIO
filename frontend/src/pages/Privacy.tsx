import { motion } from 'framer-motion';
import { Lock, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Privacy() {
    return (
        <div className="relative min-h-screen py-24 bg-gray-50/50">
            <div className="max-w-4xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 mb-6 px-4 py-1.5 font-semibold">
                        <Lock className="w-4 h-4 mr-2 inline" />
                        Chính Sách Bảo Mật
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-6">
                        Bảo Mật Quyền Riêng Tư
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto md:text-lg">
                        Cập nhật lần cuối: Tháng 3 năm 2026. Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-sm prose prose-emerald max-w-none"
                >
                    <div className="flex items-center gap-3 mb-8 text-emerald-600">
                        <FileText className="w-8 h-8" />
                        <h2 className="text-2xl font-bold m-0 text-gray-900">1. Thu thập thông tin</h2>
                    </div>
                    <p className="text-gray-600 leading-relaxed mb-8">
                        Chúng tôi thu thập các thông tin cá nhân mà bạn cung cấp khi tạo tài khoản, cập nhật hồ sơ, ứng tuyển việc làm,
                        hoặc đăng ký nhận bản tin. Điều này bao gồm tên, địa chỉ email, số điện thoại, CV, và dữ liệu sử dụng nền tảng.
                    </p>

                    <div className="flex items-center gap-3 mb-8 mt-12 text-emerald-600">
                        <CheckCircle2 className="w-8 h-8" />
                        <h2 className="text-2xl font-bold m-0 text-gray-900">2. Sử dụng thông tin</h2>
                    </div>
                    <ul className="space-y-4 text-gray-600 mb-8 list-none pl-0">
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 shrink-0" />
                            <span>Cung cấp, duy trì và cải thiện dịch vụ của JOBIO và công nghệ AI Matching.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 shrink-0" />
                            <span>Kết nối tài năng của bạn tới các nhà tuyển dụng tiềm năng nhất.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 shrink-0" />
                            <span>Gửi cảnh báo việc làm, cập nhật bảo mật và tin nhắn hỗ trợ.</span>
                        </li>
                    </ul>

                    <div className="flex items-center gap-3 mb-8 mt-12 text-emerald-600">
                        <ShieldAlert className="w-8 h-8" />
                        <h2 className="text-2xl font-bold m-0 text-gray-900">3. Chia sẻ thông tin</h2>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                        Thông tin của bạn (đặc biệt là hồ sơ và CV) sẽ chỉ được chia sẻ cho nhà tuyển dụng khi bạn
                        chủ động ứng tuyển hoặc khi bạn bật tính năng "Cho phép nhà tuyển dụng tìm thấy tôi". Chúng tôi
                        không bán, trao đổi thông tin cá nhân của bạn cho bên thứ ba vì mục đích tiếp thị mà không có sự cho phép rõ ràng.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
