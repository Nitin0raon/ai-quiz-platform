from django.urls import path
from . import views

app_name = 'analytics'

urlpatterns = [
    path('dashboard/', views.UserDashboardView.as_view(), name='dashboard'),
    path('leaderboard/', views.LeaderboardView.as_view(), name='leaderboard'),
    path('accuracy/', views.AccuracyAnalyticsView.as_view(), name='accuracy'),
]
