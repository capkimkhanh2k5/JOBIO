from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.company.companies.serializers import CompanySerializer
from apps.social.company_followers.serializers import CompanyFollowerSerializer
from apps.social.company_followers.services.company_followers import (
    follow_company_service, 
    unfollow_company_service
)
from apps.social.company_followers.selectors import (
    list_following_companies, 
    check_is_following
)
from apps.company.companies.models import Company
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

class CompanyFollowerViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Follow company",
        description="Allow candidates to follow a company",
        responses={201: CompanyFollowerSerializer}
    )
    @action(detail=True, methods=['post'], url_path='follow')
    def follow(self, request, pk=None):
        try:
            follower = follow_company_service(user=request.user, company_id=pk)
            serializer = CompanyFollowerSerializer(follower)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Unfollow company",
        description="Allow candidates to unfollow a company",
        responses={204: None}
    )
    @action(detail=True, methods=['delete'], url_path='unfollow')
    def unfollow(self, request, pk=None):
        try:
            unfollow_company_service(user=request.user, company_id=pk)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
    @extend_schema(
        summary="Check if following company",
        description="Check if user is following a company",
        responses={200: OpenApiTypes.OBJECT}
    )
    @action(detail=True, methods=['get'], url_path='is-following')
    def is_following(self, request, pk=None):
        is_following = check_is_following(user=request.user, company_id=pk)
        return Response({"is_following": is_following}, status=status.HTTP_200_OK)

    @extend_schema(
        summary="List following companies",
        description="List companies that user is following",
        responses={200: CompanySerializer(many=True)}
    )
    @action(detail=False, methods=['get'], url_path='me/following')
    def following_companies(self, request):
        companies = list_following_companies(user=request.user)
        serializer = CompanySerializer(companies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
