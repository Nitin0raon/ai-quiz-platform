
"""
Quizzes App - AI Quiz Generation Service (Groq Version)
Uses Groq's free API with Llama 3 
"""

import json
import logging
import re
from django.conf import settings

logger = logging.getLogger('apps.quizzes')


QUIZ_GENERATION_PROMPT = """
You are an expert quiz creator. Generate {num_questions} Multiple Choice Questions (MCQs) based ONLY on the provided context.

CONTEXT:
{context}

INSTRUCTIONS:
- Topic: {topic}
- Difficulty: {difficulty}
- Generate EXACTLY {num_questions} questions
- Base ALL questions on the context above only

Respond with ONLY a valid JSON array, no explanation, no markdown:

[
  {{
    "question": "Question text here?",
    "option_a": "First option",
    "option_b": "Second option",
    "option_c": "Third option",
    "option_d": "Fourth option",
    "correct_answer": "B",
    "explanation": "Why this answer is correct."
  }}
]

RULES:
- correct_answer must be exactly A, B, C, or D
- Return ONLY the JSON array, nothing else
"""


class GeminiQuizService:
    """
    Quiz generation using Groq API (free tier, no quota issues).
    Drop-in replacement for Gemini.
    """

    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            from groq import Groq
            api_key = getattr(settings, 'GROQ_API_KEY', '') or ''
            if not api_key:
                raise ValueError(
                    "GROQ_API_KEY is not set in your .env file. "
                    "Get a free key at https://console.groq.com"
                )
            self._client = Groq(api_key=api_key)
        return self._client

    def _retrieve_context(self, document, topic: str, num_chunks: int = 5) -> str:
        """Retrieve relevant context from document."""
        if document.faiss_index_id:
            try:
                from apps.rag.services import FAISSService
                results = FAISSService().search(document.faiss_index_id, query=topic, top_k=num_chunks)
                if results:
                    return '\n\n---\n\n'.join([r['content'] for r in results])
            except Exception as e:
                logger.warning(f"FAISS retrieval failed: {e}")

        if document.extracted_text:
            return document.extracted_text[:3000]

        from apps.documents.models import DocumentChunk
        chunks = DocumentChunk.objects.filter(document=document).order_by('chunk_index')[:num_chunks]
        if chunks:
            return '\n\n'.join([c.content for c in chunks])

        raise ValueError("No content available. Process the document first.")

    def generate_quiz(self, document, topic: str, difficulty: str = 'medium',
                      num_questions: int = 10) -> dict:
        try:
            num_questions = max(5, min(20, num_questions))
            if difficulty not in ('easy', 'medium', 'hard'):
                difficulty = 'medium'

            context = self._retrieve_context(document, topic)
            if not context:
                raise ValueError("Could not retrieve content from document.")

            prompt = QUIZ_GENERATION_PROMPT.format(
                num_questions=num_questions,
                context=context[:3000],
                topic=topic,
                difficulty=difficulty.upper(),
            )

            logger.info(f"Calling Groq API to generate {num_questions} questions...")
            client = self._get_client()

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert quiz creator. Always respond with valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=4000,
            )

            response_text = response.choices[0].message.content
            questions = self._parse_response(response_text, num_questions)

            logger.info(f"Successfully generated {len(questions)} questions via Groq")

            return {
                'success': True,
                'questions': questions,
                'context_used': context[:200] + '...',
                'error': None,
            }

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Quiz generation failed: {error_msg}")
            return {
                'success': False,
                'questions': [],
                'context_used': None,
                'error': error_msg,
            }

    def _parse_response(self, response_text: str, expected_count: int) -> list:
        text = response_text.strip()
        # Remove markdown code blocks
        text = re.sub(r'^```json\s*', '', text)
        text = re.sub(r'^```\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
        text = text.strip()

        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            match = re.search(r'\[.*\]', text, re.DOTALL)
            if match:
                data = json.loads(match.group())
            else:
                raise ValueError(f"Could not parse response as JSON. Preview: {text[:200]}")

        if not isinstance(data, list):
            raise ValueError("Expected a JSON array of questions.")

        valid_questions = []
        for i, q in enumerate(data):
            try:
                validated = self._validate_question(q, i + 1)
                valid_questions.append(validated)
            except ValueError as e:
                logger.warning(f"Skipping invalid question {i+1}: {e}")

        if not valid_questions:
            raise ValueError("No valid questions could be parsed from the AI response.")

        return valid_questions

    def _validate_question(self, q: dict, index: int) -> dict:
        required = ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer']
        for field in required:
            if field not in q or not str(q[field]).strip():
                raise ValueError(f"Missing field: {field}")

        correct = str(q['correct_answer']).strip().upper()
        if correct not in ('A', 'B', 'C', 'D'):
            raise ValueError(f"Invalid correct_answer: '{correct}'")

        return {
            'question_text': str(q['question']).strip(),
            'option_a': str(q['option_a']).strip(),
            'option_b': str(q['option_b']).strip(),
            'option_c': str(q['option_c']).strip(),
            'option_d': str(q['option_d']).strip(),
            'correct_answer': correct,
            'explanation': str(q.get('explanation', '')).strip(),
            'order': index,
        }