from django.db import migrations


def drop_pgvector_artifacts(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    schema_editor.execute("DROP INDEX IF EXISTS idx_job_embeddings_hnsw")
    schema_editor.execute("DROP INDEX IF EXISTS idx_candidate_rec_embeddings_hnsw")
    schema_editor.execute("DROP TABLE IF EXISTS canonical_title_embeddings CASCADE")
    schema_editor.execute("ALTER TABLE job_embeddings DROP COLUMN IF EXISTS embedding")
    schema_editor.execute(
        "ALTER TABLE candidate_recommendation_embeddings "
        "DROP COLUMN IF EXISTS embedding"
    )
    schema_editor.execute("DROP EXTENSION IF EXISTS vector")


class Migration(migrations.Migration):
    dependencies = [
        ("recruitment_jobs", "0007_canonicaltitle_canonicaltitleembedding_and_more"),
    ]

    operations = [
        migrations.RunPython(drop_pgvector_artifacts, migrations.RunPython.noop),
    ]
