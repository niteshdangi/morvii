from django.urls import path, include
from . import views

urlpatterns = [
    path('create/', views.CreateStory.as_view()),
    path('home/', views.GetStory.as_view()),
    path('<user>/', views.GetStoryUser.as_view()),
    path('view/<story>/', views.StoryViews.as_view()),
]
