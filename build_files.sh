#!/bin/bash

echo "--- INICIO DEL BUILD ---"

# Usamos python3 y nos aseguramos de que pip esté actualizado
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt

# Ejecutamos collectstatic usando python3
python3 manage.py collectstatic --noinput --clear

echo "--- FIN DEL BUILD ---"