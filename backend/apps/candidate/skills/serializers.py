from rest_framework import serializers
from .models import Skill
from apps.candidate.skill_categories.models import SkillCategory


class SkillCategorySimpleSerializer(serializers.ModelSerializer):
    """Serializer đơn giản cho SkillCategory trong nested response"""
    
    class Meta:
        model = SkillCategory
        fields = ['id', 'name', 'slug']


class SkillListSerializer(serializers.ModelSerializer):
    """Serializer cho list, search, popular"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Skill
        fields = [
            'id', 'name', 'slug', 'category', 'category_name',
            'is_verified', 'usage_count'
        ]


class SkillDetailSerializer(serializers.ModelSerializer):
    """Serializer cho retrieve - bao gồm description"""
    category = SkillCategorySimpleSerializer(read_only=True)
    
    class Meta:
        model = Skill
        fields = [
            'id', 'name', 'slug', 'category', 'description',
            'is_verified', 'usage_count', 'created_at'
        ]


class SkillCreateSerializer(serializers.ModelSerializer):
    """Serializer cho create/update"""
    
    class Meta:
        model = Skill
        fields = ['name', 'slug', 'category', 'description', 'is_verified']


class SkillCategoryTreeSerializer(serializers.ModelSerializer):
    """Serializer cho categories action - nested tree"""
    children = serializers.SerializerMethodField()
    skills_count = serializers.SerializerMethodField()
    
    class Meta:
        model = SkillCategory
        fields = ['id', 'name', 'slug', 'description', 'skills_count', 'children']
    
    def get_children(self, obj):
        children = obj.children.filter(is_active=True).order_by('display_order', 'name')
        return SkillCategoryTreeSerializer(children, many=True).data
    
    def get_skills_count(self, obj):
        return obj.skills.count()
