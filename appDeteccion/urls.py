from django.urls import path
from .views import detectar

urlpatterns = [
    path('detectar/', detectar, name='detectar'),
]
