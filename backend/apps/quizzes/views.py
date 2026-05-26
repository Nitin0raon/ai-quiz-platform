"""
Quizzes App - Views
====================
Handles quiz generation, retrieval, and attempt submission.
"""

import logging
from django.utils import timezone
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.common.pagination import StandardPagination
from apps.common.permissions import IsOwner
from apps.documents.models import UploadedDocument
from .models import Quiz, Question, QuizAttempt, QuizAnswer
from .serializers import (
    QuizGenerateSerializer,
    QuizListSerializer,
    QuizDetailSerializer,
    QuizWithAnswersSerializer,
    QuizSubmitSerializer,
    QuizAttemptResultSerializer,
    QuizAttemptListSerializer,
)
from .ai_service import GeminiQuizService

logger = logging.getLogger('apps.quizzes')


class QuizGenerateView(APIView):
    """
    POST /api/v1/quizzes/generate/
    Generate a new AI quiz from a document.

    Steps:
    1. Validate request data
    2. Get the document
    3. Call Gemini to generate questions
    4. Save quiz and questions to database
    5. Return quiz data
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = QuizGenerateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid request data.',
                'errors': serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        # Get the document
        try:
            document = UploadedDocument.objects.get(
                id=data['document_id'],
                user=request.user,
            )
        except UploadedDocument.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Document not found or you do not have access to it.',
            }, status=status.HTTP_404_NOT_FOUND)

        # Check document is processed
        if not document.extracted_text and document.chunks.count() == 0:
            return Response({
                'success': False,
                'message': (
                    f"Document '{document.title}' has not been processed yet. "
                    f"Current status: {document.status}. "
                    "Please wait for processing to complete or try reprocessing."
                ),
            }, status=status.HTTP_400_BAD_REQUEST)

        # Generate quiz using Gemini
        logger.info(
            f"Generating quiz for user {request.user.email}: "
            f"topic='{data['topic']}', difficulty={data['difficulty']}, "
            f"questions={data['num_questions']}"
        )

        ai_service = GeminiQuizService()
        result = ai_service.generate_quiz(
            document=document,
            topic=data['topic'],
            difficulty=data['difficulty'],
            num_questions=data['num_questions'],
        )

        if not result['success']:
            return Response({
                'success': False,
                'message': f"Quiz generation failed: {result['error']}",
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        questions_data = result['questions']

        if not questions_data:
            return Response({
                'success': False,
                'message': 'No questions were generated. Please try again with a different topic.',
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Save quiz to database
        title = data.get('title') or f"{data['topic']} - {data['difficulty'].capitalize()} Quiz"

        quiz = Quiz.objects.create(
            title=title,
            topic=data['topic'],
            difficulty=data['difficulty'],
            created_by=request.user,
            document=document,
            total_questions=len(questions_data),
            time_limit_minutes=data.get('time_limit_minutes', 0),
        )

        # Save questions using bulk_create for efficiency
        question_objects = [
            Question(
                quiz=quiz,
                question_text=q['question_text'],
                option_a=q['option_a'],
                option_b=q['option_b'],
                option_c=q['option_c'],
                option_d=q['option_d'],
                correct_answer=q['correct_answer'],
                explanation=q.get('explanation', ''),
                order=q['order'],
            )
            for q in questions_data
        ]
        Question.objects.bulk_create(question_objects)

        logger.info(
            f"Quiz created: '{quiz.title}' with {len(question_objects)} questions "
            f"by user: {request.user.email}"
        )

        return Response({
            'success': True,
            'message': f"Quiz generated successfully with {len(question_objects)} questions!",
            'quiz': QuizWithAnswersSerializer(quiz).data,
        }, status=status.HTTP_201_CREATED)


class QuizListView(generics.ListAPIView):
    """
    GET /api/v1/quizzes/
    List all quizzes created by the current user.
    """
    serializer_class = QuizListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    search_fields = ['title', 'topic']
    filterset_fields = ['difficulty']
    ordering_fields = ['created_at', 'title', 'difficulty']
    ordering = ['-created_at']

    def get_queryset(self):
        return Quiz.objects.filter(
            created_by=self.request.user,
            is_active=True
        ).prefetch_related('questions', 'attempts')


class QuizDetailView(APIView):
    """
    GET /api/v1/quizzes/<id>/
    Get a quiz WITHOUT answers (for taking the quiz).

    GET /api/v1/quizzes/<id>/?with_answers=true
    Get a quiz WITH answers (only for the creator).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            quiz = Quiz.objects.get(pk=pk, is_active=True)
        except Quiz.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Quiz not found.',
            }, status=status.HTTP_404_NOT_FOUND)

        # If requesting with answers, must be the creator
        with_answers = request.query_params.get('with_answers', '').lower() == 'true'

        if with_answers:
            if quiz.created_by != request.user:
                return Response({
                    'success': False,
                    'message': 'You can only view answers for quizzes you created.',
                }, status=status.HTTP_403_FORBIDDEN)
            serializer = QuizWithAnswersSerializer(quiz)
        else:
            serializer = QuizDetailSerializer(quiz)

        return Response({
            'success': True,
            'quiz': serializer.data,
        })


