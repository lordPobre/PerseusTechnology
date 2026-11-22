"""Crea la tabla de caché "perseus_ratelimit" con `migrate`, sin depender de que alguien
recuerde correr `createcachetable` en cada plataforma (Vercel, Railway, local)."""
from django.core.management import call_command
from django.db import migrations


def crear_tabla(apps, schema_editor):
    call_command('createcachetable', database=schema_editor.connection.alias, verbosity=0)


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_contacto_asunto'),
    ]

    operations = [
        migrations.RunPython(crear_tabla, migrations.RunPython.noop),
    ]
