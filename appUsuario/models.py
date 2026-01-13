from django.db import models

# Create your models here.

class Usuario(models.Model):
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    dni = models.CharField(max_length=8, unique=True)
    correo = models.CharField(max_length=40, unique=True)
    telefono = models.CharField(max_length=9, unique=True)
    departamento = models.CharField(max_length=100)
    rostro_vector = models.JSONField()
    creado = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'Usuario'
        
        
    def __str__(self):
        return self.nombre