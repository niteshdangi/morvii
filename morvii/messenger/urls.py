from django.urls import path, include
from . import views

urlpatterns = [
    path('home/', views.MessagesHome.as_view()),
    path('messages/<user>/', views.MessageHistory.as_view()),
    path('send/', views.SendMessage.as_view()),
    path('receive/', views.ReceiveMessage.as_view()),
    path('search/<query>/', views.Search.as_view()),
    path('theme/', views.Theme.as_view()),
    path('call/<user>/', views.Call.as_view()),
]
