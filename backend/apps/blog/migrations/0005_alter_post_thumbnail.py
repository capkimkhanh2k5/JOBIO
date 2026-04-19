from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0004_post_is_featured'),
    ]

    operations = [
        migrations.AlterField(
            model_name='post',
            name='thumbnail',
            field=models.URLField(blank=True, max_length=500, null=True, verbose_name='Thumbnail URL'),
        ),
    ]
