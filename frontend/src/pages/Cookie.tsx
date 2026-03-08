import { motion } from 'framer-motion';
import { Cookie as CookieIcon, Info, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Cookie() {
    return (
        <div className="relative min-h-screen py-24 bg-gray-50/50">
            <div className="max-w-4xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <Badge className="bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100 mb-6 px-4 py-1.5 font-semibold">
                        <CookieIcon className="w-4 h-4 mr-2 inline" />
                        Chính Sách Cookie
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-6">
                        Sử Dụng Cookie
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto md:text-lg">
                        Cập nhật lần cuối: Tháng 3 năm 2026. Tìm hiểu cách chúng tôi sử dụng cookie để nâng cao trải nghiệm của bạn.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-sm prose prose-amber max-w-none"
                >
                    <div className="flex items-center gap-3 mb-8 text-amber-600">
                        <Info className="w-8 h-8" />
                        <h2 className="text-2xl font-bold m-0 text-gray-900">1. Cookie là gì?</h2>
                    </div>
                    <p className="text-gray-600 leading-relaxed mb-8">
                        Cookie là các tệp văn bản nhỏ được lưu trữ trên thiết bị của bạn khi bạn truy cập trang web.
                        Chúng tôi và các đối tác của chúng tôi sử dụng cookie để ghi nhớ các tùy chọn của bạn, phân tích lượng truy cập
                        và tối ưu hóa trải nghiệm tìm việc trên JOBIO.
                    </p>

                    <div className="flex items-center gap-3 mb-8 mt-12 text-amber-600">
                        <Database className="w-8 h-8" />
                        <h2 className="text-2xl font-bold m-0 text-gray-900">2. Các loại Cookie chúng tôi sử dụng</h2>
                    </div>
                    <ul className="space-y-4 text-gray-600 mb-8 list-none pl-0">
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2.5 shrink-0" />
                            <span><strong className="text-gray-900">Cookie thiết yếu:</strong> Cần thiết cho các chức năng cơ bản của nền tảng (như Đăng nhập, Ứng tuyển).</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2.5 shrink-0" />
                            <span><strong className="text-gray-900">Cookie phân tích:</strong> Giúp chúng tôi hiểu cách bạn tương tác với JOBIO để cải thiện trang web.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2.5 shrink-0" />
                            <span><strong className="text-gray-900">Cookie tiếp thị:</strong> Sử dụng để theo dõi khách truy cập trên nhiều website nhằm phân phối quảng cáo phù hợp và hữu ích (nếu có).</span>
                        </li>
                    </ul>

                </motion.div>
            </div>
        </div>
    );
}
