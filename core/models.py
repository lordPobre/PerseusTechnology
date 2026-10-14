from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from django.utils import timezone
from django.urls import reverse
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
    contenido = models.TextField()
    imagen_portada = CloudinaryField('imagen', null=True, blank=True)
    color_tema = models.CharField(max_length=50, default='emerald', help_text="Ya no se usa en el diseño nuevo.")
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE)
    autor = models.CharField(max_length=100, default='Equipo Perseus')
    tiempo_lectura = models.IntegerField(default=5, help_text="Minutos de lectura")
    destacado = models.BooleanField(default=False)
    fecha_publicacion = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-fecha_publicacion']

    def __str__(self):
        return self.titulo

    def get_absolute_url(self):
        return reverse('post_detail', kwargs={'slug': self.slug})


class Contacto(models.Model):
    nombre = models.CharField(max_length=100)
    email = models.EmailField()
    mensaje = models.TextField()
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Mensaje de {self.nombre}"


class ImagenSitio(models.Model):
    """Imágenes fijas del sitio (proceso, productos, fundador, og:image) administradas en Cloudinary."""
    CLAVES = [
        ('proceso-1', 'Proceso · 01 Diagnóstico'),
        ('proceso-2', 'Proceso · 02 Diseño'),
        ('proceso-3', 'Proceso · 03 Desarrollo'),
        ('proceso-4', 'Proceso · 04 Soporte'),
        ('producto-fintora', 'Producto · Fintora'),
        ('fundador', 'Nosotros · Foto del fundador'),
        ('og', 'Imagen para compartir en redes (1200×630)'),
    ]
    clave = models.CharField(max_length=40, choices=CLAVES, unique=True)
    imagen = CloudinaryField('imagen')
    alt = models.CharField('texto alternativo', max_length=160, blank=True)

    class Meta:
        verbose_name = 'imagen del sitio'
        verbose_name_plural = 'imágenes del sitio'

    def __str__(self):
        return self.get_clave_display()


@receiver([post_save, post_delete], sender=ImagenSitio)
def _limpiar_cache_imagenes(**kwargs):
    cache.delete('perseus_imagenes_sitio')


class Tecnologia(models.Model):
    """Logos del carrusel del home y stack de cada proyecto."""
    nombre = models.CharField(max_length=60)
    logo = CloudinaryField('logo', help_text="SVG o PNG con fondo transparente")
    orden = models.PositiveIntegerField(default=0)
    en_carrusel = models.BooleanField(default=True, help_text="Mostrar en el carrusel del home")

    class Meta:
        ordering = ['orden', 'nombre']
        verbose_name = 'tecnología'
        verbose_name_plural = 'tecnologías'

    def __str__(self):
        return self.nombre


class Proyecto(models.Model):
    TIPO = [
        ('web', 'Desarrollo Web'),
        ('apps', 'Apps Corporativas'),
        ('consultoria', 'Consultoría e Infraestructura TI'),
    ]
    nombre = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)
    cliente = models.CharField(max_length=120, blank=True)
    tipo = models.CharField(max_length=20, choices=TIPO, default='web')
    anio = models.PositiveIntegerField('año', null=True, blank=True)
    descripcion_corta = models.CharField(max_length=160, help_text="Línea que se ve en el listado del home")
    etiquetas = models.CharField(max_length=120, blank=True, help_text="Separadas por coma. Ej: E-commerce, Django")
    imagen = CloudinaryField('imagen', help_text="Captura principal (16:10). Se usa en el hover del home y en el detalle")
    desafio = models.TextField('desafío', blank=True)
    solucion = models.TextField('solución', blank=True)
    tecnologias = models.ManyToManyField(Tecnologia, blank=True, related_name='proyectos')
    url_externa = models.URLField('sitio en vivo', blank=True)
    nueva_pestana = models.BooleanField('abrir en pestaña nueva', default=True)
    publicado = models.BooleanField(default=True)
    destacado_home = models.BooleanField('mostrar en home', default=True)
    orden = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['orden', '-anio']

    def __str__(self):
        return self.nombre

    def get_absolute_url(self):
        return reverse('proyecto_detail', kwargs={'slug': self.slug})

    @property
    def lista_etiquetas(self):
        return [e.strip() for e in self.etiquetas.split(',') if e.strip()]


class ProyectoResultado(models.Model):
    """Cifras del detalle del caso. Ej: valor='-40%', etiqueta='tiempo de carga'."""
    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='resultados')
    valor = models.CharField(max_length=20)
    etiqueta = models.CharField(max_length=80)
    orden = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['orden']


class ProyectoImagen(models.Model):
    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='galeria')
    imagen = CloudinaryField('imagen')
    leyenda = models.CharField(max_length=120, blank=True)
    orden = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['orden']
