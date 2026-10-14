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


@register.simple_tag(takes_context=True)
def ruta_idioma(context, idioma):
    """URL de la página actual en otro idioma. Se calcula al renderizar, cuando Django
    todavía sabe en qué idioma está la página (en /i18n/setlang/ ya no lo sabe)."""
    from django.urls import translate_url
    request = context.get('request')
    if request is None:
        return '/'
    return translate_url(request.get_full_path(), idioma)


_TW_THEME = """{theme:{extend:{colors:{ink:'#0a0a0a',bone:'#f5f5f0',paper:'#e9e9e2',acid:{DEFAULT:'#c6ff3d',soft:'#d8ff74',deep:'#4d6b00'},mute:'#8a8a84',body:'#b4b4ad',faint:'#6f6f69'},fontFamily:{sans:['Geist','system-ui','sans-serif'],mono:['"Geist Mono"','monospace']},maxWidth:{site:'1440px'}}}}"""
_TW_CACHE = {}


@register.simple_tag
def tailwind():
    """Usa core/css/tailwind.css si ya fue compilado; si no, carga Tailwind desde el CDN (solo para desarrollo)."""
    from django.conf import settings
    from django.contrib.staticfiles import finders
    from django.contrib.staticfiles.storage import staticfiles_storage
    from django.utils.safestring import mark_safe
    ruta = 'core/css/tailwind.css'
    if 'ok' not in _TW_CACHE or settings.DEBUG:
        try:
            _TW_CACHE['ok'] = bool(finders.find(ruta)) or staticfiles_storage.exists(ruta)
        except Exception:
            _TW_CACHE['ok'] = False
    if _TW_CACHE['ok']:
        return mark_safe('<link rel="stylesheet" href="%s">' % static(ruta))
    return mark_safe('<script src="https://cdn.tailwindcss.com"></script><script>tailwind.config=%s</script>' % _TW_THEME)
