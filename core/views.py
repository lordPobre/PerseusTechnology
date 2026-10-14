from django.shortcuts import render, get_object_or_404, redirect
from django.core.mail import EmailMultiAlternatives
from django.contrib import messages
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.utils.translation import gettext as _
from .models import Post, Categoria, Proyecto, Tecnologia
from .contenido import DIVISIONES, PRODUCTOS, COTIZADOR, PRIVACIDAD_EMAIL


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


def contacto(request):
    if request.method == 'POST':
        nombre = request.POST.get('nombre', '')
        email = request.POST.get('email', '')
        asunto = request.POST.get('asunto') or 'Consulta general'
        mensaje = request.POST.get('mensaje', '')
        context = {'nombre': nombre, 'email': email, 'asunto': asunto, 'mensaje': mensaje}

        correo_remitente = settings.EMAIL_HOST_USER
        remitente_con_nombre = f"Perseus Technology <{correo_remitente}>"

        html_admin = render_to_string('core/email_contacto.html', context)
        msg_admin = EmailMultiAlternatives(f"Nuevo Requerimiento Perseus: {asunto.capitalize()} - {nombre}", strip_tags(html_admin), remitente_con_nombre, [correo_remitente])
        msg_admin.attach_alternative(html_admin, "text/html")

        html_cliente = render_to_string('core/email_cliente.html', context)
        msg_cliente = EmailMultiAlternatives("Hemos recibido tu solicitud - Perseus Technology", strip_tags(html_cliente), remitente_con_nombre, [email])
        msg_cliente.attach_alternative(html_cliente, "text/html")

        try:
            msg_admin.send()
            msg_cliente.send()
            messages.success(request, _('¡Solicitud recibida! Te enviamos un correo de confirmación. Te responderemos en menos de 24 horas.'))
        except Exception as e:
            messages.error(request, _('Hubo un error al procesar la solicitud. Por favor, intenta de nuevo o escríbenos por WhatsApp.'))
            print(f"Error enviando correo: {e}")

        return redirect(request.META.get('HTTP_REFERER', 'contacto'))

    return render(request, 'core/contacto.html', {'asunto_inicial': request.GET.get('asunto', '')})
