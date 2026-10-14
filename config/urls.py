from django.contrib import admin
from django.urls import path, include
from django.conf.urls.i18n import i18n_patterns
from django.contrib.sitemaps.views import sitemap
from django.views.generic import TemplateView
from core.sitemaps import StaticViewSitemap, BlogSitemap, ProyectoSitemap

sitemaps = {
    'static': StaticViewSitemap,
    'blog': BlogSitemap,
    'casos': ProyectoSitemap,
}

urlpatterns = [
    path('perseus-access-x1/', admin.site.urls),
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='django.contrib.sitemaps.views.sitemap'),
    # La plantilla está en core/templates/core/robots.txt
    path('robots.txt', TemplateView.as_view(template_name='core/robots.txt', content_type='text/plain')),
    path('i18n/', include('django.conf.urls.i18n')),
]

urlpatterns += i18n_patterns(
    path('', include('core.urls')),
    prefix_default_language=False,
)
