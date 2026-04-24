from django.contrib import admin
from django.urls import path, include 

urlpatterns = [
    path('perseus-access-x1/', admin.site.urls),
    path('', include('core.urls')), 
]