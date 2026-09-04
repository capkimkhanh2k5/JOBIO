import django.db.models.deletion
from django.db import migrations, models


def create_owner_members(apps, _schema_editor):
    Company = apps.get_model("company_companies", "Company")
    CompanyMember = apps.get_model("company_companies", "CompanyMember")

    rows = []
    for company in Company.objects.exclude(user_id__isnull=True).only("id", "user_id"):
        rows.append(
            CompanyMember(
                company_id=company.id,
                user_id=company.user_id,
                role="owner",
                status="active",
            )
        )
    CompanyMember.objects.bulk_create(rows, ignore_conflicts=True)


class Migration(migrations.Migration):
    dependencies = [
        ("company_companies", "0005_company_headquarters"),
        ("core_users", "0006_rename_role_recruiter_to_candidate"),
    ]

    operations = [
        migrations.CreateModel(
            name="CompanyMember",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "role",
                    models.CharField(
                        choices=[
                            ("owner", "Owner"),
                            ("admin", "Admin"),
                            ("recruiter", "Recruiter"),
                            ("viewer", "Viewer"),
                        ],
                        default="recruiter",
                        max_length=20,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("active", "Active"),
                            ("invited", "Invited"),
                            ("disabled", "Disabled"),
                        ],
                        db_index=True,
                        default="active",
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="members",
                        to="company_companies.company",
                    ),
                ),
                (
                    "invited_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="company_member_invitations",
                        to="core_users.customuser",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="company_memberships",
                        to="core_users.customuser",
                    ),
                ),
            ],
            options={
                "verbose_name": "Thành viên công ty",
                "verbose_name_plural": "Thành viên công ty",
                "db_table": "company_members",
            },
        ),
        migrations.AddIndex(
            model_name="companymember",
            index=models.Index(
                fields=["company", "status"], name="idx_company_member_status"
            ),
        ),
        migrations.AddIndex(
            model_name="companymember",
            index=models.Index(
                fields=["user", "status"], name="idx_company_member_user"
            ),
        ),
        migrations.AddConstraint(
            model_name="companymember",
            constraint=models.UniqueConstraint(
                fields=("company", "user"), name="uq_company_member_company_user"
            ),
        ),
        migrations.RunPython(create_owner_members, migrations.RunPython.noop),
    ]
