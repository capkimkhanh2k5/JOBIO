from rest_framework import serializers
from apps.billing.models import SubscriptionPlan, CompanySubscription, PaymentMethod, Transaction

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'slug', 'price', 'currency', 'duration_days', 'features', 'is_active', 'created_at']

class CompanySubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    
    class Meta:
        model = CompanySubscription
        fields = ['id', 'company', 'plan', 'start_date', 'end_date', 'status', 'auto_renew']

class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = ['id', 'name', 'code', 'is_active']

class TransactionSerializer(serializers.ModelSerializer):
    payment_method = PaymentMethodSerializer(read_only=True)
    plan_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Transaction
        fields = ['id', 'company', 'payment_method', 'amount', 'currency', 'type', 'status', 'reference_code', 'description', 'metadata', 'created_at', 'plan_name']

    def get_plan_name(self, obj):
        metadata = getattr(obj, 'metadata', None) or {}
        if metadata.get('plan_name'):
            return metadata.get('plan_name')

        plan_id = metadata.get('plan_id')
        if plan_id:
            try:
                subscription = obj.company.subscriptions.filter(plan_id=plan_id).select_related('plan').order_by('-created_at').first()
                if subscription:
                    return subscription.plan.name
            except Exception:
                pass

        return None

class SubscribeInputSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()
    payment_method_code = serializers.CharField(required=False, allow_null=True)
