import json
import logging
from apps.assessment.ai_matching_scores.services.gemini_service import GeminiService
from apps.candidate.recruiters.models import Recruiter

logger = logging.getLogger(__name__)

class ProfileEvaluator:
    
    @staticmethod
    def _build_profile_text(recruiter: Recruiter) -> str:
        parts = []
        if recruiter.current_position:
            parts.append(f"Position: {recruiter.current_position}")
        if recruiter.bio:
            parts.append(f"Bio: {recruiter.bio}")
        if recruiter.years_of_experience:
            parts.append(f"Experience: {recruiter.years_of_experience} years")
            
        # Add skills
        if hasattr(recruiter, 'skills'):
            skills = [s.skill.name for s in recruiter.skills.all()]
            if skills:
                parts.append(f"Skills: {', '.join(skills)}")
                
        # Add education
        if hasattr(recruiter, 'education'):
            edus = [f"{e.degree} in {e.field_of_study}" for e in recruiter.education.all() if e.degree and e.field_of_study]
            if edus:
                parts.append(f"Education: {'; '.join(edus)}")
                
        return "\n".join(parts)

    @classmethod
    def evaluate(cls, recruiter: Recruiter) -> dict:
        """
        Evaluate recruiter profile using Gemini AI.
        """
        if not settings.GEMINI_API_KEY:
            return None
            
        profile_text = cls._build_profile_text(recruiter)
        if len(profile_text) < 50: # Too short to evaluate
            return {
                "score": 0,
                "feedback": ["Profile is too empty. Please add bio, experience and skills."],
                "strong_points": [],
                "weak_points": ["Insufficient information"]
            }

        prompt = f"""
        Act as a Senior HR Manager. Evaluate this candidate profile for a professional job market.
        
        Profile Data:
        {profile_text}
        
        Analyze:
        1. Clarity and Professionalism of Bio.
        2. Relevance of Skills vs Position.
        3. Overall completeness and impact.
        
        Return JSON format with the following keys:
        - score (integer 0-100)
        - explanation (string, brief summary)
        - strong_points (list of strings)
        - weak_points (list of strings)
        - improvement_suggestions (list of strings)
        """
        
        try:
            json_str = GeminiService.generate_json(prompt)
            if not json_str:
                return None
                
            result = json.loads(json_str)
            return result
        except json.JSONDecodeError:
            logger.error("Failed to decode JSON from Gemini response")
            return None
        except Exception as e:
            logger.error(f"Profile evaluation error: {e}")
            return None
