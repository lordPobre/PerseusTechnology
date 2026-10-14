"""Carga el contenido inicial del sitio.

    python manage.py cargar_contenido_inicial                # todo
    python manage.py cargar_contenido_inicial --sin-imagenes # sin subir imágenes a Cloudinary

- Crea los 3 proyectos (Instinto Olfativo, VC Chile, Fintora) y sube sus capturas desde static/ a Cloudinary.
- Sube las imágenes del proceso y de Fintora a "Imágenes del sitio".
- Crea 3 artículos del blog como BORRADOR (publicado=False) para que los revises antes de publicarlos.
No sobrescribe nada que ya exista: si un registro ya está, lo deja como está.
"""
from django.contrib.staticfiles import finders
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from core.models import Categoria, ImagenSitio, Post, Proyecto

PROYECTOS = [
    dict(nombre='Instinto Olfativo', tipo='web', orden=1, etiquetas='E-commerce, Django',
         descripcion_corta='Tienda online con catálogo autoadministrable y pagos integrados.',
         url_externa='https://instintoolfativo.cl/', img='core/img/dashboard-dl.png'),
    dict(nombre='VC Chile', tipo='web', orden=2, etiquetas='Corporativo, SEO',
         descripcion_corta='Sitio corporativo para una empresa de ingeniería y construcción.',
         url_externa='https://vcchile.cl/', img='core/img/inicio-vc.webp'),
    dict(nombre='Fintora', tipo='apps', orden=3, etiquetas='App propia, Gratis', cliente='Perseus Technology',
         descripcion_corta='App propia de Perseus para ordenar las finanzas personales: ingresos, gastos y saldo.',
         url_externa='https://www.fintora.cl', img='core/img/dashboard-finapp.png'),
]

IMAGENES = {
    'proceso-1': 'core/img/dashboard-dl.png',
    'proceso-2': 'core/img/inicio-vc.webp',
    'proceso-3': 'core/img/dashboard-dl.png',
    'proceso-4': 'core/img/dashboard-finapp.png',
    'producto-fintora': 'core/img/dashboard-finapp.png',
}

