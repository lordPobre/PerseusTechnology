"""Textos de las páginas de servicio y producto. Se pasan a las plantillas desde views.py."""
from django.utils.translation import gettext_lazy as _

FINTORA_URL = 'https://www.fintora.cl'
_DEV = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/'


def _stack(*items):
    return [(n, _DEV + p + '.svg') for n, p in items]

DIVISIONES = {
    'web': {
        'n': '01', 'nombre': _('Desarrollo Web'), 'url': 'web',
        'demo': 'perseus-code', 'demo_label': _('Un e-commerce en Django, línea por línea. Pasa el cursor por el sitio.'),
        'stack': _stack(('Django', 'django/django-plain'), ('Next.js', 'nextjs/nextjs-original'), ('Python', 'python/python-original'), ('Tailwind CSS', 'tailwindcss/tailwindcss-original'), ('PostgreSQL', 'postgresql/postgresql-original')),
        'h1': _('Plataformas web'), 'h1_acento': _('hechas para vender.'),
        'sub': _('Sitios corporativos, e-commerce y sistemas internos sobre Python, Django y Next.js. Arquitectura limpia, carga en milisegundos y SEO técnico desde el primer commit.'),
        'cta': _('Cotizar desarrollo'),
        'caps_titulo': _('Lo que construimos.'),
        'caps_intro': _('Cada proyecto parte con la arquitectura de datos y termina con métricas de rendimiento verificables. Sin plantillas genéricas.'),
        'caps': [
            (_('Sistemas web a medida'), _('CRMs, portales y herramientas internas en Django, con bases de datos preparadas para miles de transacciones por segundo.')),
            (_('Landings de alta conversión'), _('Páginas livianas con UX persuasiva, pensadas para transformar visitas en oportunidades comerciales.')),
            (_('Tiendas online'), _('Catálogos autoadministrables con carrito e integración con pasarelas de pago chilenas e internacionales.')),
            (_('Integración de APIs'), _('Conexión con ERP, facturación electrónica y CRM para que la información fluya sin digitación manual.')),
            (_('SEO y performance técnico'), _('Puntajes Lighthouse altos, datos estructurados y una arquitectura indexable para crecer en búsqueda orgánica.')),
        ],
        'precio': {'etiqueta': _('Pago único desde'), 'monto': '$150.000', 'unidad': 'CLP',
                   'nota': _('Las mantenciones y cambios estructurales posteriores a la entrega se cotizan como servicios adicionales.')},
        'tipo_casos': 'web',
        'cierre': _('Cotiza tu desarrollo.'),
    },
    'apps': {
        'n': '02', 'nombre': _('Apps Corporativas'), 'url': 'apps',
        'demo': 'perseus-dash', 'demo_label': _('Panel de flujo de caja con datos de ejemplo. Recorre el gráfico.'),
        'stack': _stack(('Python', 'python/python-original'), ('Django', 'django/django-plain'), ('React', 'react/react-original'), ('PostgreSQL', 'postgresql/postgresql-original'), ('Docker', 'docker/docker-original')),
        'h1': _('Herramientas internas'), 'h1_acento': _('que reemplazan planillas.'),
        'sub': _('Aplicaciones a medida que reemplazan planillas y procesos manuales, construidas sobre la misma base que Fintora, nuestra app de flujo de caja.'),
        'cta': _('Cotizar una app'),
        'caps_titulo': _('Lo que construimos.'),
        'caps_intro': _('Partimos por el proceso que hoy vive en planillas y lo convertimos en una app con roles, historial y reportes.'),
        'caps': [
            ('Fintora', _('Nuestra app propia y gratuita para categorizar ingresos y egresos y proyectar el flujo de caja.'), 'fintora'),
            (_('Apps a medida'), _('Si tu proceso no calza con un producto existente, lo construimos sobre la misma base.'), None),
        ],
        'precio': None,
        'tipo_casos': 'apps',
        'cierre': _('Automatiza tu operación.'),
    },
    'consultoria': {
        'n': '03', 'nombre': _('Consultoría TI'), 'url': 'consultoria',
        'demo': 'perseus-infra', 'demo_label': _('Monitor de infraestructura. Haz clic en un nodo para simular una falla.'),
        'stack': _stack(('AWS', 'amazonwebservices/amazonwebservices-original-wordmark'), ('Azure', 'azure/azure-original'), ('Linux', 'linux/linux-original'), ('Docker', 'docker/docker-original'), ('PostgreSQL', 'postgresql/postgresql-original')),
        'h1': _('Infraestructura TI'), 'h1_acento': _('que no se detiene.'),
        'sub': _('Estrategia cloud, administración de Microsoft 365, bases de datos y seguridad de la información. Diseñamos, migramos y operamos tu infraestructura con soporte 24/7.'),
        'cta': _('Agendar diagnóstico'),
        'caps_titulo': _('Lo que administramos.'),
        'caps_intro': _('Partimos con un diagnóstico de lo que ya tienes y entregamos un plan priorizado por riesgo y costo.'),
        'caps': [
            (_('Estrategia cloud'), _('Arquitectura y migración a la nube con costos previsibles y alta disponibilidad.')),
            (_('Microsoft 365'), _('Administración de cuentas, licencias, correo y colaboración con políticas de seguridad claras.')),
            (_('Bases de datos'), _('Diseño, respaldo y optimización para que tus sistemas respondan bajo carga.')),
            (_('Seguridad ISO 27001'), _('Controles y procesos alineados a la norma para proteger la información de tu empresa.')),
            (_('Soporte 24/7'), _('Monitoreo proactivo e ingenieros disponibles para incidentes críticos.')),
        ],
        'precio': {'etiqueta': _('Planes desde'), 'monto': '$25.000', 'unidad': _('CLP / mes'),
                   'nota': _('Administración de Microsoft 365, respaldos, mantención de hardware, dominios corporativos y asesoría TI.')},
        'tipo_casos': 'consultoria',
        'cierre': _('Ordena tu infraestructura.'),
    },
}

PRODUCTOS = {
    'fintora': {
        'nombre': 'Fintora', 'url': 'fintora', 'imagen': 'producto-fintora',
        'imagen_static': 'core/img/dashboard-finapp.png', 'sello': _('App propia · Gratis'),
        'sub': _('Flujo de caja personal y empresarial bajo control.'),
        'monto': '$0', 'unidad': _('CLP · software gratuito'),
        'cta': _('Crear cuenta'), 'cta_url': FINTORA_URL,
        'features': [_('Dashboard de ingresos y egresos analítico'), _('Categorización de movimientos'), _('Acceso seguro en la nube (24/7)')],
    },
}
