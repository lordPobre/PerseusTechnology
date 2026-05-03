from .forms import ContactoForm
from .models import Post, Categoria
from django.shortcuts import render, get_object_or_404
from django.shortcuts import render, redirect
from django.core.mail import send_mail,EmailMultiAlternatives
from django.shortcuts import render, redirect
from django.contrib import messages
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

def home(request):
    return render(request, 'core/home.html', {'nombre_empresa': 'Perseus Technology'})

def pagina_web(request):
    return render(request, 'core/servicios/web.html')

def apps_corporativas(request):
    return render(request, 'core/servicios/apps.html')

def pagina_marcacion(request):
    return render(request, 'core/servicios/marcacion.html')

def pagina_consultoria(request):
    return render(request, 'core/servicios/consultoria.html')

def pagina_precios(request):
    return render(request, 'core/precios.html')

def pagina_ayuda(request):
    return render(request, 'core/ayuda.html')

def pagina_blog(request):

    post_destacado = Post.objects.filter(destacado=True).first()
    if post_destacado:
        posts = Post.objects.exclude(id=post_destacado.id)
    else:
        posts = Post.objects.all()

    categorias = Categoria.objects.all()

    context = {
        'post_destacado': post_destacado,
        'posts': posts,
        'categorias': categorias,
    }
    return render(request, 'core/blog.html', context)

def post_detail(request, slug):
    post = get_object_or_404(Post, slug=slug)
    posts_recientes = Post.objects.exclude(id=post.id)[:2]
    
    context = {
        'post': post,
        'posts_recientes': posts_recientes
    }
    return render(request, 'core/post_detail.html', context)

def privacidad(request):
    return render(request, 'core/privacidad.html')

def nosotros(request):
    return render(request, 'core/nosotros.html')

def contacto(request):
    if request.method == 'POST':
        nombre = request.POST.get('nombre')
        email = request.POST.get('email')
        asunto = request.POST.get('asunto')
        mensaje = request.POST.get('mensaje')

        # 1. Preparar el contexto (los datos que van a los HTML)
        context = {
            'nombre': nombre,
            'email': email,
            'asunto': asunto,
            'mensaje': mensaje,
        }

        # ==============================================================
        # CORREO 1: NOTIFICACIÓN PARA TI (Administrador)
        # ==============================================================
        html_admin = render_to_string('core/email_contacto.html', context)
        text_admin = strip_tags(html_admin)
        
        subject_admin = f"Nuevo Requerimiento Perseus: {asunto.capitalize()} - {nombre}"
        from_email_admin = 'contacto@perseus.com' # Correo del servidor
        to_admin = ['carlos.esteban.l.f@gmail.com'] # TU correo

        msg_admin = EmailMultiAlternatives(subject_admin, text_admin, from_email_admin, to_admin)
        msg_admin.attach_alternative(html_admin, "text/html")

        # ==============================================================
        # CORREO 2: AUTO-RESPONDER PARA EL CLIENTE
        # ==============================================================
        html_cliente = render_to_string('core/email_cliente.html', context)
        text_cliente = strip_tags(html_cliente)
        
        subject_cliente = "Hemos recibido tu solicitud - Perseus Technology"
        from_email_cliente = 'carlos.esteban.l.f@gmail.com' # El correo corporativo que verá el cliente (ej. contacto@vcchile.cl o el que uses)
        to_cliente = [email] # El correo que el cliente puso en el formulario

        msg_cliente = EmailMultiAlternatives(subject_cliente, text_cliente, from_email_cliente, to_cliente)
        msg_cliente.attach_alternative(html_cliente, "text/html")

        # ==============================================================
        # ENVIAR AMBOS CORREOS
        # ==============================================================
        try:
            msg_admin.send()    # Te avisa a ti
            msg_cliente.send()  # Le avisa al cliente
            messages.success(request, '¡Solicitud desplegada con éxito! Hemos enviado un correo de confirmación a tu bandeja de entrada.')
        except Exception as e:
            messages.error(request, 'Hubo un error al procesar la solicitud. Por favor, intenta de nuevo o escríbenos por WhatsApp.')

        url_previa = request.META.get('HTTP_REFERER', 'contacto')
        return redirect(url_previa)

    return render(request, 'core/contacto.html')

def gym_app(request):
    return render(request, 'core/servicios/gym.html')

def spendbox_app(request):
    return render(request, 'core/servicios/spendbox.html')