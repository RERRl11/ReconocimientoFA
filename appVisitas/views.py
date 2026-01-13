from django.shortcuts import render

# Create your views here.

from django.http import JsonResponse
from appVisitas.models import Visita

def guardar_visita(nombre, apellido, dni):
    Visita.objects.create(
        nombre=nombre,
        apellido=apellido,
        dni=dni
    )

def listar_visitas(request):
    visitas = Visita.objects.all()

    data = []
    for v in visitas:
        data.append({
            "nombre": v.nombre,
            "apellido": v.apellido,
            "dni": v.dni,
            "fecha": v.creado.strftime("%Y-%m-%d %H:%M:%S")
        })

    return JsonResponse({"visitas": data})