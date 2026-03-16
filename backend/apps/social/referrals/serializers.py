from rest_framework import serializers
from apps.social.referrals.models import Referral
from apps.social.referral_programs.serializers import ReferralProgramSerializer

class ReferralSerializer(serializers.ModelSerializer):
    program_detail = ReferralProgramSerializer(source='program', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    referrer_name = serializers.CharField(source='referrer.full_name', read_only=True)
    
    class Meta:
        model = Referral
        fields = [
            'id', 'program', 'program_detail', 'job', 'job_title', 
            'referrer', 'referrer_name', 'referred_email', 'referred_name', 
            'referred_phone', 'status', 'bonus_amount', 'bonus_paid', 
            'notes', 'created_at', 'updated_at'
        ]

class ReferralCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Referral
        fields = [
            'program', 'job', 'referred_email', 'referred_name', 
            'referred_phone', 'notes'
        ]
        
    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['referrer'] = user
        return super().create(validated_data)
