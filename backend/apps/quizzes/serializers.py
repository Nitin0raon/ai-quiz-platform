"""
Quizzes App - Serializers
"""

from rest_framework import serializers
from .models import Quiz, Question, QuizAttempt, QuizAnswer


class QuestionSerializer(serializers.ModelSerializer):
    """
    Full question serializer (includes correct answer).
    Used ONLY for quiz owners to see answers.
    """
    class Meta:
        model = Question
        fields = [
            'id', 'order', 'question_text',
            'option_a', 'option_b', 'option_c', 'option_d',
            'correct_answer', 'explanation',
        ]


class QuestionForAttemptSerializer(serializers.ModelSerializer):
    """
    Question serializer WITHOUT the correct answer.
    Used when a user is TAKING the quiz (so they can't see answers).
    """
    class Meta:
        model = Question
        fields = [
            'id', 'order', 'question_text',
            'option_a', 'option_b', 'option_c', 'option_d',
            # NOTE: correct_answer and explanation are NOT included here
        ]


class QuizGenerateSerializer(serializers.Serializer):
    """
    Serializer for the quiz generation request.
    Validates input before calling Gemini.
    """
    document_id = serializers.UUIDField(required=True)
    topic = serializers.CharField(
        required=True,
        max_length=200,
        help_text="The topic you want the quiz to focus on"
    )
    difficulty = serializers.ChoiceField(
        choices=['easy', 'medium', 'hard'],
        default='medium'
    )
    num_questions = serializers.IntegerField(
        default=10,
        min_value=5,
        max_value=20,
        help_text="Number of questions (5-20)"
    )
    title = serializers.CharField(
        required=False,
        max_length=255,
        allow_blank=True,
    )
    time_limit_minutes = serializers.IntegerField(
        default=0,
        min_value=0,
        max_value=180,
        help_text="Time limit in minutes. 0 = no limit."
    )


class QuizListSerializer(serializers.ModelSerializer):
    """Compact serializer for listing quizzes."""
    question_count = serializers.SerializerMethodField()
    attempt_count = serializers.SerializerMethodField()
    document_title = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            'id', 'title', 'topic', 'difficulty',
            'total_questions', 'question_count',
            'time_limit_minutes', 'attempt_count',
            'document_title', 'created_at',
        ]

    def get_question_count(self, obj):
        return obj.questions.count()

    def get_attempt_count(self, obj):
        return obj.attempts.count()

    def get_document_title(self, obj):
        return obj.document.title if obj.document else None


class QuizDetailSerializer(serializers.ModelSerializer):
    """Full quiz serializer WITH questions but WITHOUT answers (for taking the quiz)."""
    questions = QuestionForAttemptSerializer(many=True, read_only=True)
    document_title = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            'id', 'title', 'topic', 'difficulty',
            'total_questions', 'time_limit_minutes',
            'document_title', 'created_at', 'questions',
        ]

    def get_document_title(self, obj):
        return obj.document.title if obj.document else None


class QuizWithAnswersSerializer(serializers.ModelSerializer):
    """Full quiz WITH correct answers - for quiz owners only."""
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = [
            'id', 'title', 'topic', 'difficulty',
            'total_questions', 'time_limit_minutes',
            'created_at', 'questions',
        ]


class QuizAnswerSubmitSerializer(serializers.Serializer):
    """
    Serializer for submitting answers to a quiz.

    Expected format:
    {
        "answers": [
            {"question_id": "<uuid>", "selected_option": "A"},
            {"question_id": "<uuid>", "selected_option": "C"},
            ...
        ]
    }
    """
    question_id = serializers.UUIDField()
    selected_option = serializers.ChoiceField(choices=['A', 'B', 'C', 'D'])


class QuizSubmitSerializer(serializers.Serializer):
    """The outer wrapper for quiz submission."""
    answers = QuizAnswerSubmitSerializer(many=True)
    time_taken_seconds = serializers.IntegerField(
        default=0,
        min_value=0,
        help_text="How long the quiz took in seconds"
    )

    def validate_answers(self, value):
        if not value:
            raise serializers.ValidationError("At least one answer is required.")
        return value


class QuizAnswerResultSerializer(serializers.ModelSerializer):
    """Shows each answer with whether it was correct and what the right answer was."""
    question_text = serializers.CharField(source='question.question_text')
    correct_answer = serializers.CharField(source='question.correct_answer')
    explanation = serializers.CharField(source='question.explanation')
    option_a = serializers.CharField(source='question.option_a')
    option_b = serializers.CharField(source='question.option_b')
    option_c = serializers.CharField(source='question.option_c')
    option_d = serializers.CharField(source='question.option_d')

    class Meta:
        model = QuizAnswer
        fields = [
            'question_text', 'selected_option', 'correct_answer',
            'is_correct', 'explanation',
            'option_a', 'option_b', 'option_c', 'option_d',
        ]


class QuizAttemptResultSerializer(serializers.ModelSerializer):
    """Full result of a quiz attempt."""
    answers = QuizAnswerResultSerializer(many=True, read_only=True)
    quiz_title = serializers.CharField(source='quiz.title')
    quiz_difficulty = serializers.CharField(source='quiz.difficulty')

    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz_title', 'quiz_difficulty',
            'status', 'score', 'total_questions', 'accuracy',
            'points_earned', 'time_taken_seconds',
            'started_at', 'completed_at', 'answers',
        ]


class QuizAttemptListSerializer(serializers.ModelSerializer):
    """Compact attempt serializer for history lists."""
    quiz_title = serializers.CharField(source='quiz.title')
    quiz_difficulty = serializers.CharField(source='quiz.difficulty')

    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz_title', 'quiz_difficulty',
            'status', 'score', 'total_questions',
            'accuracy', 'points_earned',
            'time_taken_seconds', 'started_at', 'completed_at',
        ]
