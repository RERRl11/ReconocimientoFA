from django.urls import path
from .views import guardar_usuario, listar_usuarios

urlpatterns = [
    path('guardar/', guardar_usuario),
    path('usuarios/', listar_usuarios)
]
