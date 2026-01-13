from django.db import models

# Create your models here.

class Visita(models.Model):
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    dni = models.CharField(max_length=15)
    creado = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'Visitas'
        
    def __str__(self):
        return f"{self.nombre} {self.apellido}"