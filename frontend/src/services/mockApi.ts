// Giả lập backend endpoint và delay mạng
export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

let mockApplicationsCache: any[] | null = null;

let mockCandidateApplications: any[] = Array(15).fill(null).map((_, i) => ({
    id: `cand-app-${i}`,
    job_title: ["Frontend Developer", "Senior UI Developer", "React Engineer", "Software Engineer Frontend", "Web Developer"][i % 5],
    company: ["TechCorp", "VNG", "FPT", "Viettel", "Vinsmart"][i % 5],
    logo_url: `https://api.dicebear.com/7.x/shapes/svg?seed=Comp${i}`,
    status: ["Mới gửi", "Đang xét", "Shortlisted", "Phỏng vấn", "Đề nghị", "Đã tuyển", "Từ chối", "Rút đơn"][i % 8],
    applied_at: new Date(Date.now() - i * 86400000 * 3).toISOString(),
    ai_score: 50 + Math.floor(Math.random() * 50),
    cv_name: `Frontend_CV_v${i + 1}.pdf`,
    cv_url: `https://example.com/cv-${i}.pdf`,
    cover_letter: "Kính gửi nhà tuyển dụng, tôi rất quan tâm đến vị trí này..."
}));

const getMockApplications = () => {
    if (mockApplicationsCache) return mockApplicationsCache;
    const statuses = ['Submitted', 'Reviewing', 'Shortlisted', 'Interview', 'Offered', 'Hired', 'Rejected', 'Withdrawn'];
    const jobs = ["Senior Frontend", "Product Manager", "UI/UX Designer"];
    const names = ["Trần Minh Đức", "Nguyễn Hồng Anh", "Lê Quang Hùng", "Phạm Thị Lan", "Võ Văn Nam"];

    mockApplicationsCache = Array(40).fill(null).map((_, i) => ({
        id: `app-${i}`,
        job_id: `job-${i % 3}`,
        candidate_id: `cand-${i}`,
        candidate_name: names[i % names.length],
        candidate_avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=App${i}`,
        candidate_email: `applicant${i}@example.com`,
        candidate_phone: `091122334${i % 10}`,
        job_title: jobs[i % jobs.length],
        status: statuses[i % statuses.length],
        ai_score: 40 + Math.floor(Math.random() * 60),
        applied_at: new Date(Date.now() - i * 86400000 * 2).toISOString(),
        cv_url: "https://example.com/cv.pdf",
        cover_letter: "I am very interested in this role...",
        skills: ["React", "Vue", "Figma", "Node.js", "Python"].sort(() => 0.5 - Math.random()).slice(0, 3),
        rating: Math.floor(Math.random() * 5) + 1,
        experience_years: Math.floor(Math.random() * 10) + 1
    }));
    return mockApplicationsCache;
};

export const mockApi = {
    getProvinces: async () => {
        await delay(300);
        return ["Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Bình Dương"];
    },
    getStats: async () => {
        await delay(400);
        return { total_jobs: 12540, total_companies: 3450, total_users: 154200 };
    },
    getFeaturedJobs: async () => {
        await delay(600);
        return Array(8).fill(null).map((_, i) => ({
            id: `f-${i}`,
            title: ["Senior Frontend Engineer", "Product Manager", "UI/UX Designer", "Backend Developer", "DevOps Engineer", "Project Manager", "Data Scientist", "Mobile Developer"][i % 8],
            company_name: ["TechCorp", "InnovateVN", "FintechX", "HealthStartup", "GreenEnergy", "EduLink", "LogiTech", "AutoAI"][i % 8],
            logo_url: `https://api.dicebear.com/7.x/initials/svg?seed=C${i}`,
            job_type: i % 2 === 0 ? "full_time" : "contract",
            level: i % 3 === 0 ? "senior" : i % 3 === 1 ? "middle" : "junior",
            salary_min: 1500 + (i * 100),
            salary_max: 3000 + (i * 200),
            salary_currency: "USD",
            is_salary_visible: true,
            locations: ["Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Remote"][i % 4],
            is_remote: i % 2 === 0,
            deadline: "2024-12-31",
            created_at: new Date().toISOString(),
            is_featured: true,
            views_count: Math.floor(Math.random() * 1000),
            applications_count: Math.floor(Math.random() * 50),
            skills: ["React", "TypeScript", "TailwindCSS"].slice(0, (i % 3) + 1),
            match_score: 85 + (i % 15)
        }));
    },
    getJobs: async (params: any) => {
        await delay(800);
        const { search, category, province, job_type, level, salary_min, salary_max, is_remote, experience_min, experience_max, skills } = params;

        let jobs = Array(40).fill(null).map((_, i) => ({
            id: i.toString(),
            title: ["Frotnend Dev", "Backend Dev", "Designer", "Mobile Dev", "DevOps", "Data Science", "Tester", "Product Owner"][i % 8] + " " + i,
            company_id: (i % 8).toString(),
            company_name: ["Google", "Microsoft", "Amazon", "Meta", "VinFast", "FPT Software", "VNG Corporation", "Viettel"][i % 8],
            industry_name: ["Technology", "Software", "E-commerce", "Social Media", "Automotive", "IT Services", "Gaming", "Telecommunications"][i % 8],
            logo_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${i % 8}`,
            job_type: ["full_time", "part_time", "contract", "internship", "freelance"][i % 5],
            level: ["intern", "fresher", "junior", "middle", "senior", "lead", "manager", "director"][i % 8],
            salary_min: 500 + (i * 100),
            salary_max: 1500 + (i * 200),
            salary_currency: "USD",
            is_salary_visible: i % 7 !== 0,
            locations: ["Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Bình Dương"][i % 5],
            is_remote: i % 3 === 0,
            deadline: "2024-12-31",
            created_at: new Date(Date.now() - i * 3600000).toISOString(),
            is_featured: i % 10 === 0,
            views_count: Math.floor(Math.random() * 2000),
            applications_count: Math.floor(Math.random() * 100),
            skills: ["React", "Node.js", "Python", "Docker", "Figma", "AWS", "Go", "SQL"].slice(i % 4, (i % 4) + 3),
            match_score: Math.floor(Math.random() * 40) + 60
        }));

        if (search) {
            jobs = jobs.filter(j => j.title.toLowerCase().includes(search.toLowerCase()) || j.company_name.toLowerCase().includes(search.toLowerCase()));
        }
        if (category && category !== 'all') {
            jobs = jobs.filter(j => j.industry_name === category || j.industry_name.toLowerCase().includes(category.toLowerCase()));
        }
        if (province && province !== 'all') {
            jobs = jobs.filter(j => j.locations === province);
        }
        if (job_type && job_type.length > 0) {
            jobs = jobs.filter(j => job_type.includes(j.job_type));
        }
        if (level && level.length > 0) {
            jobs = jobs.filter(j => level.includes(j.level));
        }
        if (salary_min) {
            jobs = jobs.filter(j => j.salary_max >= salary_min);
        }
        if (salary_max) {
            jobs = jobs.filter(j => j.salary_min <= salary_max);
        }
        if (is_remote !== undefined && is_remote !== null) {
            if (is_remote) jobs = jobs.filter(j => j.is_remote);
        }
        if (skills && skills.length > 0) {
            jobs = jobs.filter(j => skills.some((s: string) => j.skills.includes(s)));
        }

        return {
            items: jobs,
            total: jobs.length
        };
    },
    saveJob: async (jobId: string) => {
        await delay(300);
        return { success: true };
    },
    unsaveJob: async (jobId: string) => {
        await delay(300);
        return { success: true };
    },
    getSavedJobsList: async () => {
        await delay(400);
        const statuses = ["Mới lưu", "Sắp hết hạn", "Đang hot"];
        return Array(6).fill(null).map((_, i) => ({
            id: `sj-${i}`,
            job_id: `job-${i}`,
            title: ["Frotnend Dev", "Backend Dev", "Designer", "Mobile Dev", "DevOps", "Data Science"][i],
            company_name: ["Google", "Microsoft", "Amazon", "Meta", "VinFast", "FPT Software"][i],
            logo_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${i}`,
            locations: ["Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Bình Dương", "Remote"][i],
            job_type: i % 2 === 0 ? "full_time" : "contract",
            salary_min: 1000 + (i * 200),
            salary_max: 2000 + (i * 300),
            salary_currency: "USD",
            is_salary_visible: true,
            status: statuses[i % statuses.length],
            notes: i % 2 === 0 ? "Cần ôn lại React custom hooks trước khi apply" : "",
            saved_at: new Date(Date.now() - i * 86400000).toISOString(),
            deadline: new Date(Date.now() + (10 - i) * 86400000).toISOString(),
        }));
    },
    removeSavedJob: async (id: string) => {
        await delay(300);
        return { success: true };
    },
    updateSavedJobNote: async (id: string, note: string) => {
        await delay(300);
        return { success: true, note };
    },
    // Job Alerts
    getJobAlerts: async () => {
        await delay(500);
        return [
            {
                id: "ja-1",
                alert_name: "Frontend Developer in HCM",
                keywords: "React, TypeScript",
                category: "Technology",
                locations: ["Hồ Chí Minh"],
                skills: ["React", "TypeScript"],
                job_type: ["full_time"],
                level: ["senior", "middle"],
                salary_min: 1500,
                frequency: "daily",
                email_notification: true,
                use_ai_matching: true,
                is_active: true,
                last_sent_date: new Date(Date.now() - 86400000).toISOString(),
            },
            {
                id: "ja-2",
                alert_name: "Remote Backend Jobs",
                keywords: "Node.js, AWS",
                category: "Technology",
                locations: ["Remote"],
                skills: ["Node.js", "Docker", "AWS"],
                job_type: ["full_time", "contract"],
                level: ["senior"],
                salary_min: 2500,
                frequency: "weekly",
                email_notification: true,
                use_ai_matching: false,
                is_active: false,
                last_sent_date: new Date(Date.now() - 7 * 86400000).toISOString(),
            }
        ];
    },
    createJobAlert: async (data: any) => {
        await delay(600);
        return { success: true, id: `ja-${Math.random().toString(36).substring(7)}` };
    },
    updateJobAlert: async (id: string, data: any) => {
        await delay(400);
        return { success: true, id };
    },
    deleteJobAlert: async (id: string) => {
        await delay(300);
        return { success: true };
    },
    toggleJobAlert: async (id: string, is_active: boolean) => {
        await delay(300);
        return { success: true };
    },
    getMatchedJobsForAlert: async (id: string) => {
        await delay(600);
        return Array(4).fill(null).map((_, i) => ({
            id: `mj-${i}`,
            title: ["Senior React Engineer", "Fullstack Developer (React/Node)", "Frontend Lead", "UI Developer"][i],
            company_name: ["TechCorp", "VNG", "InnovateVN", "StartUp Hub"][i],
            logo_url: `https://api.dicebear.com/7.x/shapes/svg?seed=m${i}`,
            locations: "Hồ Chí Minh",
            salary_min: 1500 + i * 200,
            salary_max: 3000 + i * 200,
            salary_currency: "USD",
            match_score: 95 - i * 5,
            is_sent: i > 0,
            is_viewed: i > 1,
            created_at: new Date(Date.now() - i * 3600000).toISOString(),
        }));
    },
    getFeaturedCompanies: async () => {
        await delay(500);
        return Array(8).fill(null).map((_, i) => ({
            id: i.toString(),
            company_name: ["Google", "Microsoft", "Amazon", "Meta", "VinFast", "FPT Software", "VNG Corporation", "Viettel"][i % 8],
            industry_name: ["Technology", "Software", "E-commerce", "Social Media", "Automotive", "IT Services", "Gaming", "Telecommunications"][i % 8],
            logo_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${i}`,
            job_count: Math.floor(Math.random() * 50) + 1
        }));
    },
    getCategories: async () => {
        await delay(400);
        return [
            { id: "it", name: "IT Software", icon_url: "Laptop", job_count: 3200, slug: "it-software" },
            { id: "marketing", name: "Marketing", icon_url: "Megaphone", job_count: 1450, slug: "marketing" },
            { id: "design", name: "Design", icon_url: "PenTool", job_count: 980, slug: "design" },
            { id: "finance", name: "Finance", icon_url: "PieChart", job_count: 650, slug: "finance" },
            { id: "health", name: "Healthcare", icon_url: "Stethoscope", job_count: 420, slug: "healthcare" },
            { id: "edu", name: "Education", icon_url: "GraduationCap", job_count: 310, slug: "education" },
        ]
    },
    getIndustries: async () => {
        await delay(400);
        return [
            { id: "1", name: "Công nghệ thông tin", icon_url: "Monitor", company_count: 1200 },
            { id: "2", name: "Tài chính - Ngân hàng", icon_url: "Landmark", company_count: 450 },
            { id: "3", name: "Bất động sản", icon_url: "Home", company_count: 320 },
            { id: "4", name: "Sản xuất", icon_url: "Factory", company_count: 280 },
            { id: "5", name: "Bán lẻ", icon_url: "ShoppingBag", company_count: 210 },
            { id: "6", name: "Dịch vụ khách hàng", icon_url: "Headphones", company_count: 150 },
        ];
    },
    getJobById: async (id: string) => {
        await delay(600);
        // Find in featured jobs or normal jobs or generate mock
        const mockJob = {
            id,
            title: "Senior Frontend Engineer (React/TypeScript)",
            company_id: "c1",
            company_name: "JOBIO NextGen",
            industry_name: "Technology",
            logo_url: "https://api.dicebear.com/7.x/shapes/svg?seed=JOBIO",
            banner_url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
            job_type: "full_time",
            level: "senior",
            salary_min: 2500,
            salary_max: 4500,
            salary_currency: "USD",
            is_salary_visible: true,
            is_remote: true,
            deadline: "2024-05-30",
            created_at: new Date().toISOString(),
            is_featured: true,
            views_count: 1240,
            applications_count: 45,
            experience_min: 3,
            experience_max: 6,
            quantity: 2,
            description: `
                <p>Chúng tôi đang tìm kiếm một Senior Frontend Engineer tài năng để tham gia vào đội ngũ phát triển sản phẩm đột phá JOBIO. Bạn sẽ chịu trách nhiệm chính trong việc xây dựng trải nghiệm người dùng hiện đại, hiệu năng cao và mượt mà.</p>
                <ul>
                    <li>Phát triển các component UI phức tạp sử dụng React và Framer Motion.</li>
                    <li>Tối ưu hóa hiệu năng ứng dụng cho cả Desktop và Mobile.</li>
                    <li>Cùng team thiết kế đưa ra các giải pháp UX sáng tạo.</li>
                    <li>Code review và hướng dẫn các thành viên junior.</li>
                </ul>
            `,
            requirements: `
                <ul>
                    <li>Ít nhất 4 năm kinh nghiệm làm việc chuyên sâu với React.</li>
                    <li>Thành thạo TypeScript và các pattern nâng cao.</li>
                    <li>Kinh nghiệm tốt với TailwindCSS và animation libraries (Framer Motion, GSAP).</li>
                    <li>Am hiểu về Web Performance Tuning và Accessibility.</li>
                    <li>Có tư duy sản phẩm và khả năng giao tiếp tốt.</li>
                </ul>
            `,
            benefits: `
                <ul>
                    <li>Mức lương cạnh tranh lên tới $4500 + Bonus theo performance.</li>
                    <li>Làm việc Remote 100% hoặc hybrid tùy chọn.</li>
                    <li>Gói bảo hiểm sức khỏe cao cấp cho bản thân và gia đình.</li>
                    <li>Cung cấp MacBook Pro/Màn hình 4K đời mới nhất.</li>
                    <li>15 ngày phép năm và các ngày nghỉ lễ theo quy định.</li>
                    <li>Môi trường startup năng động, không ngại thay đổi.</li>
                </ul>
            `
        };
        return mockJob;
    },
    getJobSkills: async (jobId: string) => {
        await delay(400);
        return [
            { id: "s1", name: "React", is_required: true, proficiency_level: "expert" },
            { id: "s2", name: "TypeScript", is_required: true, proficiency_level: "advanced" },
            { id: "s3", name: "Framer Motion", is_required: false, proficiency_level: "middle" },
            { id: "s4", name: "TailwindCSS", is_required: true, proficiency_level: "advanced" },
            { id: "s5", name: "GSAP", is_required: false, proficiency_level: "basic" }
        ];
    },
    getJobLocations: async (jobId: string) => {
        await delay(300);
        return [
            { id: "l1", province: "Hồ Chí Minh", address: "Q1, TP.HCM" },
            { id: "l2", province: "Hà Nội", address: "Cầu Giấy, Hà Nội" }
        ];
    },
    getRequiredTests: async (jobId: string) => {
        await delay(500);
        return [
            { id: "t1", title: "React Core Concepts", type: "Multiple Choice", difficulty: "Intermediate", duration: 30, is_mandatory: true, minimum_score: 70 },
            { id: "t2", title: "Algorithmic Thinking", type: "Coding", difficulty: "Hard", duration: 60, is_mandatory: true, minimum_score: 60 }
        ];
    },
    getCompanyById: async (id: string) => {
        await delay(600);
        return {
            id,
            company_name: "JOBIO NextGen",
            industry_name: "Technology & HR Tech",
            logo_url: "https://api.dicebear.com/7.x/shapes/svg?seed=JOBIO",
            banner_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
            company_size: "50-150 nhân viên",
            founded_year: "2020",
            website_url: "https://jobio.dev",
            verification_status: "verified",
            follower_count: 12500,
            job_count: 12,
            description: "JOBIO là nền tảng tuyển dụng thế hệ mới, ứng dụng AI để kết nối ứng viên và nhà tuyển dụng một cách thông minh và hiệu quả nhất. Chúng tôi tập trung vào việc tạo ra trải nghiệm người dùng tuyệt vời và quy trình kết nối minh bạch. Với đội ngũ kỹ sư và chuyên gia HR dày dặn kinh nghiệm, JOBIO cam kết mang đến giá trị thực sự cho cả ứng viên và doanh nghiệp.",
            headquarters: "123 Lê Lợi, Quận 1, Hồ Chí Minh, Việt Nam",
            tax_code: "0123456789",
            benefits: [
                { id: "b1", category: "Chăm sóc sức khỏe", name: "Bảo hiểm PVI", description: "Gói bảo hiểm sức khỏe cao cấp cho nhân viên và người thân.", icon_url: "HeartPulse" },
                { id: "b2", category: "Phát triển bản thân", name: "Trợ cấp học tập", description: "Ngân sách $500/năm cho các khóa học và chứng chỉ chuyên môn.", icon_url: "GraduationCap" },
                { id: "b3", category: "Môi trường làm việc", name: "Làm việc từ xa", description: "Chính sách Remote 2 ngày/tuần linh hoạt.", icon_url: "MapPin" },
                { id: "b4", category: "Giải trí", name: "Happy Hour", description: "Tiệc trà chiều và giao lưu mỗi thứ 6 hàng tuần.", icon_url: "Beer" }
            ]
        };
    },
    getCompanyJobs: async (id: string) => {
        await delay(500);
        return Array(6).fill(null).map((_, i) => ({
            id: `cj-${i}`,
            title: ["Senior React Developer", "UI/UX Designer", "Product Owner", "Backend Engineer", "DevOps Specialist", "Marketing Manager"][i % 6],
            company_name: "JOBIO NextGen",
            logo_url: "https://api.dicebear.com/7.x/shapes/svg?seed=JOBIO",
            job_type: i % 2 === 0 ? "full_time" : "contract",
            level: i % 3 === 0 ? "senior" : "middle",
            salary_min: 1500 + (i * 200),
            salary_max: 3000 + (i * 300),
            salary_currency: "USD",
            is_salary_visible: true,
            locations: "Hồ Chí Minh",
            is_remote: i % 3 === 0,
            created_at: new Date(Date.now() - i * 86400000).toISOString(),
            is_featured: i === 0,
            skills: ["React", "TypeScript", "Node.js", "Docker", "AWS"].slice(i % 3, (i % 3) + 3),
            views_count: Math.floor(Math.random() * 500) + 50,
            applications_count: Math.floor(Math.random() * 30) + 5,
            match_score: 90 - i
        }));
    },
    getCompanyReviews: async (id: string) => {
        await delay(700);
        return {
            average_rating: 4.5,
            rating_breakdown: [
                { label: "Môi trường", rating: 4.8 },
                { label: "Lương thưởng", rating: 4.2 },
                { label: "Đào tạo", rating: 4.5 },
                { label: "Cơ hội thăng tiến", rating: 4.3 },
                { label: "Quản lý", rating: 4.7 }
            ],
            reviews: [
                {
                    id: "r1",
                    rating: 5,
                    title: "Môi trường làm việc tuyệt vời",
                    content: "Công ty có văn hóa rất mở, đồng nghiệp hỗ trợ nhau nhiệt tình. Tech stack hiện đại.",
                    pros: "Văn hóa tốt, lương cạnh tranh.",
                    cons: "Đôi khi phải OT khi có release lớn.",
                    employment_status: "Đang làm việc",
                    is_anonymous: false,
                    user_name: "Trần Anh Tuấn",
                    user_avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tuấn",
                    position: "Senior Frontend",
                    created_at: "2024-01-15",
                    helpful_count: 12
                },
                {
                    id: "r2",
                    rating: 4,
                    title: "Nơi tốt để phát triển",
                    content: "Cơ hội học tập nhiều, được tiếp cận với nhiều công nghệ mới.",
                    pros: "Chế độ review lương minh bạch.",
                    cons: "Văn phòng hơi nhỏ.",
                    employment_status: "Đã nghỉ việc",
                    is_anonymous: true,
                    created_at: "2023-11-20",
                    helpful_count: 5
                }
            ]
        };
    },
    getCompanyFollowers: async (id: string) => {
        await delay(400);
        return Array(10).fill(null).map((_, i) => ({
            id: `f-${i}`,
            full_name: `Follower ${i + 1}`,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=F${i}`,
            current_position: i % 2 === 0 ? "Software Engineer" : "UI/UX Designer"
        }));
    },
    getCompanyStats: async (id: string) => {
        await delay(300);
        return {
            job_count: 12,
            follower_count: 12500,
            review_count: 48,
            avg_rating: 4.5,
            application_count: 450
        };
    },
    getCompanyMedia: async (companyId: string) => {
        await delay(500);
        return [
            { id: "m1", media_type: "image", url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80", title: "Văn phòng làm việc" },
            { id: "m2", media_type: "image", url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80", title: "Team building 2023" },
            { id: "m3", media_type: "image", url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80", title: "Góc thư giãn" },
            { id: "m4", media_type: "video", url: "https://www.w3schools.com/html/mov_bbb.mp4", thumbnail: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80", title: "Giới thiệu văn hóa công ty" }
        ];
    },
    isFollowingCompany: async (id: string) => {
        await delay(300);
        return { is_following: Math.random() > 0.5 };
    },
    followCompany: async (id: string) => {
        await delay(300);
        return { success: true };
    },
    unfollowCompany: async (id: string) => {
        await delay(300);
        return { success: true };
    },
    markReviewHelpful: async (id: string) => {
        await delay(300);
        return { success: true };
    },
    reportReview: async (id: string) => {
        await delay(300);
        return { success: true };
    },
    applyForJob: async (data: { jobId: string, cvId: string, coverLetter?: string }) => {
        await delay(1000);
        return { success: true, application_id: "app_" + Math.random().toString(36).substr(2, 9) };
    },
    getRecruiterCvs: async (recruiterId: string) => {
        await delay(500);
        return [
            { id: "cv1", name: "Frontend_Developer_Dev.pdf", uploaded_at: "2024-02-15" },
            { id: "cv2", name: "Fullstack_Engineer_Portfolio.pdf", uploaded_at: "2023-11-10" }
        ];
    },
    // Keep existing profile related endpoints
    getProfile: async (id: string) => {
        await delay(600);
        return {
            id,
            full_name: "Nguyễn Văn A",
            email: "anv@example.com",
            phone: "0901234567",
            avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anv",
            current_position: "Senior Frontend Engineer",
            current_company: "JOBIO Tech",
            job_search_status: "active",
            is_profile_public: true,
            dob: "1995-10-20",
            gender: "male",
            bio: "Đam mê xây dựng sản phẩm chất lượng với trải nghiệm người dùng tuyệt vời. Có 5 năm kinh nghiệm trong lĩnh vực Frontend.",
            address: {
                province: "Hồ Chí Minh",
                commune: "Phường Bến Nghé",
                address_line: "123 Lê Lợi, Quận 1"
            },
            social_links: {
                linkedin: "https://linkedin.com/in/anv",
                facebook: "https://facebook.com/anv",
                github: "https://github.com/anv",
                portfolio: "https://anv.dev"
            },
            desired_salary: {
                min: 2500,
                max: 4000,
                currency: "USD"
            },
            available_from: "2024-04-01",
            years_of_experience: 5,
            highest_education: "Bachelor"
        };
    },
    updateProfile: async (id: string, data: any) => {
        await delay(800);
        return { success: true, data };
    },
    getEducation: async (id: string) => {
        await delay(500);
        return [
            {
                id: "edu1",
                school_name: "Đại học Bách Khoa TP.HCM",
                degree: "Bachelor",
                field_of_study: "Computer Science",
                start_date: "2013-09-01",
                end_date: "2017-06-30",
                is_current: false,
                gpa: "3.6/4.0",
                description: "Tốt nghiệp loại Giỏi"
            }
        ];
    },
    getExperience: async (id: string) => {
        await delay(600);
        return [
            {
                id: "exp1",
                company_name: "Tech Solutions Inc.",
                job_title: "Frontend Developer",
                industry: "Information Technology",
                start_date: "2018-01-01",
                end_date: "2021-12-31",
                is_current: false,
                description: "Build scalable web apps using React and Redux.",
                location: "Hồ Chí Minh"
            }
        ];
    },
    getSkills: async (id: string) => {
        await delay(400);
        return [
            { id: "s1", name: "React", proficiency_level: "expert", years_of_experience: 5, endorsement_count: 12, is_verified: true },
            { id: "s2", name: "TypeScript", proficiency_level: "advanced", years_of_experience: 4, endorsement_count: 8, is_verified: true },
            { id: "s3", name: "TailwindCSS", proficiency_level: "advanced", years_of_experience: 3, endorsement_count: 5, is_verified: false }
        ];
    },
    searchSkills: async (query: string) => {
        await delay(300);
        const allSkills = ["React", "Vue", "Angular", "Node.js", "Python", "Go", "Docker", "AWS", "Figma", "UI/UX"];
        return allSkills.filter(s => s.toLowerCase().includes(query.toLowerCase()));
    },
    getLanguages: async () => {
        await delay(300);
        return [
            { id: "l1", name: "Tiếng Việt", code: "vi" },
            { id: "l2", name: "Tiếng Anh", code: "en" },
            { id: "l3", name: "Tiếng Nhật", code: "ja" }
        ];
    },
    getProfileCompleteness: async (id: string) => {
        await delay(400);
        return {
            score: 85,
            checklist: [
                { task: "Cập nhật ảnh đại diện", completed: true },
                { task: "Thêm học vấn", completed: true },
                { task: "Thêm kinh nghiệm làm việc", completed: true },
                { task: "Thêm ít nhất 5 kỹ năng", completed: false },
                { task: "Viết giới thiệu bản thân (Bio)", completed: true }
            ]
        };
    },
    // Authentication Endpoints
    login: async (data: any) => {
        await delay(1000);
        if (data.email === "error@example.com") {
            throw new Error("Invalid credentials");
        }
        return {
            access_token: "mock_access_token_" + Math.random().toString(36).substring(7),
            refresh_token: "mock_refresh_token_" + Math.random().toString(36).substring(7),
            user: {
                id: "u1",
                email: data.email,
                full_name: "Mock User",
                role: "candidate",
                avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mock",
                two_factor_enabled: data.email === "2fa@example.com"
            }
        };
    },
    register: async (data: any) => {
        await delay(1200);
        return {
            access_token: "mock_access_token_" + Math.random().toString(36).substring(7),
            refresh_token: "mock_refresh_token_" + Math.random().toString(36).substring(7),
            user: {
                id: "u2",
                email: data.email,
                full_name: data.full_name,
                role: data.role || "candidate",
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.full_name}`
            }
        };
    },
    logout: async (refreshToken: string) => {
        await delay(500);
        return { success: true };
    },
    forgotPassword: async (email: string) => {
        await delay(800);
        return { success: true, message: "Verification email sent" };
    },
    resetPassword: async (data: any) => {
        await delay(1000);
        return { success: true };
    },
    verifyEmail: async (token: string) => {
        await delay(800);
        return { success: true };
    },
    resendVerification: async (email: string) => {
        await delay(600);
        return { success: true };
    },
    checkEmail: async (email: string) => {
        await delay(400);
        const exists = email === "existing@example.com";
        return { exists };
    },
    socialAuth: async (provider: string) => {
        await delay(1500);
        return {
            access_token: "mock_social_token",
            refresh_token: "mock_social_refresh",
            user: {
                id: "su1",
                email: `social_${provider}@example.com`,
                full_name: `Social ${provider} User`,
                role: "candidate",
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider}`
            }
        };
    },
    verify2fa: async (code: string) => {
        await delay(800);
        if (code === "123456") return { success: true };
        throw new Error("Invalid 2FA code");
    },
    changePassword: async (data: any) => {
        await delay(800);
        return { success: true };
    },
    getMe: async () => {
        await delay(500);
        return {
            id: "u1",
            email: "mock@example.com",
            full_name: "Mock User",
            role: "candidate",
            avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mock"
        };
    },
    refreshToken: async (token: string) => {
        await delay(500);
        return {
            access_token: "new_mock_access_token",
            refresh_token: "new_mock_refresh_token"
        };
    },

    // ─── Employer / Dashboard endpoints ───────────────────────────────────

    getEmployerStats: async () => {
        await delay(500);
        return {
            active_jobs: 12,
            new_applications: 48,
            job_views: 3240,
            upcoming_interviews: 5,
            active_jobs_delta: +2,
            new_applications_delta: +14,
            job_views_delta: +8.3,
            upcoming_interviews_delta: 0,
        };
    },

    getNotificationsCount: async () => {
        await delay(200);
        return { unread_count: 7 };
    },

    getRecentNotifications: async () => {
        await delay(400);
        return [
            { id: "n1", title: "Ứng viên mới", message: "Trần Minh Đức vừa ứng tuyển vị trí Senior Frontend", is_read: false, created_at: new Date(Date.now() - 5 * 60000).toISOString(), type: "application" },
            { id: "n2", title: "Phỏng vấn sắp tới", message: "Nhớ phỏng vấn với Nguyễn Hồng Anh lúc 10:00 hôm nay", is_read: false, created_at: new Date(Date.now() - 30 * 60000).toISOString(), type: "interview" },
            { id: "n3", title: "CV đã được xem", message: "3 ứng viên mới đã xem tin tuyển dụng của bạn", is_read: false, created_at: new Date(Date.now() - 2 * 3600000).toISOString(), type: "view" },
            { id: "n4", title: "Tin tuyển dụng sắp hết hạn", message: "Tin 'UI/UX Designer' còn 2 ngày nữa hết hạn", is_read: false, created_at: new Date(Date.now() - 5 * 3600000).toISOString(), type: "warning" },
            { id: "n5", title: "Đánh giá mới", message: "Công ty bạn vừa nhận được 1 đánh giá 5 sao mới", is_read: true, created_at: new Date(Date.now() - 86400000).toISOString(), type: "review" },
        ];
    },

    getUnreadMessagesCount: async () => {
        await delay(200);
        return { unread_count: 3 };
    },

    getRecentApplications: async () => {
        await delay(600);
        const statuses = ["pending", "reviewing", "interview", "offer", "rejected"];
        const positions = ["Senior Frontend Engineer", "UI/UX Designer", "Product Manager", "Backend Developer", "DevOps Engineer", "Data Scientist", "Mobile Developer", "QA Engineer", "Marketing Lead", "HR Manager"];
        const names = ["Trần Minh Đức", "Nguyễn Hồng Anh", "Lê Quang Hùng", "Phạm Thị Lan", "Võ Văn Nam", "Đỗ Thị Mai", "Bùi Thanh Tùng", "Hoàng Thị Thu", "Đinh Văn Bảo", "Chu Thị Hoa"];
        return Array(10).fill(null).map((_, i) => ({
            id: `app-${i}`,
            candidate_name: names[i],
            candidate_avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${names[i]}`,
            position: positions[i],
            status: statuses[i % statuses.length],
            ai_score: Math.floor(Math.random() * 30) + 70,
            applied_at: new Date(Date.now() - i * 3600000 * 4).toISOString(),
        }));
    },

    getUpcomingInterviews: async () => {
        await delay(500);
        const types = ["video", "phone", "onsite"];
        const names = ["Trần Minh Đức", "Nguyễn Hồng Anh", "Lê Quang Hùng", "Phạm Thị Lan", "Võ Văn Nam"];
        const jobs = ["Senior Frontend Engineer", "UI/UX Designer", "Product Manager", "Backend Developer", "DevOps Engineer"];
        return Array(5).fill(null).map((_, i) => ({
            id: `int-${i}`,
            candidate_name: names[i],
            candidate_avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${names[i]}`,
            job_title: jobs[i],
            scheduled_at: new Date(Date.now() + (i + 1) * 86400000 + i * 3600000).toISOString(),
            type: types[i % types.length] as "video" | "phone" | "onsite",
            meeting_link: i % 3 !== 2 ? "https://meet.google.com/abc-def-ghi" : undefined,
        }));
    },

    getApplicationsChart: async (days: 7 | 30 | 90 = 30) => {
        await delay(400);
        return Array(days).fill(null).map((_, i) => {
            const date = new Date(Date.now() - (days - 1 - i) * 86400000);
            return {
                date: date.toLocaleDateString("vi-VN", { month: "short", day: "numeric" }),
                applications: Math.floor(Math.random() * 12) + 1,
                views: Math.floor(Math.random() * 60) + 10,
            };
        });
    },

    // ─── Referrals endpoints ──────────────────────────────────────────────

    getReferrals: async () => {
        await delay(500);
        const statuses = ["pending", "contacted", "applied", "interviewing", "hired", "rejected"];
        const names = ["Phạm Lê Huy", "Đào Thị Tâm", "Lý Công Uẩn", "Bùi Xuân Huấn", "Ngô Phương Lan"];
        const jobs = ["Senior Frontend Engineer", "UI/UX Designer", "Product Manager", "Backend Developer", "DevOps Engineer"];

        return Array(12).fill(null).map((_, i) => ({
            id: `ref-${i}`,
            job_id: `job-${i % jobs.length}`,
            job_title: jobs[i % jobs.length],
            referred_name: names[i % names.length] + ` ${i}`,
            referred_email: `candidate${i}@example.com`,
            status: statuses[i % statuses.length],
            notes: i % 3 === 0 ? "Ưng ý với React/Next.js" : "",
            created_at: new Date(Date.now() - i * 86400000 * 2).toISOString(),
            bonus_amount: (i % 3 + 1) * 500,
            bonus_currency: "USD",
        }));
    },

    createReferral: async (data: { job_id: string, referred_name: string, referred_email: string, notes?: string }) => {
        await delay(800);
        return {
            success: true,
            id: `ref-new-${Date.now()}`,
            ...data,
            status: "pending",
            created_at: new Date().toISOString()
        };
    },

    getReferralPrograms: async () => {
        await delay(400);
        return [
            { id: "prog-1", title: "Frontend Experts", bonus: 1000, currency: "USD", active_referrals: 5, successful_hires: 1 },
            { id: "prog-2", title: "Senior Leadership", bonus: 2500, currency: "USD", active_referrals: 2, successful_hires: 0 },
            { id: "prog-3", title: "Q3 Sales Drive", bonus: 800, currency: "USD", active_referrals: 12, successful_hires: 3 },
        ];
    },

    // ─── Post Job Wizard endpoints ────────────────────────────────────────

    getJobCategories: async () => {
        await delay(400);
        return [
            {
                id: "cat-1", name: "Công nghệ thông tin", slug: "cong-nghe-thong-tin",
                children: [
                    { id: "cat-1-1", name: "Lập trình / Phát triển phần mềm", slug: "lap-trinh" },
                    { id: "cat-1-2", name: "Quản lý dự án / Sản phẩm", slug: "quan-ly-du-an" },
                    { id: "cat-1-3", name: "DevOps / Hạ tầng", slug: "devops" },
                    { id: "cat-1-4", name: "QA / Testing", slug: "qa-testing" },
                    { id: "cat-1-5", name: "Data / AI / Machine Learning", slug: "data-ai" },
                    { id: "cat-1-6", name: "Bảo mật / An ninh mạng", slug: "bao-mat" },
                ]
            },
            {
                id: "cat-2", name: "Thiết kế", slug: "thiet-ke",
                children: [
                    { id: "cat-2-1", name: "UI/UX Design", slug: "ui-ux" },
                    { id: "cat-2-2", name: "Đồ họa / Graphic Design", slug: "do-hoa" },
                    { id: "cat-2-3", name: "Motion Design", slug: "motion-design" },
                ]
            },
            {
                id: "cat-3", name: "Marketing", slug: "marketing",
                children: [
                    { id: "cat-3-1", name: "Digital Marketing", slug: "digital-marketing" },
                    { id: "cat-3-2", name: "Content & SEO", slug: "content-seo" },
                    { id: "cat-3-3", name: "Performance Marketing", slug: "performance" },
                ]
            },
            {
                id: "cat-4", name: "Tài chính / Ngân hàng", slug: "tai-chinh",
                children: [
                    { id: "cat-4-1", name: "Kế toán", slug: "ke-toan" },
                    { id: "cat-4-2", name: "Kiểm toán", slug: "kiem-toan" },
                    { id: "cat-4-3", name: "Phân tích tài chính", slug: "phan-tich" },
                ]
            },
            {
                id: "cat-5", name: "Kinh doanh / Bán hàng", slug: "kinh-doanh",
                children: [
                    { id: "cat-5-1", name: "Sales B2B", slug: "sales-b2b" },
                    { id: "cat-5-2", name: "Business Development", slug: "biz-dev" },
                ]
            },
            {
                id: "cat-6", name: "Nhân sự", slug: "nhan-su",
                children: [
                    { id: "cat-6-1", name: "Tuyển dụng", slug: "tuyen-dung" },
                    { id: "cat-6-2", name: "Đào tạo & Phát triển", slug: "dao-tao" },
                ]
            },
        ];
    },

    searchJobSkills: async (q: string) => {
        await delay(300);
        const all = [
            { id: "sk-1", name: "React" }, { id: "sk-2", name: "TypeScript" },
            { id: "sk-3", name: "Node.js" }, { id: "sk-4", name: "Python" },
            { id: "sk-5", name: "Vue.js" }, { id: "sk-6", name: "Angular" },
            { id: "sk-7", name: "Docker" }, { id: "sk-8", name: "Kubernetes" },
            { id: "sk-9", name: "AWS" }, { id: "sk-10", name: "GCP" },
            { id: "sk-11", name: "Figma" }, { id: "sk-12", name: "Adobe XD" },
            { id: "sk-13", name: "TailwindCSS" }, { id: "sk-14", name: "GraphQL" },
            { id: "sk-15", name: "PostgreSQL" }, { id: "sk-16", name: "MongoDB" },
            { id: "sk-17", name: "Redis" }, { id: "sk-18", name: "Go" },
            { id: "sk-19", name: "Rust" }, { id: "sk-20", name: "Java" },
            { id: "sk-21", name: "Spring Boot" }, { id: "sk-22", name: "Laravel" },
            { id: "sk-23", name: "Next.js" }, { id: "sk-24", name: "Framer Motion" },
            { id: "sk-25", name: "GSAP" }, { id: "sk-26", name: "CI/CD" },
            { id: "sk-27", name: "Terraform" }, { id: "sk-28", name: "Agile/Scrum" },
            { id: "sk-29", name: "Machine Learning" }, { id: "sk-30", name: "TensorFlow" },
        ];
        if (!q) return all.slice(0, 8);
        return all.filter(s => s.name.toLowerCase().includes(q.toLowerCase())).slice(0, 10);
    },

    getProvincesDetailed: async () => {
        await delay(300);
        return [
            { id: "p-1", name: "Hồ Chí Minh" },
            { id: "p-2", name: "Hà Nội" },
            { id: "p-3", name: "Đà Nẵng" },
            { id: "p-4", name: "Cần Thơ" },
            { id: "p-5", name: "Bình Dương" },
            { id: "p-6", name: "Đồng Nai" },
            { id: "p-7", name: "Hải Phòng" },
            { id: "p-8", name: "Hải Dương" },
            { id: "p-9", name: "Bắc Ninh" },
            { id: "p-10", name: "Quảng Ninh" },
            { id: "p-11", name: "Nghệ An" },
            { id: "p-12", name: "Khánh Hòa" },
            { id: "p-13", name: "Lâm Đồng" },
            { id: "p-14", name: "Long An" },
        ];
    },

    getCommunesByProvince: async (provinceId: string) => {
        await delay(350);
        const map: Record<string, { id: string; name: string }[]> = {
            "p-1": [
                { id: "c-1-1", name: "Quận 1" }, { id: "c-1-2", name: "Quận 3" },
                { id: "c-1-3", name: "Quận 7" }, { id: "c-1-4", name: "Bình Thạnh" },
                { id: "c-1-5", name: "Tân Bình" }, { id: "c-1-6", name: "Thủ Đức" },
            ],
            "p-2": [
                { id: "c-2-1", name: "Hoàn Kiếm" }, { id: "c-2-2", name: "Đống Đa" },
                { id: "c-2-3", name: "Cầu Giấy" }, { id: "c-2-4", name: "Hai Bà Trưng" },
                { id: "c-2-5", name: "Nam Từ Liêm" },
            ],
            "p-3": [
                { id: "c-3-1", name: "Hải Châu" }, { id: "c-3-2", name: "Sơn Trà" },
                { id: "c-3-3", name: "Ngũ Hành Sơn" },
            ],
        };
        return map[provinceId] ?? [
            { id: `c-${provinceId}-1`, name: "Khu vực trung tâm" },
            { id: `c-${provinceId}-2`, name: "Khu vực ngoại ô" },
        ];
    },

    createJob: async (data: Record<string, unknown>) => {
        await delay(800);
        return {
            id: "job_" + Math.random().toString(36).substring(2, 9),
            ...data,
            status: "draft",
            created_at: new Date().toISOString(),
        };
    },

    updateJob: async (id: string, data: Record<string, unknown>) => {
        await delay(600);
        return { id, ...data, updated_at: new Date().toISOString() };
    },

    addJobSkill: async (jobId: string, skill: { skill_id: string; skill_name: string; is_required: boolean; proficiency_level: string }) => {
        await delay(300);
        return { id: "js_" + Math.random().toString(36).substring(2, 7), job_id: jobId, ...skill };
    },

    removeJobSkill: async (_jobId: string, _skillId: string) => {
        await delay(300);
        return { success: true };
    },

    addJobLocation: async (jobId: string, location: Record<string, unknown>) => {
        await delay(400);
        return { id: "jl_" + Math.random().toString(36).substring(2, 7), job_id: jobId, ...location };
    },

    getEmployerCompany: async () => {
        await delay(400);
        return {
            id: "ec-1",
            company_name: "JOBIO NextGen",
            logo_url: "https://api.dicebear.com/7.x/shapes/svg?seed=JOBIO",
            banner_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
            website_url: "https://jobio.dev",
            headquarters: "123 Lê Lợi, Quận 1, Hồ Chí Minh",
            company_size: "50-150",
            tax_code: "0123456789",
            description: "Nền tảng tuyển dụng thế hệ mới ứng dụng AI",
            founded_year: 2020,
            industry: "Công nghệ thông tin",
            verification_status: 'pending',
        };
    },

    updateCompany: async (id: string, data: any) => {
        await delay(600);
        return { id, ...data, updated_at: new Date().toISOString() };
    },

    uploadCompanyLogo: async (id: string, file: File) => {
        await delay(800);
        return { url: URL.createObjectURL(file) };
    },

    uploadCompanyBanner: async (id: string, file: File) => {
        await delay(800);
        return { url: URL.createObjectURL(file) };
    },

    getCompanyBenefits: async (id: string) => {
        await delay(400);
        return [
            { id: "b1", category: "Sức khỏe", name: "Bảo hiểm Premium", description: "Bảo hiểm sức khỏe toàn diện cho nhân viên và người thân." },
            { id: "b2", category: "Tài chính", name: "Thưởng tháng 13 & 14", description: "Thưởng cố định và thưởng hiệu quả công việc." },
            { id: "b3", category: "Phát triển", name: "Ngân sách đào tạo", description: "1000$ mỗi năm cho các khóa học và chứng chỉ." },
            { id: "b4", category: "Giải trí", name: "Happy Hour", description: "Tiệc trà chiều và giao lưu mỗi thứ 6 hàng tuần." }
        ];
    },

    addCompanyBenefit: async (id: string, data: any) => {
        await delay(400);
        return { id: "b_" + Math.random().toString(36).substring(2, 7), ...data };
    },

    deleteCompanyBenefit: async (id: string, benefitId: string) => {
        await delay(400);
        return { success: true };
    },

    reorderCompanyBenefits: async (id: string, data: { order: string[] }) => {
        await delay(400);
        return { success: true };
    },

    uploadCompanyMedia: async (id: string, file: File, type: string) => {
        await delay(800);
        return { id: "m_" + Math.random().toString(36).substring(2, 7), url: URL.createObjectURL(file), media_type: type, title: file.name };
    },

    bulkUploadCompanyMedia: async (id: string, files: File[]) => {
        await delay(1200);
        return files.map((file, i) => ({
            id: `m_bulk_${i}_` + Math.random().toString(36).substring(2, 7),
            url: URL.createObjectURL(file),
            media_type: file.type.startsWith('video') ? 'video' : 'image',
            title: file.name
        }));
    },

    deleteCompanyMedia: async (id: string, mediaId: string) => {
        await delay(400);
        return { success: true };
    },

    reorderCompanyMedia: async (id: string, data: { order: string[] }) => {
        await delay(400);
        return { success: true };
    },

    requestCompanyVerification: async (id: string) => {
        await delay(600);
        return { success: true, verification_status: 'pending' };
    },

    getBenefitCategories: async () => {
        await delay(300);
        return [
            { id: "bc1", name: "Sức khỏe" },
            { id: "bc2", name: "Tài chính" },
            { id: "bc3", name: "Phát triển" },
            { id: "bc4", name: "Giải trí" },
            { id: "bc5", name: "Trang thiết bị" },
            { id: "bc6", name: "Khác" }
        ];
    },

    getMediaTypes: async () => {
        await delay(300);
        return [
            { id: "image", name: "Hình ảnh" },
            { id: "video", name: "Video" }
        ];
    },

    // ─── Manage Jobs endpoints ─────────────────────────────────────────────

    getEmployerJobs: async (params: {
        status?: string;
        ordering?: string;
        search?: string;
        page?: number;
        page_size?: number;
    }) => {
        await delay(500);
        const statuses = ['draft', 'pending', 'active', 'closed', 'expired'] as const;
        type JobStatus = typeof statuses[number];
        const titles = [
            'Senior Frontend Engineer', 'UI/UX Designer', 'Product Manager',
            'Backend Developer', 'DevOps Engineer', 'Data Scientist',
            'Mobile Developer', 'QA Engineer', 'Marketing Lead',
            'HR Manager', 'Business Analyst', 'Scrum Master',
        ];

        // Generate 30 mock employer jobs
        let jobs = Array(30).fill(null).map((_, i) => {
            const status: JobStatus = statuses[i % statuses.length];
            const posted = new Date(Date.now() - i * 86400000 * 3);
            const deadline = new Date(Date.now() + (30 - i) * 86400000);
            return {
                id: `ej-${i + 1}`,
                title: titles[i % titles.length] + (i >= titles.length ? ` (${Math.floor(i / titles.length) + 1})` : ''),
                status,
                posted_at: posted.toISOString(),
                deadline: deadline.toISOString(),
                views_count: Math.floor(Math.random() * 800) + 20,
                applications_count: Math.floor(Math.random() * 60) + 1,
                job_type: ['full_time', 'contract', 'part_time'][i % 3],
                level: ['junior', 'middle', 'senior', 'lead'][i % 4],
                location: ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Remote'][i % 4],
                is_featured: i % 7 === 0,
            };
        });

        // Filter by status
        const { status, ordering = '-posted_at', search, page = 1, page_size = 10 } = params;
        if (status && status !== 'all') {
            jobs = jobs.filter(j => j.status === status);
        }
        if (search) {
            jobs = jobs.filter(j => j.title.toLowerCase().includes(search.toLowerCase()));
        }

        // Sort
        if (ordering === '-posted_at' || ordering === 'posted_at') {
            jobs.sort((a, b) => ordering.startsWith('-')
                ? new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime()
                : new Date(a.posted_at).getTime() - new Date(b.posted_at).getTime()
            );
        } else if (ordering === 'deadline') {
            jobs.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
        } else if (ordering === '-views_count') {
            jobs.sort((a, b) => b.views_count - a.views_count);
        } else if (ordering === '-applications_count') {
            jobs.sort((a, b) => b.applications_count - a.applications_count);
        }

        const total = jobs.length;
        const start = (page - 1) * page_size;
        const items = jobs.slice(start, start + page_size);

        return { items, total, page, page_size };
    },

    deleteJob: async (_id: string) => {
        await delay(400);
        return { success: true };
    },

    patchJobStatus: async (_id: string, status: string) => {
        await delay(400);
        return { success: true, status };
    },

    duplicateJob: async (id: string) => {
        await delay(600);
        return {
            id: 'ej-copy-' + Math.random().toString(36).substring(2, 7),
            source_id: id,
            status: 'draft',
            created_at: new Date().toISOString(),
        };
    },

    bulkJobAction: async (ids: string[], action: 'close' | 'delete' | 'extend') => {
        await delay(600);
        return { success: true, affected: ids.length, action };
    },

    // ─── Candidate Management (ATS) endpoints ────────────────────────────

    getJobApplications: async (jobId: string, params?: { status?: string; search?: string }) => {
        await delay(600);
        // Generate mock applications for a job
        const statuses = ['Submitted', 'Reviewing', 'Shortlisted', 'Interview', 'Offered', 'Hired', 'Rejected', 'Withdrawn'];
        const names = ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C", "Phạm Thị D", "Hoàng Văn E"];

        let items = Array(15).fill(null).map((_, i) => ({
            id: `app-job-${jobId}-${i}`,
            job_id: jobId,
            candidate_id: `cand-${i}`,
            candidate_name: names[i % names.length] + ` ${i}`,
            candidate_avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Cand${i}`,
            candidate_email: `cand${i}@example.com`,
            candidate_phone: `090123456${i % 10}`,
            job_title: "Senior Frontend Engineer",
            status: statuses[i % statuses.length],
            ai_score: 50 + Math.floor(Math.random() * 50),
            applied_at: new Date(Date.now() - i * 86400000).toISOString(),
            cv_url: "https://example.com/cv.pdf",
            cover_letter: "Kính gửi nhà tuyển dụng, tôi có kinh nghiệm 5 năm với React...",
            skills: ["React", "TypeScript", "Tailwind"].slice(0, 1 + (i % 3)),
            rating: Math.floor(Math.random() * 5) + 1
        }));

        if (params?.status) {
            items = items.filter(a => a.status === params.status);
        }
        if (params?.search) {
            items = items.filter(a => a.candidate_name.toLowerCase().includes(params.search!.toLowerCase()));
        }

        return { items, total: items.length };
    },

    getAllApplications: async (params?: { ordering?: string; status?: string[]; job_id?: string; search?: string; ai_score_min?: number; ai_score_max?: number; date_from?: string; date_to?: string; skills?: string[] }) => {
        await delay(700);

        let items = [...getMockApplications()];

        if (params?.status && params.status.length > 0) {
            items = items.filter(a => params.status!.includes(a.status));
        }
        if (params?.job_id) {
            items = items.filter(a => a.job_id === params.job_id);
        }
        if (params?.search) {
            items = items.filter(a => a.candidate_name.toLowerCase().includes(params.search!.toLowerCase()) || a.job_title.toLowerCase().includes(params.search!.toLowerCase()));
        }
        if (params?.ai_score_min !== undefined) {
            items = items.filter(a => a.ai_score >= params.ai_score_min!);
        }
        if (params?.ai_score_max !== undefined) {
            items = items.filter(a => a.ai_score <= params.ai_score_max!);
        }
        if (params?.skills && params.skills.length > 0) {
            items = items.filter(a => params.skills!.some(s => a.skills.includes(s)));
        }

        if (params?.ordering === '-applied_at') {
            items.sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());
        } else if (params?.ordering === 'applied_at') {
            items.sort((a, b) => new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime());
        }

        return { items, total: items.length };
    },

    updateApplicationStatus: async (id: string, data: { status: string; notes?: string }) => {
        await delay(400);
        if (mockApplicationsCache) {
            const index = mockApplicationsCache.findIndex(app => app.id === id);
            if (index !== -1) {
                mockApplicationsCache[index] = {
                    ...mockApplicationsCache[index],
                    status: data.status,
                    notes: data.notes || mockApplicationsCache[index].notes
                };
            }
        }
        return { success: true, id, status: data.status, notes: data.notes };
    },

    getApplicationStatusHistory: async (id: string) => {
        await delay(400);
        return [
            { id: "h1", status: "Submitted", changed_at: new Date(Date.now() - 86400000 * 5).toISOString(), changed_by: "System", notes: "Application received" },
            { id: "h2", status: "Reviewing", changed_at: new Date(Date.now() - 86400000 * 3).toISOString(), changed_by: "HR Admin", notes: "Profile looks promising" },
            { id: "h3", status: "Interview", changed_at: new Date(Date.now() - 86400000 * 1).toISOString(), changed_by: "Hiring Manager", notes: "Scheduled first round" }
        ];
    },

    getApplicationTestResults: async (id: string) => {
        await delay(500);
        return [
            { id: "tr1", test_name: "React Advanced Assessment", score: 85, max_score: 100, completed_at: new Date(Date.now() - 86400000 * 2).toISOString(), status: "passed" },
            { id: "tr2", test_name: "Cognitive Ability Test", score: 72, max_score: 100, completed_at: new Date(Date.now() - 86400000 * 3).toISOString(), status: "passed" }
        ];
    },

    getMatchingCandidates: async (jobId: string) => {
        await delay(800);
        const names = ["Đỗ Văn Thông", "Phan Thị Yến", "Nguyễn Tuấn Tài"];
        return {
            items: names.map((name, i) => ({
                id: `match-${i}`,
                candidate_id: `cand-match-${i}`,
                candidate_name: name,
                candidate_avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Match${i}`,
                current_position: "Frontend Developer",
                match_score: 95 - i * 5,
                skills: ["React", "TypeScript", "Tailwind"].slice(0, i + 1),
                experience_years: 4 + i
            })),
            total: names.length
        };
    },

    getCandidateCertifications: async (id: string) => {
        await delay(400);
        return [
            { id: "cert1", name: "AWS Certified Developer", issuing_organization: "Amazon Web Services", issue_date: "2023-01-15", credential_url: "https://aws.amazon.com/verify" },
            { id: "cert2", name: "Meta React Native Specialist", issuing_organization: "Meta", issue_date: "2022-06-10" }
        ];
    },

    // ─── Candidate Dashboard endpoints ───────────────────────────────────
    getCandidateStats: async (id: string) => {
        await delay(300);
        return {
            applied_jobs_count: 12,
            upcoming_interviews_count: 2,
            profile_views_count: 45,
            matching_jobs_count: 156
        };
    },

    getCandidateMatchingJobs: async (id: string) => {
        await delay(600);
        return Array(6).fill(null).map((_, i) => ({
            id: `cj-match-${i}`,
            title: ["Senior React Developer", "Frontend Engineer", "UI/UX Designer", "Fullstack Developer", "Software Engineer"][i % 5],
            company: "JOBIO NextGen " + (i + 1),
            logo_url: `https://api.dicebear.com/7.x/shapes/svg?seed=JOBIO${i}`,
            salary: i % 2 === 0 ? "2,500 - 4,000 USD" : "Thỏa thuận",
            location: "Hồ Chí Minh",
            match_score: 98 - i * 3
        }));
    },


    getCandidateApplications: async (id: string, params?: { status?: string }) => {
        await delay(500);

        let apps = mockCandidateApplications;

        if (params?.status && params.status !== 'Tất cả') {
            apps = apps.filter(a => a.status === params.status);
        }

        return apps;
    },

    withdrawApplication: async (appId: string) => {
        await delay(400);
        const appInfo = mockCandidateApplications.find(a => a.id === appId);
        if (appInfo) {
            appInfo.status = 'Rút đơn';
        }
        return { success: true, status: 'Rút đơn' };
    },

    getCandidateSavedJobs: async (id: string) => {
        await delay(400);
        return Array(4).fill(null).map((_, i) => ({
            id: `saved-${i}`,
            title: ["Senior Frontend", "React Developer", "UI Developer", "Principal Frontend"][i],
            company: ["Apple", "Netflix", "Google", "Amazon"][i],
            logo_url: `https://api.dicebear.com/7.x/shapes/svg?seed=Fav${i}`,
            salary: "3,000 - 5,000 USD",
            location: "Remote"
        }));
    },

    // ─── Profile CRUD endpoints ─────────────────────────────────────────────

    uploadAvatar: async (id: string, _file: File) => {
        await delay(900);
        // In real app, upload to storage and return URL
        return { avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}` };
    },

    updateJobSearchStatus: async (id: string, status: string) => {
        await delay(400);
        return { success: true, job_search_status: status };
    },

    updateProfilePrivacy: async (id: string, is_profile_public: boolean) => {
        await delay(400);
        return { success: true, is_profile_public };
    },

    // Education CRUD
    addEducation: async (userId: string, data: any) => {
        await delay(600);
        return { id: 'edu_' + Math.random().toString(36).substr(2, 9), ...data };
    },
    updateEducation: async (userId: string, entryId: string, data: any) => {
        await delay(600);
        return { id: entryId, ...data };
    },
    deleteEducation: async (userId: string, entryId: string) => {
        await delay(400);
        return { success: true };
    },
    reorderEducation: async (userId: string, order: string[]) => {
        await delay(300);
        return { success: true };
    },

    // Experience CRUD
    addExperience: async (userId: string, data: any) => {
        await delay(600);
        return { id: 'exp_' + Math.random().toString(36).substr(2, 9), ...data };
    },
    updateExperience: async (userId: string, entryId: string, data: any) => {
        await delay(600);
        return { id: entryId, ...data };
    },
    deleteExperience: async (userId: string, entryId: string) => {
        await delay(400);
        return { success: true };
    },
    reorderExperience: async (userId: string, order: string[]) => {
        await delay(300);
        return { success: true };
    },

    // Skills CRUD
    addSkill: async (userId: string, data: any) => {
        await delay(500);
        return { id: 'sk_' + Math.random().toString(36).substr(2, 9), ...data, endorsement_count: 0, is_verified: false };
    },
    updateSkill: async (userId: string, skillId: string, data: any) => {
        await delay(500);
        return { id: skillId, ...data };
    },
    deleteSkill: async (userId: string, skillId: string) => {
        await delay(400);
        return { success: true };
    },
    bulkAddSkills: async (userId: string, skills: any[]) => {
        await delay(700);
        return skills.map(s => ({ id: 'sk_' + Math.random().toString(36).substr(2, 9), ...s, endorsement_count: 0, is_verified: false }));
    },

    // Certifications CRUD
    getCertifications: async (userId: string) => {
        await delay(500);
        return [
            {
                id: "cert1",
                certification_name: "AWS Certified Solutions Architect – Associate",
                issuing_organization: "Amazon Web Services",
                issue_date: "2023-05-15",
                expiry_date: "2026-05-15",
                credential_id: "AWS-CSA-001",
                credential_url: "https://aws.amazon.com/verification",
                does_not_expire: false
            },
            {
                id: "cert2",
                certification_name: "Google Professional Cloud Developer",
                issuing_organization: "Google Cloud",
                issue_date: "2022-11-20",
                expiry_date: null,
                credential_id: "GCP-PCD-554",
                credential_url: "https://cloud.google.com/certification",
                does_not_expire: true
            }
        ];
    },
    addCertification: async (userId: string, data: any) => {
        await delay(600);
        return { id: 'cert_' + Math.random().toString(36).substr(2, 9), ...data };
    },
    updateCertification: async (userId: string, certId: string, data: any) => {
        await delay(600);
        return { id: certId, ...data };
    },
    deleteCertification: async (userId: string, certId: string) => {
        await delay(400);
        return { success: true };
    },

    // User Languages CRUD (user-side, not just the list)
    getUserLanguages: async (userId: string) => {
        await delay(400);
        return [
            { id: "ul1", language_id: "l1", name: "Tiếng Việt", proficiency_level: "native", is_native: true },
            { id: "ul2", language_id: "l2", name: "Tiếng Anh", proficiency_level: "fluent", is_native: false },
            { id: "ul3", language_id: "l3", name: "Tiếng Nhật", proficiency_level: "basic", is_native: false }
        ];
    },
    addUserLanguage: async (userId: string, data: any) => {
        await delay(500);
        return { id: 'ul_' + Math.random().toString(36).substr(2, 9), ...data };
    },
    updateUserLanguage: async (userId: string, langId: string, data: any) => {
        await delay(500);
        return { id: langId, ...data };
    },
    deleteUserLanguage: async (userId: string, langId: string) => {
        await delay(400);
        return { success: true };
    },

    // Projects CRUD
    getProjects: async (userId: string) => {
        await delay(500);
        return [
            {
                id: "p1",
                project_name: "JOBIO Recruitment Platform",
                description: "Nền tảng tuyển dụng hiện đại với Neo-glass UI và Aurora gradients, tích hợp AI để kết nối ứng viên và nhà tuyển dụng.",
                project_url: "https://jobio.dev",
                github_url: "https://github.com/anv/jobio",
                start_date: "2023-06-01",
                end_date: null,
                is_ongoing: true,
                technologies_used: ["React", "TypeScript", "TailwindCSS", "Framer Motion", "Zustand"]
            },
            {
                id: "p2",
                project_name: "E-commerce Mobile App",
                description: "Ứng dụng thương mại điện tử React Native với tính năng AR try-on và thanh toán đa điểm.",
                project_url: "https://myshop.dev",
                github_url: "https://github.com/anv/myshop",
                start_date: "2022-01-15",
                end_date: "2022-12-31",
                is_ongoing: false,
                technologies_used: ["React Native", "Redux", "Node.js", "MongoDB"]
            }
        ];
    },
    addProject: async (userId: string, data: any) => {
        await delay(600);
        return { id: 'p_' + Math.random().toString(36).substr(2, 9), ...data };
    },
    updateProject: async (userId: string, projectId: string, data: any) => {
        await delay(600);
        return { id: projectId, ...data };
    },
    deleteProject: async (userId: string, projectId: string) => {
        await delay(400);
        return { success: true };
    },
    reorderProjects: async (userId: string, order: string[]) => {
        await delay(300);
        return { success: true };
    },

    // ─── CV Builder / CV Manager endpoints (Task 3.3) ─────────────────────

    getCandidateCVs: async (userId: string) => {
        await delay(500);
        return [
            {
                id: 'cv-1',
                cv_name: 'Frontend Developer – TechStack Focus',
                template_id: 'tpl-1',
                template_name: 'Aurora Professional',
                is_default: true,
                is_public: true,
                view_count: 142,
                download_count: 18,
                updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
                thumbnail_url: `https://api.dicebear.com/7.x/shapes/svg?seed=Aurora`,
            },
            {
                id: 'cv-2',
                cv_name: 'Fullstack Engineer – Portfolio 2025',
                template_id: 'tpl-2',
                template_name: 'Neo Minimal',
                is_default: false,
                is_public: false,
                view_count: 56,
                download_count: 7,
                updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
                thumbnail_url: `https://api.dicebear.com/7.x/shapes/svg?seed=NeoMin`,
            },
            {
                id: 'cv-3',
                cv_name: 'Creative UI/UX Resume',
                template_id: 'tpl-4',
                template_name: 'Glass Canvas',
                is_default: false,
                is_public: true,
                view_count: 89,
                download_count: 11,
                updated_at: new Date(Date.now() - 14 * 86400000).toISOString(),
                thumbnail_url: `https://api.dicebear.com/7.x/shapes/svg?seed=GCanvas`,
            },
        ];
    },

    createCV: async (userId: string, data: any) => {
        await delay(700);
        return { id: 'cv-' + Date.now(), ...data, is_default: false, is_public: false, view_count: 0, download_count: 0, updated_at: new Date().toISOString() };
    },

    updateCV: async (userId: string, cvId: string, data: any) => {
        await delay(600);
        return { id: cvId, ...data, updated_at: new Date().toISOString() };
    },

    deleteCV: async (userId: string, cvId: string) => {
        await delay(400);
        return { success: true };
    },

    setDefaultCV: async (userId: string, cvId: string) => {
        await delay(400);
        return { success: true, default_cv_id: cvId };
    },

    downloadCV: async (userId: string, cvId: string) => {
        await delay(1500);
        return { success: true, download_url: `https://example.com/cvs/${cvId}.pdf`, expires_in: 300 };
    },

    previewCV: async (userId: string, cvId: string, cvData: any) => {
        await delay(800);
        return { preview_url: `https://example.com/preview/${cvId}?t=${Date.now()}`, success: true };
    },

    setCVPrivacy: async (userId: string, cvId: string, is_public: boolean) => {
        await delay(400);
        return { success: true, is_public };
    },

    aiGenerateCV: async (userId: string) => {
        await delay(2500); // simulate AI processing time
        return {
            success: true,
            cv_data: {
                summary: 'Kỹ sư Frontend với 5+ năm kinh nghiệm xây dựng sản phẩm web hiệu năng cao, đam mê UI/UX và animation. Thành thạo React, TypeScript, TailwindCSS.',
                skills: ['React', 'TypeScript', 'TailwindCSS', 'Framer Motion', 'Node.js'],
                experience: [{ company: 'Tech Solutions Inc.', title: 'Frontend Developer', period: '2018 – 2021' }],
                education: [{ school: 'Đại học Bách Khoa TP.HCM', degree: 'Kỹ sư CNTT', period: '2013 – 2017' }],
            },
        };
    },

    getCVTemplates: async () => {
        await delay(600);
        return [
            { id: 'tpl-1', name: 'Aurora Professional', category: 'professional', price: 0, is_premium: false, is_popular: true, thumbnail_url: `https://api.dicebear.com/7.x/shapes/svg?seed=Aurora`, color_scheme: 'violet-cyan', tags: ['Modern', 'Clean', 'Professional'] },
            { id: 'tpl-2', name: 'Neo Minimal', category: 'minimal', price: 0, is_premium: false, is_popular: false, thumbnail_url: `https://api.dicebear.com/7.x/shapes/svg?seed=NeoMin`, color_scheme: 'slate', tags: ['Minimal', 'Simple', 'Clean'] },
            { id: 'tpl-3', name: 'Executive Elite', category: 'executive', price: 49000, is_premium: true, is_popular: true, thumbnail_url: `https://api.dicebear.com/7.x/shapes/svg?seed=ExecE`, color_scheme: 'dark', tags: ['Executive', 'Premium', 'Senior'] },
            { id: 'tpl-4', name: 'Glass Canvas', category: 'creative', price: 29000, is_premium: true, is_popular: false, thumbnail_url: `https://api.dicebear.com/7.x/shapes/svg?seed=GCanvas`, color_scheme: 'glass', tags: ['Creative', 'Design', 'Artistic'] },
            { id: 'tpl-5', name: 'Tech Blueprint', category: 'technical', price: 0, is_premium: false, is_popular: true, thumbnail_url: `https://api.dicebear.com/7.x/shapes/svg?seed=TechBP`, color_scheme: 'cyan', tags: ['Technical', 'Engineering', 'IT'] },
            { id: 'tpl-6', name: 'Gradient Luxe', category: 'creative', price: 59000, is_premium: true, is_popular: false, thumbnail_url: `https://api.dicebear.com/7.x/shapes/svg?seed=GradLx`, color_scheme: 'gradient', tags: ['Luxury', 'Premium', 'Bold'] },
            { id: 'tpl-7', name: 'Compact Grid', category: 'minimal', price: 0, is_premium: false, is_popular: false, thumbnail_url: `https://api.dicebear.com/7.x/shapes/svg?seed=CompGd`, color_scheme: 'neutral', tags: ['Compact', 'Grid', 'Dense'] },
            { id: 'tpl-8', name: 'Vibrant Story', category: 'creative', price: 39000, is_premium: true, is_popular: true, thumbnail_url: `https://api.dicebear.com/7.x/shapes/svg?seed=VibSt`, color_scheme: 'vivid', tags: ['Vibrant', 'Expressive', 'Story'] },
        ];
    },

    getCVTemplateCategories: async () => {
        await delay(300);
        return [
            { id: 'all', name: 'Tất cả', count: 8 },
            { id: 'professional', name: 'Chuyên nghiệp', count: 1 },
            { id: 'minimal', name: 'Tối giản', count: 2 },
            { id: 'creative', name: 'Sáng tạo', count: 3 },
            { id: 'executive', name: 'Lãnh đạo', count: 1 },
            { id: 'technical', name: 'Kỹ thuật', count: 1 },
        ];
    },

    getPopularCVTemplates: async () => {
        await delay(400);
        return ['tpl-1', 'tpl-3', 'tpl-5', 'tpl-8'];
    },

    // ─── Employer / Interviews endpoints (Task 4.1) ─────────────────────

    getInterviews: async (params?: any) => {
        await delay(600);
        const now = new Date();
        let items = Array(12).fill(null).map((_, i) => ({
            id: `int-${i}`,
            candidate_name: ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C", "Phạm Thị D", "Hoàng Văn E"][i % 5],
            candidate_avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Int${i}`,
            job_title: ["Senior Frontend Engineer", "UI/UX Designer", "Product Manager", "Backend Developer"][i % 4],
            company_name: ["JOBIO NextGen", "TechCorp", "VNG Corporation", "InnovateVN", "Google"][i % 5],
            company_logo: `https://api.dicebear.com/7.x/shapes/svg?seed=Comp${i}`,
            type: ["video", "phone", "onsite"][i % 3] as "video" | "phone" | "onsite",
            scheduled_at: new Date(now.getTime() + (i - 2) * 86400000 + i * 3600000).toISOString(),
            duration_minutes: 60,
            status: ["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"][i % 6] as "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show",
            location: (i % 3 === 2 ? "Văn phòng JOBIO" : undefined) as string | undefined,
            meeting_link: (i % 3 !== 2 ? "https://meet.google.com/abc-def-ghi" : undefined) as string | undefined,
            interviewers: [{ id: "u1", name: "Nhà tuyển dụng 1", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=HR" }],
            notes: "Phỏng vấn vòng chuyên môn",
            candidate_id: `cand-${i}`,
            job_id: `job-${i % 4}`,
            feedback: i % 6 === 3 ? "Kỹ năng chuyên môn tốt, phong thái tự tin. Sẽ phù hợp với văn hóa công ty." : undefined,
            rating: i % 6 === 3 ? 4 : undefined,
        }));

        if (params?.status) {
            const statuses = params.status.split(',');
            items = items.filter(item => statuses.includes(item.status));
        }

        return items;
    },

    createInterview: async (data: any) => {
        await delay(800);
        return { id: 'int-new-' + Date.now(), ...data, status: 'scheduled' };
    },

    getInterviewById: async (id: string) => {
        await delay(500);
        return {
            id,
            candidate_name: "Nguyễn Văn Detail",
            candidate_avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Detail`,
            job_title: "Senior Frontend Engineer",
            type: "video" as "video" | "phone" | "onsite",
            scheduled_at: new Date(Date.now() + 86400000).toISOString(),
            duration_minutes: 60,
            status: "scheduled" as "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show",
            meeting_link: "https://meet.google.com/abc-def-ghi" as string | undefined,
            location: "Văn phòng JOBIO" as string | undefined,
            interviewers: [{ id: "u1", name: "Nhà tuyển dụng 1", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=HR" }],
            notes: "Ứng viên có nhiều kinh nghiệm React",
            candidate_id: `cand-detail`,
            job_id: `job-1`,
            feedback: null as string | null,
            rating: 0 as number | undefined
        };
    },

    updateInterview: async (id: string, data: any) => {
        await delay(600);
        return { success: true, id, ...data };
    },

    cancelInterview: async (_id: string) => {
        await delay(400);
        return { success: true };
    },

    getInterviewTypes: async () => {
        await delay(300);
        return [
            { id: "video", name: "Phỏng vấn Online (Video)" },
            { id: "phone", name: "Phỏng vấn Điện thoại" },
            { id: "onsite", name: "Phỏng vấn Trực tiếp (Onsite)" },
            { id: "test", name: "Làm bài Test" }
        ];
    },

    // Mock candidates list for dropdown
    getInterviewCandidates: async () => {
        await delay(400);
        return [
            { id: "cand-1", name: "Nguyễn Văn A", job_title: "Senior Frontend Engineer", job_id: "job-1" },
            { id: "cand-2", name: "Trần Thị B", job_title: "UI/UX Designer", job_id: "job-2" },
            { id: "cand-3", name: "Lê Văn C", job_title: "Product Manager", job_id: "job-3" }
        ];
    },

    // ─── Campaigns endpoints ──────────────────────────────────────────────

    getCampaigns: async (_params?: any) => {
        await delay(500);
        return {
            items: [
                {
                    id: "camp-1",
                    campaign_name: "Spring Mass Hiring 2024",
                    campaign_type: "mass_hiring",
                    status: "active",
                    budget: 5000,
                    spent_amount: 1200,
                    target_positions: 20,
                    hired_count: 5,
                    start_date: "2024-03-01",
                    end_date: "2024-05-31",
                    job_count: 3
                },
                {
                    id: "camp-2",
                    campaign_name: "University Tour 2024",
                    campaign_type: "campus",
                    status: "draft",
                    budget: 2000,
                    spent_amount: 0,
                    target_positions: 10,
                    hired_count: 0,
                    start_date: "2024-06-01",
                    end_date: "2024-07-30",
                    job_count: 0
                },
                {
                    id: "camp-3",
                    campaign_name: "Referral Bonus Q1",
                    campaign_type: "referral",
                    status: "completed",
                    budget: 1500,
                    spent_amount: 1500,
                    target_positions: 5,
                    hired_count: 5,
                    start_date: "2024-01-01",
                    end_date: "2024-02-28",
                    job_count: 2
                }
            ],
            total: 3
        };
    },

    getCampaignById: async (id: string) => {
        await delay(400);
        return {
            id,
            campaign_name: "Spring Mass Hiring 2024",
            description: "Chiến dịch tuyển dụng số lượng lớn mùa xuân nhằm mở rộng team Engineering.",
            campaign_type: "mass_hiring",
            status: "active",
            budget: 5000,
            spent_amount: 1200,
            target_positions: 20,
            hired_count: 5,
            start_date: "2024-03-01",
            end_date: "2024-05-31",
            target_audience: "Mid to Senior Software Engineers, React, Node.js",
            notes: ""
        };
    },

    createCampaign: async (data: any) => {
        await delay(800);
        return { success: true, id: "camp-" + Math.random().toString(36).substr(2, 9), ...data };
    },

    updateCampaign: async (id: string, data: any) => {
        await delay(600);
        return { success: true, id, ...data };
    },

    deleteCampaign: async (id: string) => {
        await delay(400);
        return { success: true };
    },

    getCampaignJobs: async (campaignId: string) => {
        await delay(400);
        return [
            { id: "cj-1", job_id: "job-1", campaign_id: campaignId, title: "Senior Frontend Engineer", status: "published", applications_count: 12 },
            { id: "cj-2", job_id: "job-2", campaign_id: campaignId, title: "Backend Node.js", status: "published", applications_count: 8 }
        ];
    },

    addCampaignJob: async (_campaignId: string, _jobId: string) => {
        await delay(400);
        return { success: true };
    },

    removeCampaignJob: async (_campaignId: string, _jobId: string) => {
        await delay(400);
        return { success: true };
    },

    // ─── CV Search (Employer) endpoints ───────────────────────────────────
    searchCandidates: async (params: any) => {
        await delay(800);
        const { q, skills, location, experience_min, experience_max, education, search_status, salary_min, salary_max } = params;

        const names = ["Trần Minh Đức", "Nguyễn Hồng Anh", "Lê Quang Hùng", "Phạm Thị Lan", "Võ Văn Nam", "Đỗ Thị Mai", "Bùi Thanh Tùng", "Hoàng Thị Thu", "Đinh Văn Bảo", "Chu Thị Hoa", "Nguyễn Văn Tuấn", "Phạm Thu Hương"];
        const titles = ["Senior Frontend", "UX/UI Designer", "Product Manager", "Backend Developer", "Fullstack Node.js", "DevOps Engineer", "Data Scientist", "Mobile App Dev"];
        const companies = ["TechCorp", "InnovateVN", "VNG", "FPT", "Viettel", "Momo", "Tiki"];

        let candidates = Array(35).fill(null).map((_, i) => {
            const isPublic = i % 8 !== 0; // Một số ít không công khai
            return {
                id: `cand-search-${i}`,
                name: isPublic ? names[i % names.length] : "Ứng viên Ẩn danh",
                avatar_url: isPublic ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${names[i % names.length]}${i}` : undefined,
                current_position: titles[i % titles.length],
                current_company: companies[i % companies.length],
                years_of_experience: (i % 8) + 1,
                top_skills: ["React", "TypeScript", "Node.js", "Python", "Figma", "AWS", "Docker"].slice(i % 3, (i % 3) + 3),
                education_summary: ["Cử nhân Khoa học Máy tính", "Thạc sĩ CNTT", "Kỹ sư phần mềm"][i % 3],
                job_search_status: ["active", "passive", "closed"][i % 3],
                profile_completeness: 60 + (i % 40),
                is_profile_public: isPublic,
                location: ["Hồ Chí Minh", "Hà Nội", "Đà Nẵng"][i % 3],
                salary_expectation: (i % 5 + 1) * 500
            };
        });

        // Mock Filters applied
        if (q) {
            candidates = candidates.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.current_position.toLowerCase().includes(q.toLowerCase()));
        }
        if (location && location !== 'all') {
            candidates = candidates.filter(c => c.location === location);
        }
        if (skills && skills.length > 0) {
            candidates = candidates.filter(c => skills.some((s: string) => c.top_skills.includes(s)));
        }
        if (experience_min !== undefined) {
            candidates = candidates.filter(c => c.years_of_experience >= experience_min);
        }
        if (search_status && search_status !== 'all') {
            candidates = candidates.filter(c => c.job_search_status === search_status);
        }

        return {
            items: candidates,
            total: candidates.length,
            page: params.page || 1,
            limit: params.limit || 12
        };
    },

    getCandidatePublicProfile: async (id: string) => {
        await delay(600);
        return {
            id,
            name: "Trần Minh Đức",
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Duc`,
            current_position: "Senior Frontend Engineer",
            current_company: "TechCorp JSC",
            location: "Thành phố Hồ Chí Minh",
            job_search_status: "active",
            bio: "Hơn 5 năm kinh nghiệm làm việc với React và hệ sinh thái Javascript. Đam mê xây dựng các giao diện phức tạp với hiệu năng cao và UX đột phá. Đã từng lead team 3 frontend engineers.",
            years_of_experience: 5,
            expected_salary_range: "$1500 - $2500",
            email: "contact@tranduc.dev",
            phone: "+84 912 345 678",
            skills: [
                { name: "React", level: "Expert", years: 5 },
                { name: "TypeScript", level: "Advanced", years: 4 },
                { name: "TailwindCSS", level: "Expert", years: 3 },
                { name: "Figma", level: "Intermediate", years: 2 }
            ],
            experience: [
                { id: "e1", title: "Senior Frontend", company: "TechCorp JSC", duration: "2021 - Hiện tại", desc: "Xây dựng core UI library cho toàn bộ công ty." },
                { id: "e2", title: "Web Developer", company: "InnovateVN", duration: "2018 - 2021", desc: "Phát triển nền tảng thương mại điện tử phục vụ 1M+ user." }
            ],
            education: [
                { id: "ed1", degree: "Cử nhân Khoa học Máy tính", school: "ĐH Khoa học Tự nhiên TP.HCM", duration: "2014 - 2018" }
            ],
            social_links: {
                github: "https://github.com/tranduc",
                linkedin: "https://linkedin.com/in/tranduc",
                portfolio: "https://tranduc.dev"
            }
        };
    },

    getCandidateRecommendations: async (id: string) => {
        await delay(500);
        return Array(3).fill(null).map((_, i) => ({
            id: `rec-${i}`,
            name: ["Nguyễn Hoàng", "Lê Phương", "Đặng Văn"][i],
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Rec${i}`,
            match_score: 85 + i * 4,
            current_position: "Frontend Developer",
            top_skills: ["React", "TypeScript", "TailwindCSS"]
        }));
    }
};
