Despliegue en PythonAnywhere

Requisitos previos:
- Cuenta en PythonAnywhere
- Acceso a la consola Bash en PythonAnywhere
- Virtualenv con Python >= 3.11 (usar la versión del proyecto)
- Base de datos (MySQL) configurada en PythonAnywhere o usar la base de datos externa

Pasos resumidos:

1) Subir el proyecto
- Subir por Git (github) o subir los archivos al dashboard de PythonAnywhere.

2) Crear virtualenv e instalar dependencias
```bash
python -m venv ~/venv-myproject
source ~/venv-myproject/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

3) Configurar variables de entorno (en Web > Environment variables)
- `DJANGO_SECRET_KEY` : una clave segura
- `DJANGO_DEBUG` : `False`
- `DJANGO_ALLOWED_HOSTS` : `tuusuario.pythonanywhere.com`
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` : credenciales de MySQL (si aplica)

4) Ajustar `settings.py`
- Ya se ha preparado para leer variables de entorno y usar `STATIC_ROOT`.

5) Ejecutar migraciones y collectstatic
```bash
source ~/venv-myproject/bin/activate
cd ~/yourprojectdir
python manage.py migrate --noinput
python manage.py collectstatic --noinput
```

6) Configurar Web app (PythonAnywhere dashboard > Web)
- Seleccionar la virtualenv creada.
- Apuntar WSGI file al `wsgi.py` del proyecto (normalmente `~/yourprojectdir/Proyecto/wsgi.py`).
- En "Static files" añadir mapeo: `/static/` -> `/home/youruser/yourprojectdir/staticfiles` (ruta absoluta en PythonAnywhere).

7) Conectar base de datos
- Si usas MySQL en PythonAnywhere, crea la base y configura `DB_*` en variables de entorno.
- Si usas MySQL externo, asegúrate de permitir conexiones desde PythonAnywhere.

8) Comprobar y reiniciar la app web desde el dashboard.

Notas y recomendaciones:
- No dejes `DEBUG=True` en producción.
- Mantén `SECRET_KEY` fuera del repositorio.
- Si tienes problemas con archivos estáticos, revisa la ruta `STATIC_ROOT` y que `collectstatic` se ejecutó correctamente.
- Considera usar `pythonanywhere` MySQL o un servicio gestionado si necesitas mayor disponibilidad.
