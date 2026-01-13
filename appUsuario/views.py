from django.shortcuts import render

import os
import face_recognition
from django.conf import settings
import time
from PIL import Image, ImageOps
import numpy as np

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import IntegrityError
from .models import Usuario

@csrf_exempt  # por ahora, para aprender
def guardar_usuario(request):
    if request.method == 'POST':
        try:
            # Obtenemos datos del formulario
            nombre = request.POST.get('nombre')
            apellido = request.POST.get('apellido')
            dni = request.POST.get('dni')
            correo = request.POST.get('correo')
            telefono = request.POST.get('telefono')
            departamento = request.POST.get('departamento')
            imagen = request.FILES.get('imagen')

            if not imagen:
                return JsonResponse({'ok': False, 'mensaje': 'No se envió ninguna imagen'}, status=400)

            # Guardar imagen temporalmente (en carpeta tmp/ del proyecto)
            tmp_dir = os.path.join(settings.BASE_DIR, 'tmp')
            os.makedirs(tmp_dir, exist_ok=True)

            # nombre temporal único
            tmp_path = os.path.join(tmp_dir, f'tmp_{int(time.time())}.jpg')
            with open(tmp_path, 'wb') as f:
                for chunk in imagen.chunks():
                    f.write(chunk)

            # Extraer vector del rostro
            image = face_recognition.load_image_file(tmp_path)
            encodings = face_recognition.face_encodings(image)

            # Si no se detecta rostro, intentar preprocesado (autocontrast + reescalado) y reintentar
            debug_note = None
            if not encodings:
                try:
                    pil = Image.fromarray(image)
                    # Autocontrast
                    pil2 = ImageOps.autocontrast(pil)
                    # Reescalar al doble de tamaño para mejorar detección
                    w,h = pil2.size
                    pil2 = pil2.resize((int(w*1.5), int(h*1.5)))
                    arr = np.array(pil2)
                    encodings = face_recognition.face_encodings(arr)
                    if encodings:
                        debug_note = 'Preprocesado: autocontrast + reescalado'
                    else:
                        # guardar imagen para inspección
                        bad_path = os.path.join(tmp_dir, f'no_face_{int(time.time())}.jpg')
                        try:
                            os.rename(tmp_path, bad_path)
                        except Exception:
                            bad_path = tmp_path
                        return JsonResponse({'ok': False, 'mensaje': 'No se detectó rostro', 'debug_imagen': bad_path}, status=400)
                except Exception as e:
                    # en caso de error en preprocesado, conservar imagen y reportar
                    bad_path = os.path.join(tmp_dir, f'no_face_{int(time.time())}.jpg')
                    try:
                        os.rename(tmp_path, bad_path)
                    except Exception:
                        bad_path = tmp_path
                    return JsonResponse({'ok': False, 'mensaje': 'No se detectó rostro', 'debug_imagen': bad_path, 'debug_error': str(e)}, status=400)

            # Borrar imagen temporal (solo si se detectó rostro)
            try:
                os.remove(tmp_path)
            except Exception:
                pass

            rostro_vector = encodings[0].tolist()  # Convertir a lista para JSONField

            # Guardar usuario con vector
            Usuario.objects.create(
                nombre=nombre,
                apellido=apellido,
                dni=dni,
                correo=correo,
                telefono=telefono,
                departamento=departamento,
                rostro_vector=rostro_vector
            )

            return JsonResponse({'ok': True, 'mensaje': 'Usuario registrado correctamente'})

        except IntegrityError:
            return JsonResponse({'ok': False, 'mensaje': 'El DNI, correo o teléfono ya existen'}, status=400)

        except Exception as e:
            return JsonResponse({'ok': False, 'mensaje': f'Error interno: {str(e)}'}, status=500)

    return JsonResponse({'ok': False, 'mensaje': 'Método no permitido'}, status=405)


def listar_usuarios(request):
    usuarios = Usuario.objects.all()

    data = []
    for u in usuarios:
        data.append({
            "nombre": u.nombre,
            "apellido": u.apellido,
            "dni": u.dni,
            "correo": u.correo,
            "departamento": u.departamento,
            "fecha": u.creado.strftime("%Y-%m-%d %H:%M:%S")
        })

    return JsonResponse({"usuarios": data})