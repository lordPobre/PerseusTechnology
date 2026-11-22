from django import forms
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from .seguridad import URL_RE, cuenta_enlaces, revisar_sello

MAX_ENLACES = 3


def _sin_saltos_ni_html(valor):
    if any(c in valor for c in '\r\n<>'):
        raise ValidationError(_('Revisa los datos del formulario: hay un campo inválido.'))


class ContactoForm(forms.Form):
    """Valida el formulario de contacto en el servidor (antes no se validaba nada).

    Lo usan el formulario del home, <perseus-contact> y el <noscript> de /contacto/.
    Las plantillas no renderizan este form: solo deben usar los mismos `name`.
    """
    nombre = forms.CharField(max_length=80, validators=[_sin_saltos_ni_html])
    email = forms.EmailField(max_length=254)
    asunto = forms.CharField(max_length=150, required=False, validators=[_sin_saltos_ni_html])
    mensaje = forms.CharField(min_length=5, max_length=5000)
    # Anti-bots
    website = forms.CharField(required=False)   # honeypot: debe llegar vacío
    ts = forms.CharField(required=False)        # sello de tiempo firmado

    def estado_bot(self):
        """'bot' (descartar en silencio), 'vencido', 'invalido' u 'ok'. Se llama antes de is_valid()."""
        if (self.data.get('website') or '').strip():
            return 'bot'
        sello = revisar_sello(self.data.get('ts', ''))
        return 'bot' if sello == 'rapido' else sello

    def clean_nombre(self):
        nombre = self.cleaned_data['nombre'].strip()
        if URL_RE.search(nombre):
            raise ValidationError(_('Revisa los datos del formulario: hay un campo inválido.'))
        return nombre

    def clean_asunto(self):
        asunto = (self.cleaned_data.get('asunto') or '').strip()
        if not asunto or URL_RE.search(asunto):
            return 'Consulta general'
        return asunto

    def clean_mensaje(self):
        mensaje = self.cleaned_data['mensaje'].strip()
        if cuenta_enlaces(mensaje) > MAX_ENLACES:
            raise ValidationError(_('Revisa los datos del formulario: hay un campo inválido.'))
        return mensaje
