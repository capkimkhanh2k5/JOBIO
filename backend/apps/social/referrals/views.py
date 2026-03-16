from rest_framework import viewsets, permissions
from apps.social.referrals.models import Referral
from apps.social.referrals.serializers import ReferralSerializer, ReferralCreateSerializer

class ReferralViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users see referrals they made
        return Referral.objects.filter(referrer=self.request.user).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReferralCreateSerializer
        return ReferralSerializer
