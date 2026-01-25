import google.generativeai as genai
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class GeminiService:
    _configured = False

    @classmethod
    def _configure(cls):
        if not cls._configured:
            if not settings.GEMINI_API_KEY:
                logger.warning("GEMINI_API_KEY not configured.")
                return False
            genai.configure(api_key=settings.GEMINI_API_KEY)
            cls._configured = True
        return True

    @classmethod
    def get_embedding(cls, text: str):
        """
        Get embedding for text using 'models/embedding-001'.
        Returns list of floats or None.
        """
        if not cls._configure():
            return None
        
        try:
            # Clean text
            text = text.strip()
            if not text:
                return None
                
            # Embed content
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document",
                title="CV Embedding"
            )
            return result['embedding']
        except Exception as e:
            logger.error(f"Gemini embedding error: {e}")
            return None

    @classmethod
    def generate_content(cls, prompt: str) -> str:
        """
        Generate text content using 'gemini-1.5-flash'.
        Returns string response or None.
        """
        if not cls._configure():
            return None
            
        try:
            model = genai.GenerativeModel('models/gemini-2.0-flash')
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini generation error: {e}")
            return None

    @classmethod
    def generate_json(cls, prompt: str) -> str:
        """
        Generate JSON content. Ensures response is JSON formatted.
        """
        json_prompt = f"{prompt}\n\nIMPORTANT: Return ONLY valid JSON format. No markdown code blocks."
        response = cls.generate_content(json_prompt)
        if response:
            # Clean up markdown if present
            clean_response = response.replace('```json', '').replace('```', '').strip()
            return clean_response
        return None
