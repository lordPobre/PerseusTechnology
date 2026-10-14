from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from .models import Post, Proyecto


class StaticViewSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.8

    def items(self):
        return [
            'home', 'contacto', 'nosotros', 'privacidad', 'precios', 'ayuda',
            'web', 'apps', 'fintora', 'consultoria', 'blog',
        ]

    def location(self, item):
        return reverse(item)


class BlogSitemap(Sitemap):
    protocol = 'https'
    changefreq = "daily"
    priority = 1.0

    def items(self):
        return Post.objects.all()


class ProyectoSitemap(Sitemap):
    protocol = 'https'
    changefreq = "monthly"
    priority = 0.7

    def items(self):
        return Proyecto.objects.filter(publicado=True)
