#!/bin/bash

echo "--- INICIO DEL BUILD ---"

python3 -m venv venv

source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --noinput --clear

echo "--- FIN DEL BUILD ---"