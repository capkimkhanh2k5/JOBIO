from rest_framework import serializers
from apps.social.referral_programs.models import ReferralProgram

class ReferralProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferralProgram
        fields = [
            'id', 'company', 'program_name', 'description', 
            'bonus_amount', 'bonus_currency', 'terms_conditions',
            'is_active', 'start_date', 'end_date', 'created_at'
        ]
