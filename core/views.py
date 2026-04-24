from django.shortcuts import render
from .forms import ContactoForm
from django.shortcuts import render, redirect
from django.core.mail import send_mail
from django.conf import settings
from django.contrib import messages

def home(request):
    if request.method == 'POST':
        # Capturamos los datos del formulario (coincidiendo con los names en tu HTML)
        nombre = request.POST.get('nombre')
        email_cliente = request.POST.get('email')
        mensaje_cliente = request.POST.get('mensaje')

        # Estructuramos el correo que recibirás tú
        asunto = f"🚀 Nueva solicitud de propuesta: {nombre}"
        cuerpo_mensaje = f"""
        Has recibido una nueva solicitud desde la web de Perseus Technology:
        
        Nombre del interesado: {nombre}
        Correo de contacto: {email_cliente}
        
        Mensaje o requerimiento:
        {mensaje_cliente}
        """
        
        try:
            # Enviamos el correo
            send_mail(
                asunto,
                cuerpo_mensaje,
                settings.EMAIL_HOST_USER, # Remitente (tu correo de configuración)
                [settings.EMAIL_HOST_USER], # Destinatario (donde quieres recibirlo)
                fail_silently=False,
            )
            # Agregamos un mensaje de éxito para mostrar en el frontend
            messages.success(request, '¡Tu solicitud ha sido enviada con éxito! Te contactaremos a la brevedad.')
        except Exception as e:
            messages.error(request, 'Hubo un error al enviar el mensaje. Por favor, inténtalo de nuevo.')

    return render(request, 'core/home.html', {'nombre_empresa': 'Perseus Technology'})

def pagina_web(request):
    return render(request, 'core/servicios/web.html')

def pagina_marcacion(request):
    return render(request, 'core/servicios/marcacion.html')

def pagina_consultoria(request):
    return render(request, 'core/servicios/consultoria.html')

def pagina_precios(request):
    return render(request, 'core/precios.html')

def pagina_ayuda(request):
    return render(request, 'core/ayuda.html')

def pagina_blog(request):
    return render(request, 'core/blog.html')

def privacidad(request):
    return render(request, 'core/privacidad.html')

def nosotros(request):
    return render(request, 'core/nosotros.html')

def contacto(request):
    if request.method == 'POST':
        nombre = request.POST.get('nombre')
        email = request.POST.get('email')
        asunto = request.POST.get('asunto') # Capturamos el selector del nuevo diseño
        mensaje = request.POST.get('mensaje')

        # Formateamos el mensaje que leerás en tu bandeja de entrada
        contenido = f"Nuevo prospecto desde Perseus Technology:\n\n" \
                    f"Nombre: {nombre}\n" \
                    f"Email: {email}\n" \
                    f"Área de interés: {asunto}\n\n" \
                    f"Mensaje:\n{mensaje}"

        try:
            # Enviar el correo usando las credenciales del .env
            send_mail(
                subject=f"Nuevo contacto Web - {nombre}",
                message=contenido,
                from_email=settings.EMAIL_HOST_USER, # Usa tu correo configurado en settings
                recipient_list=['contacto@vcchile.cl'], # Tu bandeja de entrada real
                fail_silently=False,
            )
            # Mensaje de éxito para el usuario
            messages.success(request, '¡Gracias por escribirnos! Te contactaremos pronto.')
            return redirect('contacto') # Mejor redirigir a contacto de nuevo para que vea el mensaje
            
        except Exception as e:
            # Imprimimos el error en consola para que Vercel lo registre si algo falla
            print(f"Error al enviar correo: {e}") 
            messages.error(request, 'Hubo un error al enviar el mensaje. Por favor, intenta de nuevo.')
            return redirect('contacto')

    # Si es una petición GET (el usuario hace clic en el enlace del menú)
    return render(request, 'core/contacto.html')