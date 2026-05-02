from .forms import ContactoForm
from .models import Post, Categoria
from django.shortcuts import render, get_object_or_404
from django.shortcuts import render, redirect
from django.core.mail import send_mail
from django.conf import settings
from django.contrib import messages

def home(request):
    if request.method == 'POST':
        nombre = request.POST.get('nombre')
        email_cliente = request.POST.get('email')
        mensaje_cliente = request.POST.get('mensaje')
        asunto = f"🚀 Nueva solicitud de propuesta: {nombre}"
        cuerpo_mensaje = f"""
        Has recibido una nueva solicitud desde la web de Perseus Technology:
        
        Nombre del interesado: {nombre}
        Correo de contacto: {email_cliente}
        
        Mensaje o requerimiento:
        {mensaje_cliente}
        """
        
        try:
            send_mail(
                asunto,
                cuerpo_mensaje,
                settings.EMAIL_HOST_USER, 
                [settings.EMAIL_HOST_USER], 
                fail_silently=False,
            )
            
            messages.success(request, '¡Tu solicitud ha sido enviada con éxito! Te contactaremos a la brevedad.')
        except Exception as e:
            messages.error(request, 'Hubo un error al enviar el mensaje. Por favor, inténtalo de nuevo.')

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

        contenido = f"Nuevo prospecto desde Perseus Technology:\n\n" \
                    f"Nombre: {nombre}\n" \
                    f"Email: {email}\n" \
                    f"Área de interés: {asunto}\n\n" \
                    f"Mensaje:\n{mensaje}"

        try:
            send_mail(
                subject=f"Nuevo contacto Web - {nombre}",
                message=contenido,
                from_email=settings.EMAIL_HOST_USER, 
                recipient_list=['carlos.esteban.l.f@gmail.com'], 
                fail_silently=False,
            )
            messages.success(request, '¡Gracias por escribirnos! Te contactaremos pronto.')
            return redirect('contacto') 
            
        except Exception as e:
            print(f"Error al enviar correo: {e}") 
            messages.error(request, 'Hubo un error al enviar el mensaje. Por favor, intenta de nuevo.')
            return redirect('contacto')

    return render(request, 'core/contacto.html')

def gym_app(request):
    return render(request, 'core/servicios/gym.html')

def spendbox_app(request):
    return render(request, 'core/servicios/spendbox.html')