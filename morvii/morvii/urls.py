from django.contrib import admin
from django.urls import path, include
urlpatterns = [
    path('accounts/', include('accounts.urls')),
    path('mopic/', include('mopic.urls')),
    path('messenger/', include('messenger.urls')),
    path('story/', include('story.urls')),
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls'))
]
