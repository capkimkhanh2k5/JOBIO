from django.db import migrations, models


DROP_JOB_HNSW = "DROP INDEX IF EXISTS idx_job_embeddings_pgvector_hnsw"

DROP_CANDIDATE_HNSW = "DROP INDEX IF EXISTS idx_candidate_rec_embeddings_pgvector_hnsw"

CREATE_JOB_HNSW = """
CREATE INDEX IF NOT EXISTS idx_job_embeddings_pgvector_hnsw
ON job_embeddings USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64)
WHERE embedding IS NOT NULL;
"""

CREATE_CANDIDATE_HNSW = """
CREATE INDEX IF NOT EXISTS idx_candidate_rec_embeddings_pgvector_hnsw
ON candidate_recommendation_embeddings USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64)
WHERE embedding IS NOT NULL;
"""

RESTORE_JOB_HNSW = """
CREATE INDEX IF NOT EXISTS idx_job_embeddings_pgvector_hnsw
ON job_embeddings USING hnsw (embedding vector_cosine_ops)
WHERE embedding IS NOT NULL;
"""

RESTORE_CANDIDATE_HNSW = """
CREATE INDEX IF NOT EXISTS idx_candidate_rec_embeddings_pgvector_hnsw
ON candidate_recommendation_embeddings USING hnsw (embedding vector_cosine_ops)
WHERE embedding IS NOT NULL;
"""


def create_tuned_hnsw_indexes(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    schema_editor.execute(DROP_JOB_HNSW)
    schema_editor.execute(CREATE_JOB_HNSW)
    schema_editor.execute(DROP_CANDIDATE_HNSW)
    schema_editor.execute(CREATE_CANDIDATE_HNSW)


def restore_default_hnsw_indexes(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    schema_editor.execute(DROP_JOB_HNSW)
    schema_editor.execute(DROP_CANDIDATE_HNSW)
    schema_editor.execute(RESTORE_JOB_HNSW)
    schema_editor.execute(RESTORE_CANDIDATE_HNSW)


class Migration(migrations.Migration):
    dependencies = [
        ("recruitment_jobs", "0010_pgvector_recommendation_embeddings"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="job",
            index=models.Index(
                fields=[
                    "status",
                    "domain_status",
                    "moderation_status",
                    "application_deadline",
                    "published_at",
                ],
                name="idx_jobs_public_deadline",
            ),
        ),
        migrations.AddIndex(
            model_name="job",
            index=models.Index(
                fields=["company", "status", "created_at"],
                name="idx_jobs_co_stat_created",
            ),
        ),
        migrations.RunPython(create_tuned_hnsw_indexes, restore_default_hnsw_indexes),
    ]
