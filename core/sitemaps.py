from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from .models import Post  

class StaticViewSitemap(Sitemap):
    changefreq = "weekly"  
    priority = 0.8         

    def items(self):
        return [
            'home', 'contacto', 'nosotros', 'privacidad', 'precios', 'ayuda',
            'web', 'apps', 'marcacion', 'consultoria',
            'gym_app', 'spendbox_app'
        ]

    def location(self, item):
        return reverse(item)


class BlogSitemap(Sitemap):
    protocol = 'https'
    changefreq = "daily"
    priority = 1.0

    def items(self):
        return Post.objects.all()