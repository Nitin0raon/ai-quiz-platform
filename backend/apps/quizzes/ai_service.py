# """
# Quizzes App - AI Quiz Generation Service
# ==========================================
# This service uses Google Gemini to generate MCQ quizzes
# from document content retrieved via RAG.

# FLOW:
# 1. Receive topic + difficulty + document_id
# 2. Use FAISS to retrieve relevant chunks from the document
# 3. Build a prompt with the retrieved context
# 4. Call Gemini API with the prompt
# 5. Parse the JSON response
# 6. Save questions to database

# PROMPT ENGINEERING TIPS:
# - Be very explicit about the output format (JSON schema)
# - Include examples in the prompt
# - Specify exactly how many questions
# - Tell the model what NOT to do
# """

# import json
# import logging
# import re
# from django.conf import settings

# logger = logging.getLogger('apps.quizzes')


# QUIZ_GENERATION_PROMPT = """
# You are an expert quiz creator and educator. Your task is to generate {num_questions} 
# Multiple Choice Questions (MCQs) based ONLY on the provided context text.

# CONTEXT FROM DOCUMENT:
# {context}

# INSTRUCTIONS:
# - Topic: {topic}
# - Difficulty Level: {difficulty}
# - Generate EXACTLY {num_questions} questions
# - All questions MUST be based on information from the context above
# - Do NOT generate questions about information not present in the context
# - Each question must have exactly 4 options (A, B, C, D)
# - Only ONE option should be correct
# - For EASY questions: Test basic factual recall
# - For MEDIUM questions: Test understanding and application
# - For HARD questions: Test analysis, comparison, or synthesis

# OUTPUT FORMAT:
# You MUST respond with ONLY a valid JSON array. No explanation, no markdown, no code blocks.
# Just a raw JSON array like this:

# [
#   {{
#     "question": "What is the capital of France?",
#     "option_a": "London",
#     "option_b": "Paris",
#     "option_c": "Berlin",
#     "option_d": "Madrid",
#     "correct_answer": "B",
#     "explanation": "Paris is the capital and largest city of France."
#   }}
# ]

# IMPORTANT:
# - correct_answer must be exactly "A", "B", "C", or "D" (uppercase letter only)
# - All fields are required
# - Respond with ONLY the JSON array, nothing else
# """


# class GeminiQuizService:
#     """
#     Generates MCQ quizzes using Google Gemini API.
#     Uses RAG to retrieve relevant context before generating.
#     """

#     def __init__(self):
#         self._model = None

#     # def _get_model(self):
#     #     """Initialize Gemini model lazily."""
#     #     if self._model is None:
#     #         import google.generativeai as genai
#     #         api_key = settings.GEMINI_API_KEY
#     #         if not api_key:
#     #             raise ValueError(
#     #                 "GEMINI_API_KEY is not set in your .env file. "
#     #                 "Get your key from https://makersuite.google.com/app/apikey"
#     #             )
#     #         genai.configure(api_key=api_key)

#     #         # gemini 1.5-flash is fast and cost-effective for text generation
#     #         self._model = genai.GenerativeModel(
#     #             model_name='gemini-1.5-flash',
#     #             generation_config=genai.types.GenerationConfig(
#     #                 temperature=0.3,        # Low temp = more focused/consistent output
#     #                 top_p=0.95,
#     #                 max_output_tokens=8192, # Plenty of room for many questions
#     #             )
#     #         )
#     #     return self._model

#     def _get_model(self):
#         if self._model is None:
#             import google.generativeai as genai
#             api_key = settings.GEMINI_API_KEY
#             if not api_key:
#                 raise ValueError("GEMINI_API_KEY is not set in your .env file.")
#             genai.configure(api_key=api_key)

#             self._model = genai.GenerativeModel(
#                 model_name='gemini-2.0-flash-lite',   # NOT gemini-2.0-flash
#                 generation_config=genai.types.GenerationConfig(
#                     temperature=0.3,
#                     top_p=0.95,
#                     max_output_tokens=8192,
#                 )
#             )
#         return self._model

#     def _retrieve_context(self, document, topic: str, num_chunks: int = 8) -> str:
#         """
#         Retrieve relevant context from FAISS for the given topic.

#         If FAISS index exists, use semantic search.
#         Fallback: Use the first N chunks of the document's text.
#         """
#         # Try semantic search first
#         if document.faiss_index_id:
#             try:
#                 from apps.rag.services import FAISSService
#                 faiss_service = FAISSService()
#                 results = faiss_service.search(
#                     document.faiss_index_id,
#                     query=topic,
#                     top_k=num_chunks
#                 )
#                 if results:
#                     # Join the retrieved chunks
#                     context = '\n\n---\n\n'.join([r['content'] for r in results])
#                     logger.info(f"Retrieved {len(results)} chunks via FAISS for topic: {topic}")
#                     return context
#             except Exception as e:
#                 logger.warning(f"FAISS retrieval failed, falling back to text: {e}")

