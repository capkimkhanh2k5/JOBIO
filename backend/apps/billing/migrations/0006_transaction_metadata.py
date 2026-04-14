from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0005_alter_companysubscription_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='transaction',
            name='metadata',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
