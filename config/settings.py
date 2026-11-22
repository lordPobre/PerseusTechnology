import os
import sys
from datetime import timedelta
from pathlib import Path

import dj_database_url
from django.core.exceptions import ImproperlyConfigured
from django.utils.csp import CSP
from django.utils.translation import gettext_lazy as _
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


def env_bool(nombre, defecto=False):
    return os.getenv(nombre, str(defecto)).strip().lower() in ('1', 'true', 'yes', 'si', 'sí', 'on')


def env_list(nombre, defecto):
    valor = os.getenv(nombre)
    return [x.strip() for x in valor.split(',') if x.strip()] if valor else defecto


# --- Núcleo -------------------------------------------------------------------
# Producción por defecto. En tu .env local agrega: DEBUG=True
DEBUG = env_bool('DEBUG', False)

SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    if not DEBUG:
        raise ImproperlyConfigured('Falta la variable de entorno SECRET_KEY.')
    SECRET_KEY = 'solo-desarrollo-no-usar-en-produccion'

ALLOWED_HOSTS = env_list('ALLOWED_HOSTS', [
    '127.0.0.1',
    'localhost',
    '.vercel.app',
    'perseustechnology.dev',
    'www.perseustechnology.dev',
])
CSRF_TRUSTED_ORIGINS = env_list('CSRF_TRUSTED_ORIGINS', [
    'https://perseustechnology.dev',
    'https://www.perseustechnology.dev',
])

# Ruta del admin configurable: el repo es público, así que la ruta no es secreta.
ADMIN_URL = os.getenv('ADMIN_URL', 'perseus-access-x1/').strip('/') + '/'

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sitemaps',
    'django.contrib.sites',
    'core',
    'cloudinary_storage',
    'cloudinary',
    'axes',
]

SITE_ID = 1

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.csp.ContentSecurityPolicyMiddleware',
    'axes.middleware.AxesMiddleware',  # siempre al final
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'django.template.context_processors.i18n',
                'django.template.context_processors.csp',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Las pruebas (manage.py test) siempre usan SQLite local: nunca tocan Neon/producción, corren
# mucho más rápido y evitan que el pooler de Neon bloquee el DROP DATABASE del final.
TESTING = len(sys.argv) > 1 and sys.argv[1] == 'test'

if os.getenv('DATABASE_URL') and not TESTING:
    DATABASES = {'default': dj_database_url.config(conn_health_checks=True)}
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# "default" en memoria (rápido, por instancia). "ratelimit" en la base de datos para que los
# límites del formulario se compartan entre instancias. La tabla la crea la migración 0009.
CACHES = {
    'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'},
    'ratelimit': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'perseus_ratelimit',
        'OPTIONS': {'MAX_ENTRIES': 20000},
    },
}

# --- Login del admin: bloqueo por fuerza bruta (django-axes) -------------------
AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesStandaloneBackend',
    'django.contrib.auth.backends.ModelBackend',
]
AXES_FAILURE_LIMIT = 5
AXES_COOLOFF_TIME = timedelta(hours=1)
AXES_LOCKOUT_PARAMETERS = [['username', 'ip_address']]  # solo usuario no: dejaría bloquearte a propósito
AXES_RESET_ON_SUCCESS = True
AXES_CLIENT_IP_CALLABLE = 'core.seguridad.ip_cliente'
CLIENT_IP_HEADER = os.getenv('CLIENT_IP_HEADER', 'HTTP_X_REAL_IP')

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 12}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# --- Idiomas ------------------------------------------------------------------
LANGUAGE_CODE = 'es'
LANGUAGES = [
    ('es', _('Español')),
    ('en', _('English')),
]
LOCALE_PATHS = [BASE_DIR / 'locale']
TIME_ZONE = 'America/Santiago'
USE_I18N = True
USE_TZ = True

# --- Archivos -----------------------------------------------------------------
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.getenv('CLOUDINARY_API_KEY'),
    'API_SECRET': os.getenv('CLOUDINARY_API_SECRET'),
}

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Django 5.1+ ignora STATICFILES_STORAGE y DEFAULT_FILE_STORAGE: con Django 6 la compresión
# y los nombres con hash de WhiteNoise no estaban activos. STORAGES es la forma actual.
STORAGES = {
    'default': {
        'BACKEND': 'cloudinary_storage.storage.MediaCloudinaryStorage'
        if os.getenv('CLOUDINARY_CLOUD_NAME') else 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage'
        if not DEBUG else 'django.contrib.staticfiles.storage.StaticFilesStorage',
    },
}

# --- Correo -------------------------------------------------------------------
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = 'smtppro.zoho.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_TIMEOUT = 10  # sin esto, un SMTP colgado deja la petición esperando hasta el timeout de la plataforma
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = f"Perseus Technology <{EMAIL_HOST_USER}>"
SERVER_EMAIL = DEFAULT_FROM_EMAIL

# --- Seguridad HTTP -----------------------------------------------------------
# Vercel y Railway terminan HTTPS en su proxy y avisan con X-Forwarded-Proto.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = env_bool('SECURE_SSL_REDIRECT', not DEBUG)
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_HTTPONLY = True  # el token viaja en el HTML, el JS no lee la cookie
SESSION_COOKIE_AGE = 60 * 60 * 8  # sesión del admin: 8 horas
# .dev ya está en la lista HSTS precargada de los navegadores: activar HSTS no cambia nada para
# ellos y sí protege a clientes que no usan esa lista.
SECURE_HSTS_SECONDS = 0 if DEBUG else int(os.getenv('SECURE_HSTS_SECONDS', 31536000))
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
X_FRAME_OPTIONS = 'DENY'

# Content-Security-Policy (soporte nativo de Django 6). Parte en modo "solo reporte": no bloquea,
# solo avisa en la consola del navegador. Cuando la consola quede limpia, usa CSP_ENFORCE=True.
# 'unsafe-eval' es obligatorio para Alpine.js estándar (evalúa x-data/@click).
_CSP = {
    'default-src': [CSP.SELF],
    # esm.sh: three.js del cristal 3D del home (perseus-glass.js lo importa desde ahí).
    'script-src': [CSP.SELF, CSP.NONCE, CSP.UNSAFE_EVAL, 'https://esm.sh', 'https://www.googletagmanager.com'],
    'style-src': [CSP.SELF, CSP.UNSAFE_INLINE],
    'img-src': [CSP.SELF, 'data:', 'https://res.cloudinary.com',
                'https://*.google-analytics.com', 'https://*.googletagmanager.com'],
    'font-src': [CSP.SELF],
    'connect-src': [CSP.SELF, 'https://*.google-analytics.com', 'https://*.analytics.google.com',
                    'https://*.googletagmanager.com'],
    'frame-ancestors': [CSP.NONE],
    'base-uri': [CSP.SELF],
    'form-action': [CSP.SELF],
    'object-src': [CSP.NONE],
}
if env_bool('CSP_ENFORCE', False):
    SECURE_CSP = _CSP
else:
    SECURE_CSP_REPORT_ONLY = _CSP

# --- Logs (Vercel/Railway muestran stdout) ------------------------------------
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {'console': {'class': 'logging.StreamHandler'}},
    'root': {'handlers': ['console'], 'level': 'WARNING'},
    'loggers': {
        'core': {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
        'django.security': {'handlers': ['console'], 'level': 'WARNING', 'propagate': False},
    },
}