#         # Fallback: Use the first portion of extracted text
#         if document.extracted_text:
#             # Use first 8000 characters (approx 2000 tokens)
#             context = document.extracted_text[:2000]
#             logger.info("Using raw extracted text as context (FAISS unavailable)")
#             return context

#         # Last resort: Use stored chunks
#         from apps.documents.models import DocumentChunk
#         chunks = DocumentChunk.objects.filter(
#             document=document
#         ).order_by('chunk_index')[:num_chunks]

#         if chunks:
#             return '\n\n'.join([c.content for c in chunks])

#         raise ValueError("No content available for quiz generation. Process the document first.")


#     def generate_quiz(
#         self,
#         document,
#         topic: str,
#         difficulty: str = 'medium',
#         num_questions: int = 10,
#     ) -> dict:
#         """
#         Generate a quiz using Gemini AI.

#         Args:
#             document: UploadedDocument instance
#             topic: Quiz topic/subject
#             difficulty: 'easy', 'medium', or 'hard'
#             num_questions: Number of questions to generate (5-20)

#         Returns:
#             dict with 'success', 'questions', 'error'
#         """
#         try:
#             # Validate inputs
#             num_questions = max(5, min(20, num_questions))  # Clamp between 5 and 20
#             if difficulty not in ('easy', 'medium', 'hard'):
#                 difficulty = 'medium'

#             # Step 1: Retrieve relevant context
#             logger.info(f"Retrieving context for topic: '{topic}', difficulty: {difficulty}")
#             context = self._retrieve_context(document, topic)

#             if not context:
#                 raise ValueError("Could not retrieve any content from the document.")

#             # Step 2: Build the prompt
#             prompt = QUIZ_GENERATION_PROMPT.format(
#                 num_questions=num_questions,
#                 context=context[:2000],  # Stay within token limits
#                 topic=topic,
#                 difficulty=difficulty.upper(),
#             )

#             # Step 3: Call Gemini API
#             logger.info(f"Calling Gemini API to generate {num_questions} questions...")
#             model = self._get_model()
#             response = model.generate_content(prompt)

#             if not response.text:
#                 raise ValueError("Gemini returned an empty response.")

#             # Step 4: Parse the JSON response
#             questions = self._parse_response(response.text, num_questions)

#             logger.info(f"Successfully generated {len(questions)} questions")

#             return {
#                 'success': True,
#                 'questions': questions,
#                 'context_used': context[:500] + '...',  # For debugging
#                 'error': None,
#             }

#         except Exception as e:
#             error_msg = str(e)
#             logger.error(f"Quiz generation failed: {error_msg}")
#             return {
#                 'success': False,
#                 'questions': [],
#                 'context_used': None,
#                 'error': error_msg,
#             }

#     def _parse_response(self, response_text: str, expected_count: int) -> list[dict]:
#         """
#         Parse Gemini's JSON response into a list of question dicts.
#         Handles common formatting issues like markdown code blocks.
#         """
#         # Remove markdown code blocks if present (Gemini sometimes adds these)
#         text = response_text.strip()
#         text = re.sub(r'^```json\s*', '', text)
#         text = re.sub(r'^```\s*', '', text)
#         text = re.sub(r'\s*```$', '', text)
#         text = text.strip()

#         # Parse JSON
#         try:
#             data = json.loads(text)
#         except json.JSONDecodeError:
#             # Try to extract JSON array from the response
#             match = re.search(r'\[.*\]', text, re.DOTALL)
#             if match:
#                 data = json.loads(match.group())
#             else:
#                 raise ValueError(
#                     f"Could not parse Gemini response as JSON. "
#                     f"Response preview: {text[:200]}"
#                 )

#         if not isinstance(data, list):
#             raise ValueError("Expected a JSON array of questions.")

#         # Validate and clean each question
#         valid_questions = []
#         for i, q in enumerate(data):
#             try:
#                 validated = self._validate_question(q, i + 1)
#                 valid_questions.append(validated)
#             except ValueError as e:
#                 logger.warning(f"Skipping invalid question {i+1}: {e}")

#         if not valid_questions:
#             raise ValueError("No valid questions could be parsed from the AI response.")

#         return valid_questions

#     def _validate_question(self, q: dict, index: int) -> dict:
#         """Validate a single question dict."""
#         required_fields = ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer']

#         for field in required_fields:
#             if field not in q or not str(q[field]).strip():
#                 raise ValueError(f"Missing or empty field: {field}")

#         correct = str(q['correct_answer']).strip().upper()
#         if correct not in ('A', 'B', 'C', 'D'):
#             raise ValueError(f"Invalid correct_answer: '{correct}'. Must be A, B, C, or D.")

#         return {
#             'question_text': str(q['question']).strip(),
#             'option_a': str(q['option_a']).strip(),
#             'option_b': str(q['option_b']).strip(),
#             'option_c': str(q['option_c']).strip(),
#             'option_d': str(q['option_d']).strip(),
#             'correct_answer': correct,
#             'explanation': str(q.get('explanation', '')).strip(),
#             'order': index,
#         }




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