from django.contrib import admin
from django.urls import path, include
from django.conf.urls.i18n import i18n_patterns

urlpatterns = [
    
    path('perseus-access-x1/', admin.site.urls),
    path('i18n/', include('django.conf.urls.i18n')),
    
]

urlpatterns += i18n_patterns(
    path('', include('core.urls')),
    prefix_default_language=False,
)
