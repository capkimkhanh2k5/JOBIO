from django.db import migrations, models
from django.db.models import Q


def deduplicate_active_subscriptions(apps, schema_editor):
    CompanySubscription = apps.get_model("billing", "CompanySubscription")

    company_ids = (
        CompanySubscription.objects.filter(status="active")
        .values_list("company_id", flat=True)
        .distinct()
    )

    for company_id in company_ids:
        active_qs = CompanySubscription.objects.filter(
            company_id=company_id,
            status="active",
        ).order_by("-end_date", "-created_at", "-id")

        keep = active_qs.first()
        if not keep:
            continue

        active_qs.exclude(id=keep.id).update(status="cancelled", auto_renew=False)


def noop_reverse(apps, schema_editor):
    return


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0006_transaction_metadata"),
    ]

    operations = [
        migrations.RunPython(deduplicate_active_subscriptions, noop_reverse),
        migrations.AddConstraint(
            model_name="companysubscription",
            constraint=models.UniqueConstraint(
                condition=Q(status="active"),
                fields=("company",),
                name="uniq_active_subscription_per_company",
            ),
        ),
    ]
