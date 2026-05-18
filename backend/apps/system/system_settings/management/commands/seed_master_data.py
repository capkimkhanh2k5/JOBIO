import json
import os

from django.core.management.base import BaseCommand
from django.db import transaction
from apps.core.utils import slugify_vietnamese as slugify
from django.apps import apps


def get_model(name):
    for m in apps.get_models():
        if m.__name__ == name:
            return m
    raise Exception(f"Model {name} not found")


def load_json(filename):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    # Navigate: commands -> management -> system_settings -> system -> apps -> backend -> project root -> DataSet/Data
    data_dir = os.path.join(
        base_dir, "..", "..", "..", "..", "..", "..", "DataSet", "Data"
    )
    filepath = os.path.normpath(os.path.join(data_dir, filename))
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


class Command(BaseCommand):
    help = "Seeds all Master Data from JSON files (DataSet/Data/)"

    def handle(self, *args, **kwargs):
        self.stdout.write(
            self.style.NOTICE("Starting to seed master data from JSON files...")
        )

        master = load_json("master_data.json")
        addresses = load_json("vietnam_addresses.json")

        with transaction.atomic():
            self._seed_provinces(addresses)
            self._seed_communes(addresses)
            self._seed_industries(master["industries"])
            self._seed_media_types(master["media_types"])
            self._seed_benefit_categories(master["benefit_categories"])
            self._seed_job_categories(master["job_categories"])
            self._seed_skill_categories(master["skill_categories"])
            self._seed_skills(master["skills"])
            self._seed_languages(master["languages"])
            self._seed_subscription_plans(master["subscription_plans"])
            self._seed_payment_methods(master["payment_methods"])

        self.stdout.write(self.style.SUCCESS("Successfully seeded all Master Data!"))

    # ───────────────── Geography ─────────────────

    def _seed_provinces(self, data):
        Province = get_model("Province")
        Province.objects.all().delete()
        objs = []
        for item in data:
            objs.append(
                Province(
                    province_name=item["province_name"],
                    province_type=item["province_type"],
                    region=item["region"],
                )
            )
        Province.objects.bulk_create(objs)
        self.stdout.write(self.style.SUCCESS(f"  ✓ Provinces: {len(objs)} records"))

    def _seed_communes(self, data):
        Province = get_model("Province")
        Commune = get_model("Commune")
        Commune.objects.all().delete()

        province_map = {p.province_name: p for p in Province.objects.all()}
        objs = []
        for prov_data in data:
            province = province_map.get(prov_data["province_name"])
            if not province:
                continue
            for commune_data in prov_data.get("communes", []):
                commune_name = commune_data["commune_name"]
                commune_type = "commune"
                if "Phường" in commune_name:
                    commune_type = "ward"
                elif "Thị trấn" in commune_name:
                    commune_type = "township"
                objs.append(
                    Commune(
                        province=province,
                        commune_name=commune_name,
                        commune_type=commune_type,
                    )
                )
        Commune.objects.bulk_create(objs, batch_size=1000)
        self.stdout.write(self.style.SUCCESS(f"  ✓ Communes: {len(objs)} records"))

    # ───────────────── Company ─────────────────

    def _seed_industries(self, data):
        Industry = get_model("Industry")
        Industry.objects.all().delete()
        objs = []
        for idx, item in enumerate(data):
            objs.append(
                Industry(
                    name=item["name"],
                    slug=item["slug"],
                    description=item.get("description", ""),
                    display_order=idx,
                )
            )
        Industry.objects.bulk_create(objs)
        self.stdout.write(self.style.SUCCESS(f"  ✓ Industries: {len(objs)} records"))

    def _seed_media_types(self, data):
        MediaType = get_model("MediaType")
        MediaType.objects.all().delete()
        objs = []
        for item in data:
            objs.append(
                MediaType(
                    type_name=item["name"],
                    description=item.get("description", ""),
                )
            )
        MediaType.objects.bulk_create(objs)
        self.stdout.write(self.style.SUCCESS(f"  ✓ MediaTypes: {len(objs)} records"))

    def _seed_benefit_categories(self, data):
        BenefitCategory = get_model("BenefitCategory")
        BenefitCategory.objects.all().delete()
        objs = []
        for idx, item in enumerate(data):
            slug = slugify(item["name"]) or f"benefit-{idx}"
            objs.append(
                BenefitCategory(
                    name=item["name"],
                    slug=slug,
                    description=item.get("description", ""),
                    display_order=idx,
                )
            )
        BenefitCategory.objects.bulk_create(objs)
        self.stdout.write(
            self.style.SUCCESS(f"  ✓ BenefitCategories: {len(objs)} records")
        )

    # ───────────────── Recruitment ─────────────────

    def _seed_job_categories(self, data):
        JobCategory = get_model("JobCategory")
        JobCategory.objects.all().delete()

        parent_map = {}
        idx = 0
        for item in data:
            if item.get("parent") is None:
                cat = JobCategory.objects.create(
                    name=item["name"],
                    slug=item["slug"],
                    description=item.get("description", ""),
                    display_order=idx,
                )
                parent_map[item["name"]] = cat
                idx += 1

        for item in data:
            if item.get("parent") is not None:
                parent = parent_map.get(item["parent"])
                JobCategory.objects.create(
                    name=item["name"],
                    slug=item["slug"],
                    description=item.get("description", ""),
                    parent=parent,
                    display_order=idx,
                )
                idx += 1

        self.stdout.write(self.style.SUCCESS(f"  ✓ JobCategories: {idx} records"))

    # ───────────────── Candidate ─────────────────

    def _seed_skill_categories(self, data):
        SkillCategory = get_model("SkillCategory")
        SkillCategory.objects.all().delete()
        objs = []
        for idx, item in enumerate(data):
            objs.append(
                SkillCategory(
                    name=item["name"],
                    slug=item["slug"],
                    description=item.get("description", ""),
                    display_order=idx,
                )
            )
        SkillCategory.objects.bulk_create(objs)
        self.stdout.write(
            self.style.SUCCESS(f"  ✓ SkillCategories: {len(objs)} records")
        )

    def _seed_skills(self, data):
        Skill = get_model("Skill")
        SkillCategory = get_model("SkillCategory")
        Skill.objects.all().delete()

        cat_map = {c.name: c for c in SkillCategory.objects.all()}
        objs = []
        for item in data:
            category = cat_map.get(item["category"])
            if not category:
                self.stdout.write(
                    self.style.WARNING(
                        f'  ⚠ Skill "{item["name"]}" skipped: category "{item["category"]}" not found'
                    )
                )
                continue
            objs.append(
                Skill(
                    name=item["name"],
                    slug=item["slug"],
                    category=category,
                    description=item.get("description", ""),
                )
            )
        Skill.objects.bulk_create(objs, batch_size=500)
        self.stdout.write(self.style.SUCCESS(f"  ✓ Skills: {len(objs)} records"))

    def _seed_languages(self, data):
        Language = get_model("Language")
        Language.objects.all().delete()
        objs = []
        for item in data:
            objs.append(
                Language(
                    language_code=item["code"],
                    language_name=item["name"],
                )
            )
        Language.objects.bulk_create(objs)
        self.stdout.write(self.style.SUCCESS(f"  ✓ Languages: {len(objs)} records"))

    # ───────────────── Billing ─────────────────

    def _seed_subscription_plans(self, data):
        SubscriptionPlan = get_model("SubscriptionPlan")
        SubscriptionPlan.objects.all().delete()

        duration_map = {
            "3_months": 90,
            "6_months": 180,
            "1_year": 365,
            "monthly": 30,
            "free": 0,
        }

        objs = []
        for item in data:
            raw_cycle = item.get("billing_cycle", "monthly")
            days = duration_map.get(raw_cycle, 30)

            # Merge root-level limits into features so the frontend can access them
            features = dict(item.get("features") or {})
            if "job_post_limit" in item:
                features["job_post_limit"] = item["job_post_limit"]
            if "cv_view_limit" in item:
                features["cv_view_limit"] = item["cv_view_limit"]

            objs.append(
                SubscriptionPlan(
                    name=item["name"],
                    slug=item["slug"],
                    price=item["price"],
                    currency="VND",
                    duration_days=days,
                    features=features,
                )
            )
        SubscriptionPlan.objects.bulk_create(objs)
        self.stdout.write(
            self.style.SUCCESS(f"  ✓ SubscriptionPlans: {len(objs)} records")
        )

    def _seed_payment_methods(self, data):
        PaymentMethod = get_model("PaymentMethod")
        PaymentMethod.objects.all().delete()
        objs = []
        for item in data:
            objs.append(
                PaymentMethod(
                    name=item["method_name"],
                    code=slugify(item["method_name"]) or "unknown",
                    config={"description": item.get("description", "")},
                )
            )
        PaymentMethod.objects.bulk_create(objs)
        self.stdout.write(
            self.style.SUCCESS(f"  ✓ PaymentMethods: {len(objs)} records")
        )
