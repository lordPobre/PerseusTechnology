from django.shortcuts import render, get_object_or_404, redirect
from django.core.mail import EmailMultiAlternatives
from django.contrib import messages
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from .models import Post, Categoria
# from .forms import ContactoForm  <-- La comenté porque no la estás usando en la vista

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

        context = {
            'nombre': nombre,
            'email': email,
            'asunto': asunto,
            'mensaje': mensaje,
        }

        correo_remitente = settings.EMAIL_HOST_USER 
        remitente_con_nombre = f"Perseus Technology <{correo_remitente}>"

        html_admin = render_to_string('core/email_contacto.html', context)
        text_admin = strip_tags(html_admin)
        
        subject_admin = f"Nuevo Requerimiento Perseus: {asunto.capitalize()} - {nombre}"
        to_admin = [correo_remitente] # Te lo envías a ti mismo

        msg_admin = EmailMultiAlternatives(subject_admin, text_admin, remitente_con_nombre, to_admin)
        msg_admin.attach_alternative(html_admin, "text/html")

        html_cliente = render_to_string('core/email_cliente.html', context)
        text_cliente = strip_tags(html_cliente)
        
        subject_cliente = "Hemos recibido tu solicitud - Perseus Technology"
        to_cliente = [email] 

        msg_cliente = EmailMultiAlternatives(subject_cliente, text_cliente, remitente_con_nombre, to_cliente)
        msg_cliente.attach_alternative(html_cliente, "text/html")

        try:
            msg_admin.send()    
            msg_cliente.send()  
            messages.success(request, '¡Solicitud desplegada con éxito! Hemos enviado un correo de confirmación a tu bandeja de entrada.')
        except Exception as e:
            messages.error(request, 'Hubo un error al procesar la solicitud. Por favor, intenta de nuevo o escríbenos por WhatsApp.')
            print(f"Error enviando correo: {e}") # Útil para ver el error exacto en la terminal

        url_previa = request.META.get('HTTP_REFERER', 'contacto')
        return redirect(url_previa)

    return render(request, 'core/contacto.html')

def gym_app(request):
    return render(request, 'core/servicios/gym.html')

def spendbox_app(request):
    return render(request, 'core/servicios/spendbox.html')