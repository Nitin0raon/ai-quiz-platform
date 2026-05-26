"""
Quizzes App - Models
=====================
Models:
- Quiz: A generated quiz (contains multiple questions)
- Question: A single MCQ with 4 options
- QuizAttempt: A user's attempt at a quiz
- QuizAnswer: A user's answer to a specific question
"""

import uuid
from django.db import models
from django.conf import settings
from apps.documents.models import UploadedDocument


class Quiz(models.Model):
    """
    Represents an AI-generated quiz based on a document.
    """

    class Difficulty(models.TextChoices):
        EASY = 'easy', 'Easy'
        MEDIUM = 'medium', 'Medium'
        HARD = 'hard', 'Hard'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    title = models.CharField(max_length=255, help_text="Quiz title")

    topic = models.CharField(
        max_length=255,
        help_text="The topic/subject of the quiz (used for RAG retrieval)"
    )

    difficulty = models.CharField(
        max_length=10,
        choices=Difficulty.choices,
        default=Difficulty.MEDIUM,
        db_index=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='quizzes',
    )

    # The source document this quiz was generated from
    document = models.ForeignKey(
        UploadedDocument,
        on_delete=models.SET_NULL,  # Keep quiz even if document is deleted
        null=True,
        blank=True,
        related_name='quizzes',
    )

    total_questions = models.PositiveIntegerField(default=0)

    # Store the AI prompt used for generation (useful for debugging)
    generation_prompt = models.TextField(blank=True, null=True)

    # Time limit for the quiz in minutes (0 = no limit)
    time_limit_minutes = models.PositiveIntegerField(
        default=0,
        help_text="Time limit in minutes. 0 means no limit."
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'quizzes'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_by', 'difficulty']),
            models.Index(fields=['created_at']),
        ]
        verbose_name_plural = 'Quizzes'

    def __str__(self):
        return f"{self.title} ({self.difficulty})"


class Question(models.Model):
    """
    A single Multiple Choice Question (MCQ) in a quiz.
    """

    class CorrectAnswer(models.TextChoices):
        A = 'A', 'Option A'
        B = 'B', 'Option B'
        C = 'C', 'Option C'
        D = 'D', 'Option D'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='questions',
    )

    question_text = models.TextField(help_text="The question being asked")

    option_a = models.TextField(help_text="Option A")
    option_b = models.TextField(help_text="Option B")
    option_c = models.TextField(help_text="Option C")
    option_d = models.TextField(help_text="Option D")

    correct_answer = models.CharField(
        max_length=1,
        choices=CorrectAnswer.choices,
        help_text="The letter of the correct option (A, B, C, or D)"
    )

    explanation = models.TextField(
        blank=True,
        null=True,
        help_text="Explanation of why this answer is correct"
    )

    # Track question order within the quiz
    order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'questions'
        ordering = ['quiz', 'order']

    def __str__(self):
        return f"Q{self.order}: {self.question_text[:60]}..."

    def get_correct_option_text(self):
        """Return the text of the correct answer option."""
        option_map = {
            'A': self.option_a,
            'B': self.option_b,
            'C': self.option_c,
            'D': self.option_d,
        }
        return option_map.get(self.correct_answer, '')


class QuizAttempt(models.Model):
    """
    Records a user's attempt at a quiz.
    One user can attempt the same quiz multiple times.
    """

    class AttemptStatus(models.TextChoices):
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
        TIMED_OUT = 'timed_out', 'Timed Out'
        ABANDONED = 'abandoned', 'Abandoned'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='attempts',
    )

    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='attempts',
    )

    status = models.CharField(
        max_length=20,
        choices=AttemptStatus.choices,
        default=AttemptStatus.IN_PROGRESS,
        db_index=True,
    )

    score = models.PositiveIntegerField(
        default=0,
        help_text="Number of correct answers"
    )

    total_questions = models.PositiveIntegerField(default=0)

    # accuracy = score / total_questions * 100
    accuracy = models.FloatField(
        default=0.0,
        help_text="Accuracy percentage (0-100)"
    )

    # Points earned in this attempt (for leaderboard)
    points_earned = models.PositiveIntegerField(default=0)

    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # How long the attempt took in seconds
    time_taken_seconds = models.PositiveIntegerField(
        default=0,
        help_text="Time taken to complete the quiz in seconds"
    )

    class Meta:
        db_table = 'quiz_attempts'
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['user', 'quiz']),
            models.Index(fields=['user', 'status']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.quiz.title} ({self.status})"

    def calculate_accuracy(self):
        """Calculate and save accuracy."""
        if self.total_questions > 0:
            self.accuracy = round((self.score / self.total_questions) * 100, 2)
        else:
            self.accuracy = 0.0
        return self.accuracy

    def calculate_points(self):
        """
        Calculate points earned based on score, difficulty, and time.
        Easy: 5 pts/correct, Medium: 10 pts/correct, Hard: 15 pts/correct
        """
        difficulty_multiplier = {
            'easy': 5,
            'medium': 10,
            'hard': 15,
        }
        multiplier = difficulty_multiplier.get(self.quiz.difficulty, 10)
        self.points_earned = self.score * multiplier
        return self.points_earned


class QuizAnswer(models.Model):
    """
    Records the user's answer to each question in an attempt.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    attempt = models.ForeignKey(
        QuizAttempt,
        on_delete=models.CASCADE,
        related_name='answers',
    )

    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='user_answers',
    )

    # The option the user selected (A, B, C, or D)
    selected_option = models.CharField(
        max_length=1,
        choices=Question.CorrectAnswer.choices,
    )

    is_correct = models.BooleanField(default=False)

    # When this question was answered
    answered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'quiz_answers'
        # A user can only answer each question once per attempt
        unique_together = [['attempt', 'question']]

    def __str__(self):
        status = "✓" if self.is_correct else "✗"
        return f"{status} {self.attempt.user.email} answered Q{self.question.order}"
