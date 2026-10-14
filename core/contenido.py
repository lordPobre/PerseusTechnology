"""Textos de las páginas de servicio y producto. Se pasan a las plantillas desde views.py."""
from django.utils.translation import gettext_lazy as _

FINTORA_URL = 'https://www.fintora.cl'
# Correo para solicitudes de privacidad (derechos ARCO). CÁMBIALO por uno que exista y revises.
PRIVACIDAD_EMAIL = 'soporte@perseustechnology.dev'
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
        'sub': _('Aplicaciones a medida que reemplazan planillas y procesos manuales, construidas sobre la misma base que Fintora, nuestra app de finanzas personales.'),
        'cta': _('Cotizar una app'),
        'caps_titulo': _('Lo que construimos.'),
        'caps_intro': _('Partimos por el proceso que hoy vive en planillas y lo convertimos en una app con roles, historial y reportes.'),
        'caps': [
            ('Fintora', _('Nuestra app propia y gratuita de finanzas personales: ordena tus ingresos y gastos y proyecta tu saldo.'), 'fintora'),
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

# Cotizador de /precios/. VALORES DE EJEMPLO: ajústalos a tus precios reales.
COTIZADOR = {
    'base': [
        {'id': 'landing', 't': _('Landing page'), 'd': _('Una página de alta conversión para una campaña o producto.'), 'p': 150000, 'pages': 1, 'weeks': 2},
        {'id': 'corp', 't': _('Sitio corporativo'), 'd': _('Secciones autoadministrables, blog y formulario de contacto.'), 'p': 350000, 'pages': 5, 'weeks': 4},
        {'id': 'shop', 't': _('E-commerce'), 'd': _('Catálogo, carrito, stock y pagos integrados.'), 'p': 650000, 'pages': 5, 'weeks': 6},
        {'id': 'app', 't': _('Sistema a medida'), 'd': _('Herramienta interna con roles, historial y reportes.'), 'p': 1200000, 'pages': 0, 'weeks': 10},
    ],
    'page_price': 40000,
    'max_pages': 20,
    'extras': [
        {'id': 'seo', 't': _('SEO técnico avanzado'), 'p': 120000, 'weeks': 0.5},
        {'id': 'blog', 't': _('Blog autoadministrable'), 'p': 90000, 'weeks': 0.5},
        {'id': 'en', 't': _('Versión en inglés'), 'p': 150000, 'weeks': 1},
        {'id': 'api', 't': _('Integración con ERP o facturación'), 'p': 250000, 'weeks': 2},
        {'id': 'pay', 't': _('Pasarela de pago'), 'p': 120000, 'weeks': 1, 'hide': ['shop']},
    ],
    'support': [
        {'t': _('Sin plan'), 'p': 0},
        {'t': _('Soporte TI'), 'p': 25000},
        {'t': _('Soporte y mejoras'), 'p': 60000},
    ],
}

PRODUCTOS = {
    'fintora': {
        'nombre': 'Fintora', 'url': 'fintora', 'imagen': 'producto-fintora',
        'imagen_static': 'core/img/dashboard-finapp.png', 'sello': _('App propia · Gratis'),
        'sub': _('Tus finanzas personales bajo control.'),
        'monto': '$0', 'unidad': _('CLP · software gratuito'),
        'cta': _('Crear cuenta'), 'cta_url': FINTORA_URL,
        'features': [
            (_('Dashboard de ingresos y egresos'), _('Ve en un solo panel cuánto entra, cuánto sale y cómo cambia tu saldo mes a mes.')),
            (_('Categorización de movimientos'), _('Agrupa cada ingreso y egreso por categoría para saber dónde se va el dinero.')),
            (_('Acceso seguro en la nube'), _('Disponible 24/7 desde el navegador, sin instalar nada.')),
        ],
        'pasos': [
            (_('Crea tu cuenta'), _('Regístrate gratis en fintora.cl con tu correo.')),
            (_('Registra tus movimientos'), _('Anota ingresos y egresos y asígnales una categoría.')),
            (_('Revisa tu flujo'), _('El panel muestra tu saldo y la proyección del flujo de caja.')),
        ],
        'faq': [
            (_('¿Fintora es gratis?'), _('Sí. Fintora es un software gratuito desarrollado por Perseus Technology.')),
            (_('¿Sirve para empresas?'), _('No. Fintora está pensada para finanzas personales: tus ingresos, gastos y ahorro. Para una empresa construimos una app a medida.')),
            (_('¿Necesito instalar algo?'), _('No. Funciona en la nube y entras desde el navegador.')),
            (_('¿Pueden adaptarlo a mi empresa?'), _('Sí. Construimos apps a medida sobre la misma base. Escríbenos y lo evaluamos.')),
        ],
    },
}
