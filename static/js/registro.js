function validarFormulario() {
    const campos = [
        { id: "nombre", nombre: "Nombre" },
        { id: "apellido", nombre: "Apellido" },
        { id: "dni", nombre: "DNI" },
        { id: "correo", nombre: "Correo" },
        { id: "telefono", nombre: "Teléfono" },
        { id: "departamento", nombre: "Departamento" }
    ];

    // Validar campos vacíos
    for (let campo of campos) {
        const input = document.getElementById(campo.id);
        const valor = input.value.trim();

        if (valor === "") {
                showStatus(`El campo ${campo.nombre} no puede estar vacío`, 3500);
            input.focus();
            return false;
        }
    }

    // Validar DNI (8 dígitos)
    const dni = document.getElementById("dni").value.trim();
    if (!/^\d{8}$/.test(dni)) {
            showStatus("El DNI debe tener exactamente 8 dígitos numéricos", 3500);
        document.getElementById("dni").focus();
        return false;
    }

    // Validar correo
    const correo = document.getElementById("correo").value.trim();
    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!correoRegex.test(correo)) {
            showStatus("Ingresa un correo electrónico válido", 3500);
        document.getElementById("correo").focus();
        return false;
    }

    // validar telefono (9 digistos)
    const telefono = document.getElementById("telefono").value.trim();
    if (!/^\d{9}$/.test(telefono)) {
            showStatus("El teléfono debe tener exactamente 9 dígitos numéricos", 3500);
        document.getElementById("telefono").focus();
        return false;
    }

    return true;
}


function guardarUsuario() {

    if (!validarFormulario()) return;

    if (!ultimaImagenBlob) {
            showStatus("Debes capturar la imagen primero", 3500);
        return;
    }

    const formData = new FormData();
    formData.append('imagen', ultimaImagenBlob, 'rostro.jpg');

    const campos = ["nombre", "apellido", "dni", "correo", "telefono", "departamento"];
    campos.forEach(id => {
        formData.append(id, document.getElementById(id).value.trim());
    });

    fetch('/guardar/', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
            showStatus(data.mensaje, 3500);
        if (data.ok) {
            document.getElementById('formRegistro').reset();
            cancelarCamara();
        }
    })
    .catch(err => {
        console.error(err);
            showStatus('Error al guardar usuario', 4500);
    });
}

