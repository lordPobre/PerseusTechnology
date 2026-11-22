"""Pruebas de humo y del formulario de contacto. Corren en CI en cada push.

    python manage.py collectstatic --noinput   # con DEBUG=False las plantillas usan el manifest
    python manage.py test
"""
import time
from unittest import mock

from django.core import mail, signing
from django.core.cache import caches
from django.test import TestCase, override_settings
from django.urls import reverse

from .models import Contacto
from .seguridad import SAL_FORMULARIO, ip_cliente, sello_tiempo


def sello_antiguo(segundos=10):
    return signing.dumps(int(time.time()) - segundos, salt=SAL_FORMULARIO)


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend', EMAIL_HOST_USER='hola@perseustechnology.dev')
class ContactoTests(TestCase):
    url = '/contacto/'

    def setUp(self):
        caches['ratelimit'].clear()

    def datos(self, **extra):
        base = {
            'nombre': 'Ana Pérez', 'email': 'ana@empresa.cl', 'asunto': 'Sitio web',
            'mensaje': 'Necesito un sitio corporativo con blog.', 'website': '', 'ts': sello_antiguo(),
        }
        base.update(extra)
        return base

    def post(self, ip='200.1.1.1', **extra):
        return self.client.post(self.url, self.datos(**extra), HTTP_X_REAL_IP=ip, secure=True)

    def test_envio_valido_guarda_y_envia_dos_correos(self):
        r = self.post()
        self.assertEqual(r.status_code, 302)
        self.assertEqual(Contacto.objects.count(), 1)
        self.assertEqual(Contacto.objects.get().asunto, 'Sitio web')
        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual(mail.outbox[0].reply_to, ['ana@empresa.cl'])

    def test_honeypot_se_descarta_en_silencio(self):
        self.post(website='http://spam.example')
        self.assertEqual(Contacto.objects.count(), 0)
        self.assertEqual(len(mail.outbox), 0)

    def test_envio_demasiado_rapido_se_descarta(self):
        self.post(ts=sello_tiempo())
        self.assertEqual(Contacto.objects.count(), 0)
        self.assertEqual(len(mail.outbox), 0)

    def test_sin_sello_o_sello_falso_no_envia(self):
        self.post(ts='')
        self.post(ts='123:falso')
        self.assertEqual(Contacto.objects.count(), 0)

    def test_nombre_con_enlace_se_rechaza(self):
        self.post(nombre='Gana dinero en https://spam.example')
        self.assertEqual(Contacto.objects.count(), 0)

    def test_mensaje_con_muchos_enlaces_se_rechaza(self):
        self.post(mensaje=' '.join(f'https://x{i}.example' for i in range(5)))
        self.assertEqual(Contacto.objects.count(), 0)

    def test_limite_por_ip(self):
        for i in range(5):
            self.post(email=f'persona{i}@empresa.cl')
        self.assertEqual(Contacto.objects.count(), 3)

    def test_limite_por_correo_de_destino(self):
        for i in range(4):
            self.post(ip=f'200.1.1.{i + 10}')
        self.assertEqual(Contacto.objects.count(), 2)

    def test_si_el_correo_falla_el_contacto_no_se_pierde(self):
        with mock.patch('django.core.mail.EmailMultiAlternatives.send', side_effect=OSError('smtp caído')):
            r = self.post()
        self.assertEqual(r.status_code, 302)
        self.assertEqual(Contacto.objects.count(), 1)

    def test_no_redirige_a_otro_sitio(self):
        r = self.client.post(self.url, self.datos(), HTTP_REFERER='https://malicioso.example/', HTTP_X_REAL_IP='1.2.3.4', secure=True)
        self.assertFalse(r['Location'].startswith('https://malicioso.example'))


class PaginasTests(TestCase):
    def test_paginas_principales(self):
        for nombre in ('home', 'web', 'apps', 'fintora', 'consultoria', 'precios', 'nosotros', 'contacto', 'blog', 'ayuda', 'privacidad'):
            with self.subTest(nombre=nombre):
                self.assertEqual(self.client.get(reverse(nombre), secure=True).status_code, 200)

    def test_version_en_ingles(self):
        self.assertEqual(self.client.get('/en/', secure=True).status_code, 200)

    def test_robots_y_sitemap(self):
        r = self.client.get('/robots.txt', secure=True)
        self.assertContains(r, 'Sitemap: https://perseustechnology.dev/sitemap.xml')
        self.assertEqual(self.client.get('/sitemap.xml', secure=True).status_code, 200)

    def test_404_personalizado(self):
        r = self.client.get('/no-existe-esta-ruta/', secure=True)
        self.assertEqual(r.status_code, 404)
        self.assertContains(r, 'Ruta no encontrada', status_code=404)

    def test_formularios_llevan_protecciones(self):
        html = self.client.get(reverse('home'), secure=True).content.decode()
        self.assertIn('name="website"', html)
        self.assertIn('name="ts"', html)
        self.assertIn(' ts="', self.client.get(reverse('contacto'), secure=True).content.decode())

    def test_estaticos_y_robots_se_guardan_en_el_cdn(self):
        from django.templatetags.static import static
        r = self.client.get(static('core/js/site.js'), secure=True)
        self.assertEqual(r.status_code, 200)
        self.assertIn('max-age', r.get('CDN-Cache-Control', ''))
        self.assertIn('s-maxage', self.client.get('/robots.txt', secure=True)['Cache-Control'])
        self.assertIn('s-maxage', self.client.get('/sitemap.xml', secure=True)['Cache-Control'])

    def test_cabeceras_de_seguridad(self):
        r = self.client.get(reverse('home'), secure=True)
        self.assertEqual(r['X-Frame-Options'], 'DENY')
        self.assertEqual(r['X-Content-Type-Options'], 'nosniff')
        self.assertTrue(r.has_header('Content-Security-Policy') or r.has_header('Content-Security-Policy-Report-Only'))


class IpClienteTests(TestCase):
    def test_prioriza_x_real_ip(self):
        req = mock.Mock(META={'HTTP_X_REAL_IP': '9.9.9.9', 'HTTP_X_FORWARDED_FOR': '1.1.1.1, 2.2.2.2', 'REMOTE_ADDR': '10.0.0.1'})
        self.assertEqual(ip_cliente(req), '9.9.9.9')

    def test_usa_la_ultima_de_x_forwarded_for(self):
        req = mock.Mock(META={'HTTP_X_FORWARDED_FOR': '1.1.1.1, 2.2.2.2', 'REMOTE_ADDR': '10.0.0.1'})
        self.assertEqual(ip_cliente(req), '2.2.2.2')


class AdminFuerzaBrutaTests(TestCase):
    def test_bloquea_tras_5_intentos_fallidos(self):
        from django.contrib.auth.models import User
        User.objects.create_superuser('carlos', 'c@x.cl', 'una-clave-larga-y-segura')
        url = reverse('admin:login')
        for _ in range(5):
            self.client.post(url, {'username': 'carlos', 'password': 'mala'}, HTTP_X_REAL_IP='5.5.5.5', secure=True)
        r = self.client.post(url, {'username': 'carlos', 'password': 'una-clave-larga-y-segura'}, HTTP_X_REAL_IP='5.5.5.5', secure=True)
        self.assertEqual(r.status_code, 429)
        # Desde otra IP el dueño sigue pudiendo entrar (el bloqueo es usuario + IP)
        r = self.client.post(url, {'username': 'carlos', 'password': 'una-clave-larga-y-segura'}, HTTP_X_REAL_IP='6.6.6.6', secure=True)
        self.assertEqual(r.status_code, 302)
