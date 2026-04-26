import random
from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.core.utils import slugify_vietnamese as slugify

from apps.core.users.models import CustomUser
from apps.company.companies.models import Company
from apps.recruitment.jobs.models import Job
from apps.geography.addresses.models import Address
from apps.company.industries.models import Industry
from apps.recruitment.job_categories.models import JobCategory

COMPANY_NAMES = [
    "TechMates Solutions", "Vinova IT", "CodeBase Vietnam", "DataVision Systems", 
    "FPT Software", "VNG Corporation", "KMS Technology", "Tiki Corporation",
    "Shopee Vietnam", "Grab Tech", "Momo eWallet", "Zalo Group", 
    "Axon Active", "Nashtech", "TMA Solutions", "Harvey Nash", 
    "Anduin Transactions", "Elca Vietnam", "Wizeline", "LogiGear",
    "Giao Hang Tiet Kiem", "VNPAY", "Sapo", "Base.vn", "VNPT IT",
    "Viettel Digital", "CyberLogitec", "Bosch Vietnam", "Amaris Consulting", "NTT Data",
    "Tek Experts", "Orient Software", "Kyanon Digital", "KMS Healthcare", "Got It",
    "Vexere", "Coccoc", "Designveloper", "Sendo", "Be Group",
    "Rikkeisoft", "Savvycom", "TopCV", "Navigos Group", "Masan Group IT",
    "Vingroup Big Data", "BAP Software", "Levinci", "BOSCH Global Software", "Niteco"
]

JOB_TITLES = [
    "Senior Frontend Developer (ReactJS)", "Backend Engineer (Golang)", 
    "Fullstack Developer (NodeJS/React)", "Lập trình viên Java", 
    "Mobile Developer (React Native/Flutter)", "iOS Developer", "Android Developer",
    "DevOps Engineer", "Cloud Solutions Architect", "System Admin",
    "Software Tester (QA/QC)", "Automation Test Engineer",
    "Data Analyst", "Data Scientist", "Data Engineer",
    "AI/Machine Learning Engineer", "Product Manager", "Project Manager",
    "Scrum Master", "Business Analyst (BA)", "UI/UX Designer",
    "IT Support Helpdesk", "Security Engineer", "Technical Lead",
    "Engineering Manager", "Database Administrator (DBA)",
    "PHP/Laravel Developer", "Python Backend Developer", "C/C++ Embedded Engineer",
    "Game Developer (Unity/Unreal)", "SAP Consultant", "Salesforce Developer",
    "Frontend Angular Developer", "VueJS Developer", "Ruby on Rails Developer",
    "Blockchain Developer (Solidity)", "Smart Contract Engineer",
    "Customer Success Specialist", "IT Recruitment Specialist", "Technical Writer"
]

