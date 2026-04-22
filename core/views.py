from django.shortcuts import render
from .forms import ContactoForm

def home(request):
    formulario = ContactoForm()
    if request.method == 'POST':
        formulario = ContactoForm(request.POST)
        if formulario.is_valid():
            formulario.save()
            formulario = ContactoForm() 
    context = {
        'form': formulario,
        'nombre_empresa': 'Perseus Technology',
    }
    return render(request, 'core/home.html', context)

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