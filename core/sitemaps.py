from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from .models import Post, Proyecto

DOMINIO = 'www.perseustechnology.dev'


class BaseSitemap(Sitemap):
    """Dominio y https fijos (no dependen de Sites ni del proxy) y versión en inglés con hreflang."""
    protocol = 'https'
    i18n = True
    alternates = True
    x_default = True

    def get_domain(self, site=None):
        return DOMINIO


class StaticViewSitemap(BaseSitemap):
    changefreq = 'weekly'
    priority = 0.8

    def items(self):
        return [
            'home', 'web', 'apps', 'fintora', 'consultoria', 'precios',
            'nosotros', 'contacto', 'blog', 'ayuda', 'privacidad',
        ]

    def location(self, item):
        return reverse(item)


class BlogSitemap(BaseSitemap):
    changefreq = 'weekly'
    priority = 0.7

    def items(self):
        return Post.objects.filter(publicado=True).order_by('-fecha_publicacion')

    def lastmod(self, obj):
        return obj.fecha_publicacion


class ProyectoSitemap(BaseSitemap):
    changefreq = 'monthly'
    priority = 0.7

    def items(self):
        return Proyecto.objects.filter(publicado=True).order_by('orden')
