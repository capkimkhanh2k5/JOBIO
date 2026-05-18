from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("system_system_settings", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            DROP TABLE IF EXISTS recruitment_campaigns_jobs;
            DROP TABLE IF EXISTS recruitment_campaigns;
            DROP TABLE IF EXISTS campaign_jobs;

            DROP TABLE IF EXISTS recruitment_referrals_referralprogram_jobs;
            DROP TABLE IF EXISTS recruitment_referrals_referral;
            DROP TABLE IF EXISTS recruitment_referrals_referralprogram;

            DROP TABLE IF EXISTS referrals;
            DROP TABLE IF EXISTS referral_programs;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