POSTS = [
    dict(
        categoria='Gestión', tiempo_lectura=5,
        titulo='¿Planilla o sistema? Cinco señales de que tu empresa necesita una app a medida',
        resumen='Las planillas sirven para empezar, pero llega un punto en que frenan la operación. Estas son las señales más comunes de que conviene pasar a un sistema propio.',
        contenido="""<p>Casi todas las empresas parten igual: una planilla para las ventas, otra para el inventario y otra para los pagos. Funciona mientras el equipo es chico y los datos caben en una pantalla. El problema aparece cuando la planilla deja de ser una herramienta y se convierte en el lugar donde vive el negocio.</p>
<h2>1. Hay más de una versión de la verdad</h2>
<p>"Final", "final_v2", "final_ahora_sí". Si dos personas trabajan sobre copias distintas del mismo archivo, cada reunión empieza discutiendo cuál número es el correcto. Un sistema guarda un solo registro y deja claro quién cambió qué y cuándo.</p>
<h2>2. Alguien pasa horas copiando datos</h2>
<p>Copiar pedidos del correo a la planilla, de la planilla al sistema contable y de vuelta al correo del cliente es trabajo que no agrega valor y que multiplica los errores. Cuando una tarea se repite todos los días con el mismo formato, es candidata a automatizarse.</p>
<h2>3. Nadie puede ver la información sin pedirla</h2>
<p>Si el gerente tiene que escribir para saber cuánto se vendió ayer, la información existe pero no está disponible. Un panel con permisos por rol permite que cada persona vea lo que necesita sin depender de otra.</p>
<h2>4. Los errores se descubren tarde</h2>
<p>Una fórmula borrada o una fila mal pegada puede pasar semanas sin que nadie lo note. Un sistema valida los datos al momento de ingresarlos: no deja guardar un RUT inválido, una fecha imposible o un stock negativo.</p>
<h2>5. El negocio creció y la planilla no</h2>
<p>Más sucursales, más vendedores o más productos hacen que el archivo se vuelva lento y difícil de mantener. Si para agregar un vendedor hay que rehacer fórmulas, la herramienta ya está limitando el crecimiento.</p>
<h2>Cómo dar el paso sin detener la operación</h2>
<p>No hace falta reemplazar todo de una vez. Lo habitual es partir por el proceso que más duele, construir una primera versión en pocas semanas y migrar los datos existentes. Después se suman módulos según la prioridad del negocio.</p>
<p>En Perseus construimos apps a medida sobre la misma base que <a href="https://www.fintora.cl">Fintora</a>, nuestra app de finanzas personales. Si te reconoces en dos o más de estas señales, <a href="/contacto/">cuéntanos tu caso</a> y te decimos por dónde empezar.</p>""",
    ),
    dict(
        categoria='Desarrollo web', tiempo_lectura=6,
        titulo='Qué revisar antes de cotizar un sitio web corporativo',
        resumen='Dos cotizaciones por "un sitio web" pueden describir proyectos muy distintos. Esta lista te ayuda a comparar propuestas y evitar sorpresas después de la entrega.',
        contenido="""<p>Pedir tres cotizaciones para un sitio web y recibir montos que van de cien mil a varios millones de pesos es normal. La diferencia casi nunca está en el diseño: está en lo que cada propuesta incluye y en lo que deja fuera. Antes de comparar precios, conviene revisar estos puntos.</p>
<h2>¿Quién podrá editar el contenido?</h2>
<p>Pregunta si tu equipo podrá cambiar textos, imágenes y noticias sin pedir ayuda. Un panel autoadministrable evita depender del proveedor para cada ajuste y reduce costos a mediano plazo.</p>
<h2>¿De quién es el sitio?</h2>
<p>El dominio, el código y el acceso al hosting deberían quedar a nombre de tu empresa. Si el proveedor desaparece, tienes que poder trasladar el sitio a otra persona sin empezar de cero.</p>
<h2>¿Qué tan rápido carga?</h2>
<p>La velocidad influye en la experiencia de las visitas y en el posicionamiento en Google. Pide que la propuesta mencione cómo se optimizan las imágenes y qué puntaje de rendimiento se espera en herramientas como PageSpeed Insights.</p>
<h2>¿Incluye SEO técnico?</h2>
<p>No es lo mismo un sitio que "se puede encontrar" que uno preparado para posicionar: títulos y descripciones por página, mapa del sitio, datos estructurados, URLs limpias y versión en otros idiomas si la necesitas.</p>
<h2>¿Qué pasa con los formularios?</h2>
<p>Revisa adónde llegan los mensajes de contacto, si el cliente recibe una confirmación y si los datos quedan guardados en un lugar seguro. Un formulario que falla en silencio es una venta perdida.</p>
<h2>¿Qué ocurre después de la entrega?</h2>
<p>Aclara qué cubre la garantía, cuánto cuestan los cambios posteriores y si existe un plan de soporte mensual. Es mejor saberlo antes que descubrirlo con el primer ajuste.</p>
<h2>¿Se conecta con lo que ya usas?</h2>
<p>Si vendes en línea o emites documentos, pregunta por integraciones con pasarelas de pago, facturación electrónica o tu ERP. Conectar después suele ser más caro que planificarlo desde el inicio.</p>
<p>En nuestra <a href="/precios/">página de precios</a> puedes armar una estimación con el cotizador y enviarla directo a un ingeniero.</p>""",
    ),
    dict(
        categoria='Infraestructura TI', tiempo_lectura=5,
        titulo='Respaldos, accesos y actualizaciones: lo mínimo en seguridad TI para una pyme',
        resumen='La mayoría de los incidentes en empresas pequeñas no requieren ataques sofisticados. Con cuatro hábitos básicos se reduce gran parte del riesgo.',
        contenido="""<p>Cuando se habla de ciberseguridad, es fácil pensar en ataques sofisticados contra grandes empresas. En la práctica, muchos incidentes en pymes empiezan por algo simple: una contraseña repetida, un equipo sin actualizar o un respaldo que nunca se probó. Estos son los mínimos que recomendamos revisar.</p>
<h2>1. Respaldos que se pueden restaurar</h2>
<p>Tener respaldos no basta: hay que comprobar que se pueden recuperar. Una regla práctica es mantener al menos una copia fuera de la oficina o en la nube, separada de los equipos de uso diario, y probar una restauración de forma periódica.</p>
<h2>2. Accesos con nombre y apellido</h2>
<p>Las cuentas compartidas impiden saber quién hizo qué. Cada persona debería tener su propio usuario, con los permisos justos para su trabajo, y esos accesos deben darse de baja el mismo día en que alguien deja la empresa.</p>
<h2>3. Verificación en dos pasos</h2>
<p>Activar la verificación en dos pasos en el correo, Microsoft 365 y los sistemas críticos es una de las medidas más efectivas y de menor costo. Aunque una contraseña se filtre, no alcanza para entrar.</p>
<h2>4. Actualizaciones al día</h2>
<p>Sistemas operativos, navegadores, plugins y servidores reciben parches de seguridad constantemente. Programar las actualizaciones y revisar qué equipos quedan atrás evita exponer vulnerabilidades conocidas.</p>
<h2>Datos personales: un tema que viene</h2>
<p>La Ley 21.719 actualiza las reglas de protección de datos personales en Chile y aumenta las exigencias para las empresas que tratan información de clientes y trabajadores. Ordenar accesos, respaldos y registros desde ya facilita la adecuación cuando la ley comience a regir.</p>
<h2>Por dónde empezar</h2>
<p>Un diagnóstico de una o dos horas suele bastar para tener un inventario de equipos y cuentas, detectar los riesgos principales y priorizar. Si quieres que lo revisemos contigo, <a href="/consultoria/">conoce nuestro servicio de consultoría TI</a> o <a href="/contacto/">escríbenos</a>.</p>""",
    ),
]


