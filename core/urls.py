from django.urls import path
from django.views.generic import RedirectView
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('desarrollo-web/', views.pagina_web, name='web'),
    path('apps/', views.apps_corporativas, name='apps'),
    path('apps/fintora/', views.fintora, name='fintora'),
    path('consultoria/', views.pagina_consultoria, name='consultoria'),
    path('precios/', views.pagina_precios, name='precios'),
    path('nosotros/', views.nosotros, name='nosotros'),
    path('contacto/', views.contacto, name='contacto'),
    path('ayuda/', views.pagina_ayuda, name='ayuda'),
    path('blog/', views.pagina_blog, name='blog'),
    path('blog/<slug:slug>/', views.post_detail, name='post_detail'),
    path('casos/<slug:slug>/', views.proyecto_detail, name='proyecto_detail'),
    path('privacidad/', views.privacidad, name='privacidad'),
]
