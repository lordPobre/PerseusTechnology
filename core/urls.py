from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('desarrollo-web/', views.pagina_web, name='web'),
    path('marcacion/', views.pagina_marcacion, name='marcacion'),
    path('apps/', views.apps_corporativas, name='apps'),
    path('consultoria/', views.pagina_consultoria, name='consultoria'),
    path('precios/', views.pagina_precios, name='precios'),
    path('nosotros/', views.nosotros, name='nosotros'),
    path('contacto/', views.contacto, name='contacto'),
    path('ayuda/', views.pagina_ayuda, name='ayuda'),
    path('blog/', views.pagina_blog, name='blog'),
    path('blog/<slug:slug>/', views.post_detail, name='post_detail'),
    path('privacidad/', views.privacidad, name='privacidad'),

]