from rest_framework import serializers
from apps.billing.models import SubscriptionPlan, CompanySubscription, PaymentMethod, Transaction
from apps.recruitment.jobs.models import Job
import json

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'slug', 'price', 'currency', 'duration_days', 'features', 'is_active', 'created_at']

class CompanySubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    usage = serializers.SerializerMethodField()
    
    class Meta:
        model = CompanySubscription
        fields = ['id', 'company', 'plan', 'start_date', 'end_date', 'status', 'auto_renew', 'usage']

    @staticmethod
    def _feature_value(features, *keys, default=0):
        for key in keys:
            value = features.get(key)
            if value is not None:
                return value
        return default

    def get_usage(self, obj):
        # Count active jobs
        active_jobs_count = Job.objects.filter(
            company=obj.company,
            status='published'
        ).count()
        
        # Count featured jobs
        featured_jobs_count = Job.objects.filter(
            company=obj.company,
            status='published',
            featured=True
        ).count()
        
        # Get limits from plan features
        features = obj.plan.features or {}
        
        return {
            'jobs': {
                'current': active_jobs_count,
                'limit': self._feature_value(features, 'job_post_limit', 'max_jobs', 'max_job_posts')
            },
            'featured_jobs': {
                'current': featured_jobs_count,
                'limit': self._feature_value(features, 'featured_job_limit', 'max_featured_jobs')
            },
            'cv_views': {
                'current': 0, # Not tracked yet
                'limit': self._feature_value(features, 'cv_view_limit', 'max_cv_views', 'max_cv_view')
            },
            'ai_matching': {
                'enabled': self._feature_value(features, 'has_ai_matching', 'ai_matching', default=False)
            }
        }

class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = ['id', 'name', 'code', 'is_active']

class TransactionSerializer(serializers.ModelSerializer):
    payment_method = PaymentMethodSerializer(read_only=True)
    plan_name = serializers.SerializerMethodField()
    clean_description = serializers.SerializerMethodField()
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'company', 'payment_method', 'amount', 'currency', 
            'type', 'status', 'reference_code', 'description', 
            'clean_description', 'metadata', 'created_at', 'plan_name'
        ]

    def get_plan_name(self, obj):
        metadata = obj.metadata or {}
        if isinstance(metadata, str):
            try:
                metadata = json.loads(metadata)
            except Exception:
                metadata = {}
                
        if isinstance(metadata, dict) and metadata.get('plan_name'):
            return metadata.get('plan_name')

        if isinstance(metadata, dict) and metadata.get('plan_id'):
            return SubscriptionPlan.objects.filter(id=metadata.get('plan_id')).values_list('name', flat=True).first()
        
        # Fallback to description parsing
        desc = obj.description or ""
        if "Subscribe to " in desc:
            return desc.split('|')[0].replace("Subscribe to ", "").strip()
        return None

    def get_clean_description(self, obj):
        desc = obj.description or ""
        return desc.split('|')[0].strip()

class AdminTransactionSerializer(TransactionSerializer):
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    user_email = serializers.CharField(source='company.user.email', read_only=True)

    class Meta(TransactionSerializer.Meta):
        fields = TransactionSerializer.Meta.fields + ['company_name', 'user_email']

class SubscribeInputSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()
    payment_method_code = serializers.CharField(required=False, allow_null=True)
