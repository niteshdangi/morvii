from django.urls import path, include
from . import views

urlpatterns = [
    path('create/', views.CreateMopic.as_view()),
    path('home/', views.GetMopicHome.as_view()),
    path('liked/', views.MopicLiked.as_view()),
    path('trends/', views.MopicTrends.as_view()),
    path('recommendations/', views.Recommendations.as_view()),
    path('recommendations/<mid>/', views.MopicRecommendations.as_view()),
    path('likes/<mid>/', views.MopicLikes.as_view()),
    path('ratings-self/', views.SelfMopicRatings.as_view()),
    path('ratings/<mid>/', views.MopicRatings.as_view()),
    path('comment/<cid>/', views.GetCommentReplies.as_view()),
    path('comment/<pid>/<cid>/', views.DeleteCommentReply.as_view()),
    path('<mid>/comments/', views.GetMopicComments.as_view()),
    path('<mid>/comments/allowance/', views.MopicCommentAllowance.as_view()),
    path('<mid>/new/comment/', views.PostComment.as_view()),
    path('<mid>/like/', views.MopicSetLike.as_view()),
    path('<mid>/rate/', views.MopicSetRate.as_view()),
    path('<mid>/', views.GetMopic.as_view()),
]
