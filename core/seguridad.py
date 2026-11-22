"""Protección anti-bots del formulario de contacto y utilidades de seguridad.

Capas (de la más barata a la más costosa para el bot):
1. Honeypot: campo `website` oculto a las personas. Si viene con texto, es un bot.
2. Sello de tiempo firmado (`ts`): el formulario lleva la hora en que se generó, firmada
   con SECRET_KEY. Un envío en menos de TIEMPO_MINIMO segundos no lo hizo una persona.
3. Límites por IP y por correo de destino, guardados en la base de datos (caché "ratelimit"),
   para que funcionen aunque haya varias instancias (Vercel, Railway con réplicas).

Las IP y los correos se guardan como HMAC, nunca en claro.
"""
import hashlib
import hmac
import logging
import re
import time

from django.conf import settings
from django.core import signing
from django.core.cache import caches
from django.db import DatabaseError

logger = logging.getLogger('core.seguridad')

SAL_FORMULARIO = 'perseus.contacto.ts'
TIEMPO_MINIMO = 3            # segundos: menos que esto no es una persona
TIEMPO_MAXIMO = 12 * 3600    # segundos: después, el formulario se considera vencido

URL_RE = re.compile(r'(https?://|www\.)', re.IGNORECASE)


# --- IP del cliente -----------------------------------------------------------

def ip_cliente(request):
    """IP real del visitante detrás del proxy de la plataforma.

    Vercel y Railway envían X-Real-IP. Si no viene, se usa la última IP de
    X-Forwarded-For (la que agregó el proxy más cercano: las anteriores las puede
    inventar el cliente) y, por último, REMOTE_ADDR. El encabezado se puede cambiar
    con la variable de entorno CLIENT_IP_HEADER (por ejemplo HTTP_CF_CONNECTING_IP
    si pones Cloudflare delante).
    """
    meta = request.META
    cabecera = getattr(settings, 'CLIENT_IP_HEADER', 'HTTP_X_REAL_IP')
    ip = (meta.get(cabecera) or '').strip()
    if not ip:
        xff = meta.get('HTTP_X_FORWARDED_FOR', '')
        if xff:
            ip = xff.split(',')[-1].strip()
    return ip or meta.get('REMOTE_ADDR', '') or 'desconocida'


# --- Sello de tiempo firmado --------------------------------------------------

def sello_tiempo():
    """Valor para el campo oculto `ts` del formulario."""
    return signing.dumps(int(time.time()), salt=SAL_FORMULARIO)


def revisar_sello(valor):
    """Devuelve 'ok', 'rapido' (bot), 'vencido' o 'invalido'."""
    if not valor:
        return 'invalido'
    try:
        emitido = signing.loads(valor, salt=SAL_FORMULARIO, max_age=TIEMPO_MAXIMO)
    except signing.SignatureExpired:
        return 'vencido'
    except signing.BadSignature:
        return 'invalido'
    try:
        transcurrido = time.time() - int(emitido)
    except (TypeError, ValueError):
        return 'invalido'
    return 'rapido' if transcurrido < TIEMPO_MINIMO else 'ok'


# --- Límites de envío ---------------------------------------------------------

def _clave(texto):
    firma = hmac.new(settings.SECRET_KEY.encode(), texto.encode(), hashlib.sha256).hexdigest()
    return 'rl:' + firma[:40]


def supera_limite(nombre, limite, ventana):
    """Ventana fija: cuenta un intento y dice si ya pasó `limite` en `ventana` segundos.

    Si la tabla de caché no existe o la base falla, deja pasar (y lo registra):
    es preferible recibir algo de spam a perder un cliente real.
    """
    cache = caches['ratelimit']
    clave = _clave(nombre)
    ahora = time.time()
    try:
        datos = cache.get(clave)
        if not datos or datos[1] <= ahora:
            datos = (0, ahora + ventana)
        datos = (datos[0] + 1, datos[1])
        cache.set(clave, datos, timeout=int(datos[1] - ahora) + 1)
    except DatabaseError:
        logger.exception('Límite de envíos no disponible (¿falta la tabla de caché?)')
        return False
    return datos[0] > limite


# --- Heurísticas de contenido -------------------------------------------------

def cuenta_enlaces(texto):
    return len(URL_RE.findall(texto or ''))