class Command(BaseCommand):
    help = 'Carga proyectos, imágenes del sitio y artículos de ejemplo (borrador).'

    def add_arguments(self, parser):
        parser.add_argument('--sin-imagenes', action='store_true', help='No subir imágenes a Cloudinary.')

    def _subir(self, ruta, carpeta):
        import cloudinary.uploader
        from cloudinary import CloudinaryResource
        archivo = finders.find(ruta)
        if not archivo:
            self.stdout.write(self.style.WARNING(f'  No encontré {ruta} en static/, lo omito.'))
            return None
        r = cloudinary.uploader.upload(archivo, folder=f'perseus/{carpeta}', overwrite=False, unique_filename=True)
        return CloudinaryResource(r['public_id'], version=r.get('version'), format=r.get('format'), type='upload', resource_type='image')

    def handle(self, *args, **opts):
        imgs = not opts['sin_imagenes']

        self.stdout.write('Proyectos')
        for d in PROYECTOS:
            d = dict(d)
            ruta = d.pop('img')
            p, creado = Proyecto.objects.get_or_create(slug=slugify(d['nombre']), defaults={**d, 'imagen': 'pendiente'})
            if creado and imgs:
                res = self._subir(ruta, 'proyectos')
                if res:
                    p.imagen = res
                    p.save(update_fields=['imagen'])
            self.stdout.write(f"  {'creado' if creado else 'ya existía'}: {p.nombre}")

        if imgs:
            self.stdout.write('Imágenes del sitio')
            for clave, ruta in IMAGENES.items():
                if ImagenSitio.objects.filter(clave=clave).exists():
                    self.stdout.write(f'  ya existía: {clave}')
                    continue
                res = self._subir(ruta, 'sitio')
                if res:
                    ImagenSitio.objects.create(clave=clave, imagen=res)
                    self.stdout.write(f'  subida: {clave}')

        self.stdout.write('Blog (borradores)')
        for d in POSTS:
            d = dict(d)
            cat, _ = Categoria.objects.get_or_create(slug=slugify(d['categoria']), defaults={'nombre': d.pop('categoria')})
            d.pop('categoria', None)
            post, creado = Post.objects.get_or_create(slug=slugify(d['titulo'])[:50], defaults={**d, 'categoria': cat, 'publicado': False})
            self.stdout.write(f"  {'creado' if creado else 'ya existía'}: {post.titulo}")

        self.stdout.write(self.style.SUCCESS('Listo. Revisa los proyectos y publica los artículos desde el admin.'))
