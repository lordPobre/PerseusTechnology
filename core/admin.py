from django.contrib import admin
from .models import Categoria, Post

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('nombre',)}

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'categoria', 'fecha_publicacion', 'destacado')
    prepopulated_fields = {'slug': ('titulo',)}
    list_filter = ('categoria', 'destacado')