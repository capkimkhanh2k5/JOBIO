import json
import os
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.recruitment.jobs.models import CanonicalTitle, JobTitleAlias, SkillAlias
from apps.candidate.skills.models import Skill
from apps.recruitment.jobs.services.normalization import normalize_key


class Command(BaseCommand):
    help = "Seeds recommendation taxonomy (Canonical Titles, Title Aliases, Skill Aliases) from DataSet/Data/recommendation_taxonomy.json"

    def handle(self, *args, **options):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        data_dir = os.path.normpath(
            os.path.join(
                base_dir, "..", "..", "..", "..", "..", "..", "DataSet", "Data"
            )
        )
        json_path = os.path.join(data_dir, "recommendation_taxonomy.json")

        if not os.path.exists(json_path):
            self.stdout.write(self.style.ERROR(f"File not found: {json_path}"))
            return

        with open(json_path, "r", encoding="utf-8") as f:
            taxonomy_data = json.load(f)

        with transaction.atomic():
            canonical_objs = {}
            for item in taxonomy_data.get("canonical_titles", []):
                obj, _ = CanonicalTitle.objects.get_or_create(
                    name=item["name"],
                    defaults={
                        "category": item.get("category", ""),
                        "description": item.get("description", ""),
                        "is_active": item.get("is_active", True),
                    },
                )
                canonical_objs[item.get("id")] = obj
                canonical_objs[obj.name] = obj

            created_title_aliases = 0
            for item in taxonomy_data.get("title_aliases", []):
                canonical_id = item.get("canonical_title_id")
                canonical_obj = canonical_objs.get(canonical_id)
                if canonical_obj:
                    norm = item.get("normalized_alias") or normalize_key(
                        item["alias_name"]
                    )
                    if norm:
                        obj, created = JobTitleAlias.objects.get_or_create(
                            normalized_alias=norm,
                            canonical_title=canonical_obj,
                            defaults={
                                "alias_name": item["alias_name"],
                                "language": item.get("language", "en"),
                                "weight": item.get("weight", 1.0),
                                "normalized_alias": norm,
                            },
                        )
                        if created:
                            created_title_aliases += 1

            created_skill_aliases = 0
            for item in taxonomy_data.get("skill_aliases", []):
                skill_name = item.get("skill_name")
                skill_obj = (
                    Skill.objects.filter(name__icontains=skill_name).first()
                    if skill_name
                    else None
                )
                if skill_obj:
                    norm = item.get("normalized_alias") or normalize_key(
                        item["alias_name"]
                    )
                    if norm:
                        obj, created = SkillAlias.objects.get_or_create(
                            normalized_alias=norm,
                            skill=skill_obj,
                            defaults={
                                "alias_name": item["alias_name"],
                                "normalized_alias": norm,
                            },
                        )
                        if created:
                            created_skill_aliases += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded Recommendation Taxonomy: {len(canonical_objs)} Canonical Titles, {created_title_aliases} Title Aliases, {created_skill_aliases} Skill Aliases!"
            )
        )
