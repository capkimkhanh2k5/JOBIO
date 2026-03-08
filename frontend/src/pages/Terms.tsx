import { motion } from 'framer-motion';
import { Shield, FileText, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Terms() {
    return (
        <div className="relative min-h-screen py-24 bg-gray-50/50">
            <div className="max-w-4xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 mb-6 px-4 py-1.5 font-semibold">
                        <FileText className="w-4 h-4 mr-2 inline" />
                        Chính Sách Pháp Lý
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-6">
                        Điều Khoản Sử Dụng
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto md:text-lg">
                        Cập nhật lần cuối: Tháng 3 năm 2026. Vui lòng đọc kỹ các điều khoản dưới đây trước khi sử dụng nền tảng JOBIO.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-sm prose prose-indigo max-w-none"
                >
                    <div className="flex items-center gap-3 mb-8 text-primary">
                        <Shield className="w-8 h-8" />
                        <h2 className="text-2xl font-bold m-0 text-gray-900">1. Chấp nhận Điều khoản</h2>
                    </div>
                    <p className="text-gray-600 leading-relaxed mb-8">
                        Bằng việc truy cập và sử dụng trang web JOBIO, bạn đồng ý tuân thủ và bị ràng buộc bởi các Điều khoản
                        sử dụng này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản, bạn không được phép
                        truy cập hoặc sử dụng dịch vụ của chúng tôi.
                    </p>

                    <div className="flex items-center gap-3 mb-8 mt-12 text-primary">
                        <CheckCircle2 className="w-8 h-8" />
                        <h2 className="text-2xl font-bold m-0 text-gray-900">2. Quyền và Trách nhiệm của Người dùng</h2>
                    </div>
                    <ul className="space-y-4 text-gray-600 mb-8 list-none pl-0">
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
                            <span>Bạn cam kết cung cấp thông tin cá nhân và hồ sơ chính xác, có tính xác thực cao.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
                            <span>Không sử dụng nền tảng cho các mục đích lừa đảo, phát tán mã độc.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
                            <span>Trách nhiệm bảo mật thông tin tài khoản hoàn toàn thuộc về bạn.</span>
                        </li>
                    </ul>

                    <div className="flex items-center gap-3 mb-8 mt-12 text-primary">
                        <FileText className="w-8 h-8" />
                        <h2 className="text-2xl font-bold m-0 text-gray-900">3. Quyền Sở hữu Trí tuệ</h2>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                        Tất cả nội dung trên JOBIO bao gồm nhưng không giới hạn ở văn bản, đồ họa, logo, hình ảnh,
                        và phần mềm đều thuộc bản quyền của JOBIO hoặc các đối tác cung cấp nội dung của chúng tôi,
                        được bảo vệ bởi luật sở hữu trí tuệ Việt Nam và quốc tế.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
