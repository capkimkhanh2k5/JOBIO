// Giả lập backend endpoint và delay mạng
export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

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
            id: i.toString(),
            title: ["Senior Frontend Engineer", "Product Manager", "UI/UX Designer", "Backend Developer", "DevOps Engineer", "Project Manager", "Data Scientist", "Mobile Developer"][i % 8],
            company_name: ["TechCorp", "InnovateVN", "FintechX", "HealthStartup", "GreenEnergy", "EduLink", "LogiTech", "AutoAI"][i % 8],
            logo_url: `https://api.dicebear.com/7.x/initials/svg?seed=C${i}`,
            job_type: i % 2 === 0 ? "Full-time" : "Contract",
            level: i % 3 === 0 ? "Senior" : i % 3 === 1 ? "Mid-level" : "Junior",
            salary_min: 1500 + (i * 100),
            salary_max: 3000 + (i * 200),
            salary_currency: "USD",
            is_salary_visible: i % 5 !== 0,
            locations: ["Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Remote"][i % 4],
            is_remote: i % 2 === 0,
            deadline: "2024-12-31"
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
    // Profile related endpoints
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
    }
};
