from django.contrib import admin
from .models import Quiz, Question, QuizAttempt, QuizAnswer


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0
    readonly_fields = ['id']


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ['title', 'topic', 'difficulty', 'total_questions', 'created_by', 'created_at']
    list_filter = ['difficulty', 'is_active', 'created_at']
    search_fields = ['title', 'topic', 'created_by__email']
    inlines = [QuestionInline]
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(QuizAttempt)
class AttemptAdmin(admin.ModelAdmin):
    list_display = ['user', 'quiz', 'status', 'score', 'accuracy', 'points_earned', 'started_at']
    list_filter = ['status', 'quiz__difficulty']
    search_fields = ['user__email', 'quiz__title']
    readonly_fields = ['id', 'started_at']
