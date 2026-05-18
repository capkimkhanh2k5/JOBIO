from django.db import migrations


def run_sql_if_postgres(apps, schema_editor):
    if schema_editor.connection.vendor == "postgresql":
        schema_editor.execute(
            "ALTER TABLE blog_post ALTER COLUMN thumbnail TYPE varchar(500);"
        )


def reverse_sql_if_postgres(apps, schema_editor):
    if schema_editor.connection.vendor == "postgresql":
        schema_editor.execute(
            "ALTER TABLE blog_post ALTER COLUMN thumbnail TYPE varchar(100);"
        )


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0005_alter_post_thumbnail"),
    ]

    operations = [
        migrations.RunPython(
            run_sql_if_postgres,
            reverse_sql_if_postgres,
        ),
    ]
