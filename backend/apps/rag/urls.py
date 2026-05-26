from django.urls import path
from . import views

app_name = 'rag'

urlpatterns = [
    path('search/', views.SemanticSearchView.as_view(), name='search'),
]
