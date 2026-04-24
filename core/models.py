from django.db import models
from django.utils import timezone
from cloudinary.models import CloudinaryField

class Categoria(models.Model):
    nombre = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.nombre
    
class Post(models.Model):
    titulo = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    resumen = models.TextField(max_length=300)
    contenido = models.TextField() # Aquí escribirás el artículo
    imagen_portada = CloudinaryField('imagen', null=True, blank=True)
    color_tema = models.CharField(max_length=50, default='emerald', help_text="emerald, cyan, blue, purple, etc.")
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE)
    autor = models.CharField(max_length=100, default='Equipo Perseus')
    tiempo_lectura = models.IntegerField(default=5, help_text="Minutos de lectura")
    destacado = models.BooleanField(default=False)
    fecha_publicacion = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-fecha_publicacion']

    def __str__(self):
        return self.titulo
    
class Contacto(models.Model):
    nombre = models.CharField(max_length=100)
    email = models.EmailField()
    mensaje = models.TextField()
    fecha = models.DateTimeField(auto_now_add=True) 

    def __str__(self):
        return f"Mensaje de {self.nombre}"