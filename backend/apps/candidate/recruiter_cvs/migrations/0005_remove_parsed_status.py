# Generated migration to remove parsed_status field
# The field is no longer needed — cv_data truthy/empty is sufficient.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('candidate_recruiter_cvs', '0004_add_parsed_status_fields'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='recruitercv',
            name='parsed_status',
        ),
    ]
