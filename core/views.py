import logging

from django.conf import settings
from django.contrib import messages
from django.core.mail import EmailMultiAlternatives
from django.shortcuts import render, get_object_or_404, redirect
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils.html import strip_tags
from django.utils.http import url_has_allowed_host_and_scheme
from django.utils.translation import gettext as _
from django.views.decorators.http import require_http_methods

from .contenido import DIVISIONES, PRODUCTOS, COTIZADOR, PRIVACIDAD_EMAIL
from .forms import ContactoForm
from .models import Post, Categoria, Proyecto, Tecnologia, Contacto
from .seguridad import ip_cliente, supera_limite

logger = logging.getLogger('core.contacto')

# Límites del formulario de contacto: (nombre, máximo, ventana en segundos)
LIMITES_IP = (('ip-10min', 3, 600), ('ip-dia', 10, 86400))
LIMITE_CORREO = ('correo-dia', 2, 86400)  # confirmaciones al mismo destinatario por día


def _proyectos():
    return Proyecto.objects.filter(publicado=True)


def home(request):
    return render(request, 'core/home.html', {
        'nombre_empresa': 'Perseus Technology',
        'proyectos': _proyectos().filter(destacado_home=True),
        'tecnologias': Tecnologia.objects.filter(en_carrusel=True),
    })


def _division(request, clave):
    d = DIVISIONES[clave]
    return render(request, 'core/servicios/division.html', {
        'd': d, 'clave': clave, 'divisiones': DIVISIONES,
        'proyectos': _proyectos().filter(tipo=d['tipo_casos'])[:4],
    })


def _producto(request, clave):
    return render(request, 'core/servicios/producto.html', {'p': PRODUCTOS[clave], 'clave': clave})


def pagina_web(request):
    return _division(request, 'web')


def apps_corporativas(request):
    return _division(request, 'apps')


def pagina_consultoria(request):
    return _division(request, 'consultoria')


def fintora(request):
    return _producto(request, 'fintora')


def pagina_precios(request):
    return render(request, 'core/precios.html', {'cotizador': COTIZADOR})


def pagina_ayuda(request):
    return render(request, 'core/ayuda.html')


def pagina_blog(request):
    publicados = Post.objects.filter(publicado=True)
    post_destacado = publicados.filter(destacado=True).first()
    posts = publicados.exclude(id=post_destacado.id) if post_destacado else publicados
    return render(request, 'core/blog.html', {
        'post_destacado': post_destacado,
        'posts': posts.select_related('categoria'),
        'categorias': Categoria.objects.all(),
    })


def post_detail(request, slug):
    qs = Post.objects.select_related('categoria')
    if not request.user.is_staff:
        qs = qs.filter(publicado=True)  # el equipo puede previsualizar borradores
    post = get_object_or_404(qs, slug=slug)
    return render(request, 'core/post_detail.html', {'post': post, 'posts_recientes': Post.objects.filter(publicado=True).exclude(id=post.id)[:2]})


def proyecto_detail(request, slug):
    proyecto = get_object_or_404(_proyectos().prefetch_related('tecnologias', 'resultados', 'galeria'), slug=slug)
    siguiente = _proyectos().filter(orden__gt=proyecto.orden).first() or _proyectos().exclude(pk=proyecto.pk).first()
    return render(request, 'core/proyecto_detail.html', {'proyecto': proyecto, 'siguiente': siguiente})


def privacidad(request):
    return render(request, 'core/privacidad.html', {'privacidad_email': PRIVACIDAD_EMAIL})


def nosotros(request):
    return render(request, 'core/nosotros.html')


def _volver(request):
    """Vuelve a la página del formulario solo si es de este mismo sitio."""
    ref = request.META.get('HTTP_REFERER', '')
    if ref and url_has_allowed_host_and_scheme(ref, allowed_hosts={request.get_host()}, require_https=request.is_secure()):
        return ref
    return reverse('contacto')


def _enviar_correos(lead):
    """Aviso interno + confirmación al cliente. Devuelve True si salieron ambos."""
    remitente = settings.DEFAULT_FROM_EMAIL
    buzon = settings.EMAIL_HOST_USER
    contexto = {'nombre': lead.nombre, 'email': lead.email, 'asunto': lead.asunto, 'mensaje': lead.mensaje}

    html_admin = render_to_string('core/email_contacto.html', contexto)
    msg_admin = EmailMultiAlternatives(
        f"Nuevo Requerimiento Perseus: {lead.asunto.capitalize()} - {lead.nombre}",
        strip_tags(html_admin), remitente, [buzon], reply_to=[lead.email],
    )
    msg_admin.attach_alternative(html_admin, 'text/html')

    html_cliente = render_to_string('core/email_cliente.html', contexto)
    msg_cliente = EmailMultiAlternatives(
        'Hemos recibido tu solicitud - Perseus Technology',
        strip_tags(html_cliente), remitente, [lead.email],
    )
    msg_cliente.attach_alternative(html_cliente, 'text/html')

    try:
        msg_admin.send()
        msg_cliente.send()
        return True
    except Exception:
        logger.exception('Error enviando correos del contacto #%s', lead.pk)
        return False


@require_http_methods(['GET', 'POST'])
def contacto(request):
    if request.method != 'POST':
        return render(request, 'core/contacto.html', {'asunto_inicial': request.GET.get('asunto', '')})

    volver = _volver(request)
    form = ContactoForm(request.POST)

    estado = form.estado_bot()
    if estado == 'bot':
        # Al bot se le muestra "éxito" para que no ajuste su script; no se guarda ni se envía nada.
        logger.info('Contacto descartado (honeypot o envío demasiado rápido) ip=%s', ip_cliente(request))
        messages.success(request, _('¡Solicitud recibida! Te responderemos en menos de 24 horas.'))
        return redirect(volver)
    if estado != 'ok':
        messages.error(request, _('El formulario expiró. Recarga la página e inténtalo de nuevo.'))
        return redirect(volver)

    if not form.is_valid():
        messages.error(request, _('Revisa los datos del formulario: hay un campo inválido.'))
        return redirect(volver)

    datos = form.cleaned_data
    ip = ip_cliente(request)
    limitado = any(supera_limite(f'{n}:{ip}', maximo, ventana) for n, maximo, ventana in LIMITES_IP)
    if not limitado:
        n, maximo, ventana = LIMITE_CORREO
        limitado = supera_limite(f"{n}:{datos['email'].lower()}", maximo, ventana)
    if limitado:
        logger.warning('Contacto bloqueado por límite de envíos ip=%s', ip)
        messages.error(request, _('Recibimos varias solicitudes seguidas. Espera unos minutos o escríbenos por WhatsApp.'))
        return redirect(volver)

    # Primero se guarda: si el correo falla, el contacto queda en el admin y no se pierde.
    lead = Contacto.objects.create(
        nombre=datos['nombre'], email=datos['email'], asunto=datos['asunto'], mensaje=datos['mensaje'],
    )
    if _enviar_correos(lead):
        messages.success(request, _('¡Solicitud recibida! Te enviamos un correo de confirmación. Te responderemos en menos de 24 horas.'))
    else:
        messages.success(request, _('¡Solicitud recibida! Te responderemos en menos de 24 horas.'))
    return redirect(volver)
