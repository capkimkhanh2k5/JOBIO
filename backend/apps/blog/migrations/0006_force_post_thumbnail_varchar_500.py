from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("blog", "0005_alter_post_thumbnail"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE blog_post
                ALTER COLUMN thumbnail TYPE varchar(500);
            """,
            reverse_sql="""
                ALTER TABLE blog_post
                ALTER COLUMN thumbnail TYPE varchar(100);
            """,
        ),
    ]
