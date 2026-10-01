from django.db import migrations, models
from pgvector.django import VectorExtension, VectorField


def create_pgvector_indexes(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    schema_editor.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_job_embeddings_pgvector_hnsw
        ON job_embeddings USING hnsw (embedding vector_cosine_ops)
        WHERE embedding IS NOT NULL
        """
    )
    schema_editor.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_candidate_rec_embeddings_pgvector_hnsw
        ON candidate_recommendation_embeddings USING hnsw (embedding vector_cosine_ops)
        WHERE embedding IS NOT NULL
        """
    )


def drop_pgvector_indexes(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    schema_editor.execute("DROP INDEX IF EXISTS idx_job_embeddings_pgvector_hnsw")
    schema_editor.execute(
        "DROP INDEX IF EXISTS idx_candidate_rec_embeddings_pgvector_hnsw"
    )


class Migration(migrations.Migration):
    dependencies = [
        ("recruitment_jobs", "0009_recommendation_event_operational_fields"),
    ]

    operations = [
        VectorExtension(),
        migrations.AddField(
            model_name="jobembedding",
            name="model_version",
            field=models.CharField(
                blank=True, db_index=True, default="", max_length=80
            ),
        ),
        migrations.AddField(
            model_name="jobembedding",
            name="dimensions",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="jobembedding",
            name="embedding",
            field=VectorField(blank=True, dimensions=1024, null=True),
        ),
        migrations.AddField(
            model_name="candidaterecommendationembedding",
            name="model_version",
            field=models.CharField(
                blank=True, db_index=True, default="", max_length=80
            ),
        ),
        migrations.AddField(
            model_name="candidaterecommendationembedding",
            name="dimensions",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="candidaterecommendationembedding",
            name="embedding",
            field=VectorField(blank=True, dimensions=1024, null=True),
        ),
        migrations.RunPython(create_pgvector_indexes, drop_pgvector_indexes),
    ]
