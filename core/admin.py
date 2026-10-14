from django.contrib import admin
from django.utils.html import format_html
from .models import Categoria, Post, Contacto, ImagenSitio, Tecnologia, Proyecto, ProyectoResultado, ProyectoImagen


def _thumb(img, h=40):
    return format_html('<img src="{}" style="height:{}px;border-radius:6px">', img.build_url(height=h * 2, crop='limit', fetch_format='auto', quality='auto', secure=True), h) if img else '—'


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('nombre',)}


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('miniatura', 'titulo', 'categoria', 'fecha_publicacion', 'publicado', 'destacado')
    list_display_links = ('titulo',)
    list_editable = ('publicado', 'destacado')
    search_fields = ('titulo', 'resumen')
    prepopulated_fields = {'slug': ('titulo',)}
    list_filter = ('publicado', 'categoria', 'destacado')
    exclude = ('color_tema',)

    @admin.display(description='')
    def miniatura(self, obj):
        return _thumb(obj.imagen_portada)


@admin.register(Contacto)
class ContactoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'email', 'fecha')
    readonly_fields = ('nombre', 'email', 'mensaje', 'fecha')


@admin.register(ImagenSitio)
class ImagenSitioAdmin(admin.ModelAdmin):
    list_display = ('miniatura', 'clave', 'alt')
    list_display_links = ('clave',)

    @admin.display(description='')
    def miniatura(self, obj):
        return _thumb(obj.imagen)


@admin.register(Tecnologia)
class TecnologiaAdmin(admin.ModelAdmin):
    list_display = ('miniatura', 'nombre', 'orden', 'en_carrusel')
    list_editable = ('orden', 'en_carrusel')
    list_display_links = ('nombre',)

    @admin.display(description='')
    def miniatura(self, obj):
        return _thumb(obj.logo, 24)


class ResultadoInline(admin.TabularInline):
    model = ProyectoResultado
    extra = 0


class ImagenInline(admin.TabularInline):
    model = ProyectoImagen
    extra = 0


@admin.register(Proyecto)
class ProyectoAdmin(admin.ModelAdmin):
    list_display = ('miniatura', 'nombre', 'tipo', 'anio', 'completo', 'orden', 'publicado', 'destacado_home')
    list_display_links = ('nombre',)
    list_editable = ('orden', 'publicado', 'destacado_home')
    list_filter = ('tipo', 'publicado', 'destacado_home')
    search_fields = ('nombre', 'cliente', 'etiquetas')
    prepopulated_fields = {'slug': ('nombre',)}
    filter_horizontal = ('tecnologias',)
    inlines = [ResultadoInline, ImagenInline]
    fieldsets = (
        ('Listado del home', {'fields': ('nombre', 'slug', 'descripcion_corta', 'etiquetas', 'imagen', 'orden', 'publicado', 'destacado_home')}),
        ('Detalle del caso', {'fields': ('cliente', 'tipo', 'anio', 'desafio', 'solucion', 'tecnologias')}),
        ('Enlace', {'fields': ('url_externa', 'nueva_pestana')}),
    )

    @admin.display(description='')
    def miniatura(self, obj):
        return _thumb(obj.imagen)

    @admin.display(description='Detalle')
    def completo(self, obj):
        falta = [n for n, ok in (('desafío', obj.desafio), ('solución', obj.solucion), ('resultados', obj.resultados.exists()), ('stack', obj.tecnologias.exists())) if not ok]
        if not falta:
            return format_html('<span style="color:#4d6b00;font-weight:600">✓ completo</span>')
        return format_html('<span style="color:#b45309">Falta: {}</span>', ', '.join(falta))


admin.site.site_header = 'Perseus Technology'
admin.site.site_title = 'Perseus admin'