class QuizDeleteView(APIView):
    """
    DELETE /api/v1/quizzes/<id>/
    Delete a quiz (only the creator can delete).
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            quiz = Quiz.objects.get(pk=pk, created_by=request.user)
        except Quiz.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Quiz not found or you do not have permission to delete it.',
            }, status=status.HTTP_404_NOT_FOUND)

        title = quiz.title
        quiz.delete()

        return Response({
            'success': True,
            'message': f"Quiz '{title}' deleted successfully.",
        }, status=status.HTTP_200_OK)


class QuizSubmitView(APIView):
    """
    POST /api/v1/quizzes/<id>/submit/
    Submit answers for a quiz and get results.

    Request body:
    {
        "answers": [
            {"question_id": "<uuid>", "selected_option": "A"},
            ...
        ],
        "time_taken_seconds": 300
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        # Get the quiz
        try:
            quiz = Quiz.objects.get(pk=pk, is_active=True)
        except Quiz.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Quiz not found.',
            }, status=status.HTTP_404_NOT_FOUND)

        # Validate submission data
        serializer = QuizSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid submission data.',
                'errors': serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)

        answers_data = serializer.validated_data['answers']
        time_taken = serializer.validated_data.get('time_taken_seconds', 0)

        # Get all questions for this quiz
        questions = {str(q.id): q for q in quiz.questions.all()}

        if not questions:
            return Response({
                'success': False,
                'message': 'This quiz has no questions.',
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create the attempt record
        attempt = QuizAttempt.objects.create(
            user=request.user,
            quiz=quiz,
            total_questions=len(questions),
            time_taken_seconds=time_taken,
            status=QuizAttempt.AttemptStatus.IN_PROGRESS,
        )

        # Score the answers
        score = 0
        answer_objects = []

        for answer_data in answers_data:
            question_id = str(answer_data['question_id'])
            selected_option = answer_data['selected_option']

            question = questions.get(question_id)
            if not question:
                continue  # Skip answers to questions not in this quiz

            is_correct = selected_option == question.correct_answer
            if is_correct:
                score += 1

            answer_objects.append(QuizAnswer(
                attempt=attempt,
                question=question,
                selected_option=selected_option,
                is_correct=is_correct,
            ))

        # Bulk create all answers
        QuizAnswer.objects.bulk_create(answer_objects, ignore_conflicts=True)

        # Finalize attempt
        attempt.score = score
        attempt.calculate_accuracy()
        attempt.calculate_points()
        attempt.status = QuizAttempt.AttemptStatus.COMPLETED
        attempt.completed_at = timezone.now()
        attempt.save()

        # Update user's total points and streak
        self._update_user_stats(request.user, attempt.points_earned)

        logger.info(
            f"Quiz submitted: user={request.user.email}, quiz='{quiz.title}', "
            f"score={score}/{len(questions)}, accuracy={attempt.accuracy}%"
        )

        return Response({
            'success': True,
            'message': 'Quiz submitted successfully!',
            'result': QuizAttemptResultSerializer(attempt).data,
        }, status=status.HTTP_200_OK)

    def _update_user_stats(self, user, points_earned: int):
        """Update user's total points and daily streak."""
        from django.utils import timezone
        from datetime import timedelta

        today = timezone.now().date()

        # Update points
        user.total_points += points_earned

        # Update streak
        if user.last_quiz_date:
            days_diff = (today - user.last_quiz_date).days
            if days_diff == 0:
                pass  # Same day, streak unchanged
            elif days_diff == 1:
                user.streak_days += 1  # Consecutive day
            else:
                user.streak_days = 1   # Streak broken, restart

        else:
            user.streak_days = 1

        user.last_quiz_date = today
        user.save(update_fields=['total_points', 'streak_days', 'last_quiz_date'])


class AttemptHistoryView(generics.ListAPIView):
    """
    GET /api/v1/quizzes/attempts/
    Get the current user's quiz attempt history.
    """
    serializer_class = QuizAttemptListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filterset_fields = ['status', 'quiz__difficulty']
    ordering_fields = ['started_at', 'accuracy', 'score']
    ordering = ['-started_at']

    def get_queryset(self):
        return QuizAttempt.objects.filter(
            user=self.request.user,
            status=QuizAttempt.AttemptStatus.COMPLETED
        ).select_related('quiz')


class AttemptDetailView(APIView):
    """
    GET /api/v1/quizzes/attempts/<id>/
    Get detailed results of a specific attempt.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            attempt = QuizAttempt.objects.get(pk=pk, user=request.user)
        except QuizAttempt.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Attempt not found.',
            }, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'success': True,
            'attempt': QuizAttemptResultSerializer(attempt).data,
        })
