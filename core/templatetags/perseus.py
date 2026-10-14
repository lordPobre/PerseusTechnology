"""Imágenes desde Cloudinary con optimización automática.

Uso en plantillas:
    {% load perseus %}
    <img src="{{ proyecto.imagen|cdn:1200 }}">                 → formato y calidad automáticos, máx. 1200 px
    <img src="{% imagen_sitio 'proceso-1' 1400 'core/img/dashboard-finapp.png' %}">
"""
from django import template
from django.core.cache import cache
from django.templatetags.static import static

register = template.Library()
CACHE_KEY = 'perseus_imagenes_sitio'


def _url(img, width):
    if not img:
        return ''
    try:
        return img.build_url(width=int(width), crop='limit', fetch_format='auto', quality='auto', secure=True)
    except AttributeError:
        return getattr(img, 'url', str(img))


@register.filter
def cdn(img, width=1600):
    return _url(img, width)


@register.simple_tag
def imagen_sitio(clave, width=1600, fallback=''):
    from core.models import ImagenSitio
    mapa = cache.get(CACHE_KEY)
    if mapa is None:
        mapa = {i.clave: i.imagen for i in ImagenSitio.objects.all()}
        cache.set(CACHE_KEY, mapa, 600)
    img = mapa.get(clave)
    if img:
        return _url(img, width)
    return static(fallback) if fallback else ''
