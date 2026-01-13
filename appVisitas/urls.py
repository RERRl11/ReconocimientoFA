from django.urls import path
from .views import listar_visitas

urlpatterns = [
    path('visitas/', listar_visitas)
]