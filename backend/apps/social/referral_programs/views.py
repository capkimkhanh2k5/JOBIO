from rest_framework import viewsets, permissions
from apps.social.referral_programs.models import ReferralProgram
from apps.social.referral_programs.serializers import ReferralProgramSerializer

class ReferralProgramViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ReferralProgram.objects.filter(is_active=True)
    serializer_class = ReferralProgramSerializer
    permission_classes = [permissions.IsAuthenticated]
