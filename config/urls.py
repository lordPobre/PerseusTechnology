from django.contrib import admin
from django.urls import path, include
from django.conf.urls.i18n import i18n_patterns
from django.contrib.sitemaps.views import sitemap
from django.http import HttpResponse
from django.views.decorators.cache import cache_control
from core.sitemaps import StaticViewSitemap, BlogSitemap, ProyectoSitemap

sitemaps = {
    'static': StaticViewSitemap,
    'blog': BlogSitemap,
    'casos': ProyectoSitemap,
}

ROBOTS = """User-agent: *
Disallow: /i18n/

Sitemap: https://www.perseustechnology.dev/sitemap.xml
"""


@cache_control(max_age=86400, public=True)
def robots_txt(request):
    # Sin plantilla: no depende de que exista un archivo en templates/
    return HttpResponse(ROBOTS, content_type='text/plain; charset=utf-8')


urlpatterns = [
    path('perseus-access-x1/', admin.site.urls),
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='django.contrib.sitemaps.views.sitemap'),
    path('robots.txt', robots_txt),
    path('i18n/', include('django.conf.urls.i18n')),
]

urlpatterns += i18n_patterns(
    path('', include('core.urls')),
    prefix_default_language=False,
)
