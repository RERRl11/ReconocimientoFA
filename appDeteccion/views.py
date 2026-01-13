from django.shortcuts import render

import os
import face_recognition

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from appUsuario.models import Usuario

from appVisitas.views import guardar_visita
import time


@csrf_exempt
def detectar(request):
    if request.method != 'POST':
        return JsonResponse({'ok': False, 'mensaje': 'Método no permitido'}, status=405)

    imagen = request.FILES.get('imagen')
    if not imagen:
        return JsonResponse({'ok': False, 'mensaje': 'No se envió ninguna imagen'}, status=400)

    # Guardar temporal
    tmp_dir = os.path.join(settings.BASE_DIR, 'tmp')
    os.makedirs(tmp_dir, exist_ok=True)
    tmp_path = os.path.join(tmp_dir, 'frame.jpg')
    
    with open(tmp_path, 'wb') as f:
        for chunk in imagen.chunks():
            f.write(chunk)

    # Cargar imagen y extraer vector
    image = face_recognition.load_image_file(tmp_path)
    encodings = face_recognition.face_encodings(image)

    if not encodings:
        os.remove(tmp_path)
        return JsonResponse({'ok': True, 'nombre': None})  # no se detectó rostro

    rostro_actual = encodings[0]
        
        # Comparar con vectores de la base de datos
    usuarios = Usuario.objects.all()
    usuario_detectado = None

    for u in usuarios:
        vector = u.rostro_vector  # ya está guardado como lista
        match = face_recognition.compare_faces([vector], rostro_actual, tolerance=0.8)
        if match[0]:
            usuario_detectado = u
            break
    
    # Conocido
    if usuario_detectado:
        guardar_visita(
            usuario_detectado.nombre,
            usuario_detectado.apellido,
            usuario_detectado.dni
        )

        os.remove(tmp_path)

        return JsonResponse({
            'ok': True,
            'nombre': usuario_detectado.nombre
        })
    
    # Desconocido            
    desc_dir = os.path.join(settings.BASE_DIR, 'desc')
    os.makedirs(desc_dir, exist_ok=True)

    fecha = int(time.time())
    nombre_archivo = f"desconocido_{fecha}.jpg"
    desc_path = os.path.join(desc_dir, nombre_archivo)

    os.rename(tmp_path, desc_path)

    guardar_visita(
        nombre="Desconocido",
        apellido="Desconocido",
        dni=str(fecha)
    )
        
    return JsonResponse({'ok': True, 'nombre': 'Desconocido'})
