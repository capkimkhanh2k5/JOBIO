from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from django.apps import apps

def get_model(name):
    for m in apps.get_models():
        if m.__name__ == name:
            return m
    raise Exception(f"Model {name} not found")

class Command(BaseCommand):
    help = 'Seeds base Master Data for the Job Portal (IT focused like TopCV)'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE('Starting to seed master data...'))

        with transaction.atomic():
            self._seed_industries()
            self._seed_media_types()
            self._seed_benefit_categories()
            self._seed_job_categories()
            self._seed_skills()
            self._seed_languages()
            self._seed_subscription_plans()
            self._seed_payment_methods()

        self.stdout.write(self.style.SUCCESS('Successfully seeded all Master Data!'))

    def _seed_industries(self):
        self.stdout.write('Seeding Industries...')
        industries = [
            {'name': 'Phần mềm / CNTT', 'description': 'Phát triển phần mềm, gia công phần mềm, sản phẩm CNTT', 'icon': 'mdi-desktop-mac'},
            {'name': 'Bán lẻ / TMĐT', 'description': 'Thương mại điện tử, bán buôn, bán lẻ', 'icon': 'mdi-cart'},
            {'name': 'Tài chính / Viễn thông', 'description': 'Ngân hàng, tài chính, ví điện tử, viễn thông', 'icon': 'mdi-bank'},
            {'name': 'Quảng cáo / Truyền thông', 'description': 'Marketing, Agency, Media', 'icon': 'mdi-bullhorn'},
            {'name': 'Giáo dục / Đào tạo', 'description': 'EdTech, trường học, trung tâm', 'icon': 'mdi-school'},
        ]
        get_model("Industry").objects.all().delete()
        for idx, item in enumerate(industries):
            get_model("Industry").objects.create(name=item['name'], slug=slugify(item['name']) or f"ind-{idx}", description=item['description'], icon=item['icon'])

    def _seed_media_types(self):
        self.stdout.write('Seeding Media Types...')
        types = ['Image', 'Video', 'Document', 'Link']
        get_model("MediaType").objects.all().delete()
        for idx, t in enumerate(types):
            get_model("MediaType").objects.create(name=t, slug=slugify(t) or f"media-{idx}")

    def _seed_benefit_categories(self):
        self.stdout.write('Seeding Benefit Categories...')
        benefits = [
            {'name': 'Chăm sóc sức khoẻ', 'icon': 'mdi-hospital-box'},
            {'name': 'Đào tạo & Phát triển', 'icon': 'mdi-book-education'},
            {'name': 'Cơ sở vật chất', 'icon': 'mdi-laptop'},
            {'name': 'Thưởng & Phụ cấp', 'icon': 'mdi-currency-usd'},
            {'name': 'Cân bằng cuộc sống', 'icon': 'mdi-clock-outline'},
            {'name': 'Câu lạc bộ & Giải trí', 'icon': 'mdi-gamepad'},
        ]
        get_model("BenefitCategory").objects.all().delete()
        for b in benefits:
            get_model("BenefitCategory").objects.create(name=b['name'], icon=b['icon'])

    def _seed_job_categories(self):
        self.stdout.write('Seeding Job Categories...')
        categories = [
            ('Backend Developer', 'mdi-server'),
            ('Frontend Developer', 'mdi-monitor-dashboard'),
            ('Fullstack Developer', 'mdi-layers'),
            ('Mobile Developer', 'mdi-cellphone'),
            ('QA/QC & Tester', 'mdi-bug-check'),
            ('AI/Data Scientist', 'mdi-robot'),
            ('Project Manager', 'mdi-account-tie'),
            ('Business Analyst', 'mdi-chart-line'),
            ('UI/UX Designer', 'mdi-palette'),
            ('DevOps / SysAdmin', 'mdi-cloud-sync'),
        ]
        get_model("JobCategory").objects.all().delete()
        for idx, (name, icon) in enumerate(categories):
            get_model("JobCategory").objects.create(name=name, slug=slugify(name) or f"cat-{idx}", icon=icon)

    def _seed_skills(self):
        self.stdout.write('Seeding Skill Categories & Skills...')
        skill_map = {
            'Backend': ['Python', 'Java', 'C#', 'PHP', 'Ruby', 'Node.js', 'Go', 'Django', 'Spring Boot', 'Laravel', 'Express'],
            'Frontend': ['HTML/CSS', 'JavaScript', 'TypeScript', 'React.js', 'Vue.js', 'Angular', 'Next.js', 'Tailwind CSS'],
            'Mobile': ['Flutter', 'React Native', 'Swift', 'Kotlin', 'Objective-C', 'Android native'],
            'Database': ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQL Server', 'Oracle'],
            'Công cụ / Môi trường': ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Linux', 'Git', 'CI/CD'],
            'Data / AI': ['Machine Learning', 'Deep Learning', 'Pandas', 'TensorFlow', 'PyTorch', 'Data Analysis'],
            'Kỹ năng mềm': ['Tiếng Anh', 'Giao tiếp', 'Làm việc nhóm', 'Thuyết trình', 'Giải quyết vấn đề'],
        }
        get_model("Skill").objects.all().delete()
        get_model("SkillCategory").objects.all().delete()
        
        idx = 0
        for cat_name, skills in skill_map.items():
            cat = get_model("SkillCategory").objects.create(name=cat_name, slug=slugify(cat_name) or f"scat-{idx}")
            for sk_name in skills:
                idx += 1
                get_model("Skill").objects.create(category=cat, name=sk_name, slug=slugify(sk_name) or f"skill-{idx}")

    def _seed_languages(self):
        self.stdout.write('Seeding Languages...')
        get_model("Language").objects.all().delete()
        get_model("Language").objects.create(name='Tiếng Việt', code='vi')
        get_model("Language").objects.create(name='English', code='en')
        get_model("Language").objects.create(name='Japanese', code='ja')
        get_model("Language").objects.create(name='Korean', code='ko')
        get_model("Language").objects.create(name='Chinese', code='zh')

    def _seed_subscription_plans(self):
        self.stdout.write('Seeding Subscription Plans...')
        plans = [
            {'name': 'Basic', 'price': 0, 'billing': 'free', 'features': {"search": True, "premium_support": False}, 'job_limit': 1, 'cv_limit': 10},
            {'name': 'Pro HR', 'price': 1500000, 'billing': 'monthly', 'features': {"search": True, "premium_support": True}, 'job_limit': 10, 'cv_limit': 200},
            {'name': 'Enterprise', 'price': 5000000, 'billing': 'monthly', 'features': {"search": True, "premium_support": True, "api_access": True}, 'job_limit': 50, 'cv_limit': 1000},
        ]
        get_model("SubscriptionPlan").objects.all().delete()
        for idx, p in enumerate(plans):
            get_model("SubscriptionPlan").objects.create(
                name=p['name'], 
                slug=slugify(p['name']) or f"plan-{idx}", 
                price=p['price'], 
                billing_cycle=p['billing'], 
                features=p['features'], 
                job_post_limit=p['job_limit'], 
                cv_view_limit=p['cv_limit']
            )

    def _seed_payment_methods(self):
        self.stdout.write('Seeding Payment Methods...')
        get_model("PaymentMethod").objects.all().delete()
        get_model("PaymentMethod").objects.create(name='Chuyển khoản Ngân hàng', code='bank_transfer', config={"instructions": "CTK: Nguyen Van A..."})
        get_model("PaymentMethod").objects.create(name='Thẻ tín dụng / Ghi nợ', code='credit_card', config={"gateway": "stripe"})
        get_model("PaymentMethod").objects.create(name='Ví MoMo', code='momo', config={"gateway": "momo"})
        get_model("PaymentMethod").objects.create(name='ZaloPay', code='zalopay', config={"gateway": "zalopay"})