class Command(BaseCommand):
    help = 'Tạo dữ liệu việc làm và công ty giả (Fake Data) cho việc test UI/UX'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("Đang bắt đầu tạo dữ liệu mẫu... Bắt đầu transaction."))

        try:
            with transaction.atomic():
                self._clear_old_data()
                users = self._seed_users(50)
                companies = self._seed_companies(users)
                self._seed_jobs(companies, 500)
                
            self.stdout.write(self.style.SUCCESS("=> SEED FAKE DATA HOÀN TẤT THÀNH CÔNG!"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error during seeding: {str(e)}"))

    def _clear_old_data(self):
        Job.objects.all().delete()
        Company.objects.all().delete()
        # Xóa các user thuộc role company (giữ lại admin nếu có)
        CustomUser.objects.filter(role=CustomUser.Role.COMPANY).delete()
        self.stdout.write("Đã dọn dẹp dữ liệu Job, Company và User(role=Company) cũ.")

    def _seed_users(self, count):
        users = []
        for i in range(count):
            email = f"employer{i+1}@fakecompany.com"
            user = CustomUser(
                email=email,
                full_name=f"HR Manager {i+1}",
                role=CustomUser.Role.COMPANY,
                status=CustomUser.Status.ACTIVE,
                email_verified=True
            )
            user.set_password("Abc@12345")
            users.append(user)
        
        created_users = CustomUser.objects.bulk_create(users)
        self.stdout.write(f"Đã tạo {len(created_users)} users đóng vai trò nhà tuyển dụng.")
        # Lấy lại objects có gán ID từ DB (sau khi bulk_create)
        return list(CustomUser.objects.filter(role=CustomUser.Role.COMPANY))

    def _seed_companies(self, users):
        companies = []
        industries = list(Industry.objects.all())
        addresses = list(Address.objects.all()[:20]) # Lấy tạm 20 địa chỉ random

        if not industries:
            self.stdout.write(self.style.ERROR("Chưa có Industry nào. Vui lòng chạy lệnh seed_master_data trước."))
            return []

        # Trộn ngẫu nhiên danh sách tên công ty
        random_names = random.sample(COMPANY_NAMES, min(len(COMPANY_NAMES), len(users)))

        for i, user in enumerate(users):
            if i >= len(random_names):
                break
                
            name = random_names[i]
            base_slug = slugify(name)
            
            companies.append(Company(
                user=user,
                company_name=name,
                slug=f"{base_slug}-{random.randint(1000, 9999)}",
                company_size=random.choice([choice[0] for choice in Company.CompanySize.choices]),
                industry=random.choice(industries) if industries else None,
                verification_status=Company.VerificationStatus.VERIFIED,
                address=random.choice(addresses) if addresses else None,
                logo_url=f"https://ui-avatars.com/api/?name={base_slug}&background=random&color=fff&size=200",
                description=f"Công ty {name} là một trong những đơn vị phát triển công nghệ hàng đầu, mang đến môi trường làm việc tuyệt vời, chú trọng vào con người và không ngừng đổi mới.",
                website=f"https://www.{base_slug.replace('-', '')}.com.vn",
                job_count=0
            ))

        created_companies = Company.objects.bulk_create(companies)
        self.stdout.write(f"Đã tạo {len(created_companies)} hồ sơ công ty.")
        # Lấy lại các entities có id
        return list(Company.objects.all())

    def _seed_jobs(self, companies, count):
        if not companies:
            return

        jobs = []
        categories = list(JobCategory.objects.all())
        addresses = list(Address.objects.all()[:30])

        levels_choices = [c[0] for c in Job.Level.choices]
        types_choices = [c[0] for c in Job.JobType.choices]
        
        now = timezone.now()

        for i in range(count):
            comp = random.choice(companies)
            title = random.choice(JOB_TITLES)
            base_slug = slugify(title)
            
            # Giả lập range lương (có 20% thỏa thuận)
            is_negotiable = random.random() < 0.2
            min_salary = random.randint(500, 2000) if not is_negotiable else None
            max_salary = min_salary + random.randint(300, 1000) if min_salary else None
            
            is_remote = random.random() < 0.3

            # Random status đa số là published, thiểu số là expired/draft
            status_rand = random.random()
            if status_rand < 0.8:
                status = Job.Status.PUBLISHED
            elif status_rand < 0.9:
                status = Job.Status.EXPIRED
            else:
                status = Job.Status.DRAFT

            jobs.append(Job(
                company=comp,
                title=f"{title} (Hot Job {i+1})",
                slug=f"{base_slug}-{random.randint(10000, 99999)}",
                category=random.choice(categories) if categories else None,
                job_type=random.choice(types_choices),
                level=random.choice(levels_choices),
                experience_years_min=random.randint(0, 3),
                experience_years_max=random.randint(4, 10),
                salary_min=min_salary,
                salary_max=max_salary,
                salary_currency="USD",
                is_salary_negotiable=is_negotiable,
                number_of_positions=random.randint(1, 10),
                description=f"Tuyển dụng vị trí {title}. Bạn sẽ được làm việc trong môi trường chuyên nghiệp với những con người giỏi nhất.",
                requirements="<ul><li>Có kinh nghiệm tối thiểu 1 năm.</li><li>Khả năng làm việc nhóm tốt</li><li>Chịu áp lực tốt</li></ul>",
                benefits="<ul><li>Lương tháng 13</li><li>Review lương 2 lần/năm</li><li>Du lịch công ty hàng năm</li></ul>",
                address=random.choice(addresses) if addresses else None,
                is_remote=is_remote,
                application_deadline=now.date() + timedelta(days=random.randint(10, 60)),
                status=status,
                published_at=now - timedelta(days=random.randint(0, 30)) if status != Job.Status.DRAFT else None,
                created_by=comp.user,
                view_count=random.randint(10, 1000),
                application_count=random.randint(0, 50),
                featured=random.random() < 0.1,
            ))

        # Update job_count reference cho company một cách tương đối
        Company.objects.update(job_count=count // len(companies))

        batch_size = 100
        for i in range(0, len(jobs), batch_size):
            Job.objects.bulk_create(jobs[i:i + batch_size])
            
        self.stdout.write(f"Đã tạo {len(jobs)} tin tuyển dụng.")
