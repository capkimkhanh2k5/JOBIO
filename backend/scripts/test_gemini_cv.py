
# script/test_gemini.py
import os
import sys
import django

# Setup Django environment
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.assessment.ai_matching_scores.services.gemini_service import GeminiService
from apps.candidate.recruiters.services.ai_evaluation import ProfileEvaluator
from apps.candidate.recruiters.models import Recruiter
from django.contrib.auth import get_user_model

User = get_user_model()

def test_gemini():
    print("🚀 Testing Gemini Integration...")
    
    # 0. List Models
    import google.generativeai as genai
    try:
        if GeminiService._configure():
            print("Available Generation Models:")
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    print(f" - {m.name}")
    except Exception as e:
        print(f"List Models Error: {e}")

    # 1. Test Embedding
    print("\n1. Testing Embedding...")
    emb = GeminiService.get_embedding("Hello Gemini")
    if emb:
        print(f"✅ Embedding Success! Vector length: {len(emb)}")
    else:
        print("❌ Embedding Failed.")

    # 2. Test Generation
    print("\n2. Testing Content Generation...")
    text = GeminiService.generate_content("Say hello in Vietnamese")
    if text:
        print(f"✅ Generation Success: {text}")
    else:
        print("❌ Generation Failed.")

    # 3. Test Profile Evaluation
    print("\n3. Testing Profile Evaluation...")
    # Get first recruiter or create mock
    recruiter = Recruiter.objects.first()
    if not recruiter:
        print("⚠️ No recruiter found in DB. Skipping real data test.")
    else:
        print(f"Evaluating recruiter: {recruiter.id}")
        result = ProfileEvaluator.evaluate(recruiter)
        print(f"✅ Result: {result}")

if __name__ == "__main__":
    test_gemini()
