from django import forms
from .models import Contacto

class ContactoForm(forms.ModelForm):
    class Meta:
        model = Contacto
        fields = ['nombre', 'email', 'mensaje']
        widgets = {
            'nombre': forms.TextInput(attrs={
                'class': 'w-full bg-slate-800 border border-slate-700 text-white rounded py-3 px-4 mb-3 focus:outline-none focus:border-cyan-500',
                'placeholder': 'Tu nombre'
            }),
            'email': forms.EmailInput(attrs={
                'class': 'w-full bg-slate-800 border border-slate-700 text-white rounded py-3 px-4 mb-3 focus:outline-none focus:border-cyan-500',
                'placeholder': 'tucorreo@ejemplo.com'
            }),
            'mensaje': forms.Textarea(attrs={
                'class': 'w-full bg-slate-800 border border-slate-700 text-white rounded py-3 px-4 mb-3 focus:outline-none focus:border-cyan-500 h-32',
                'placeholder': 'Cuéntanos sobre tu proyecto...'
            }),
        }