from django.urls import path
from . import views

app_name = 'quizzes'

urlpatterns = [
    # Quiz management
    path('', views.QuizListView.as_view(), name='list'),
    path('generate/', views.QuizGenerateView.as_view(), name='generate'),
    path('<uuid:pk>/', views.QuizDetailView.as_view(), name='detail'),
    path('<uuid:pk>/delete/', views.QuizDeleteView.as_view(), name='delete'),
    path('<uuid:pk>/submit/', views.QuizSubmitView.as_view(), name='submit'),

    # Attempt history
    path('attempts/', views.AttemptHistoryView.as_view(), name='attempts'),
    path('attempts/<uuid:pk>/', views.AttemptDetailView.as_view(), name='attempt-detail'),
]
