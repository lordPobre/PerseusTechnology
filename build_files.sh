#!/bin/bash

echo "--- INICIO DEL BUILD ---"
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt
python3 manage.py collectstatic --noinput --clear
echo "--- FIN DEL BUILD ---"