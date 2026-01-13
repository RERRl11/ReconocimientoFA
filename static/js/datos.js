function cargarUsuarios() {
    fetch("/usuarios/")
        .then(response => response.json())
        .then(data => {
            const usuarios = data.usuarios;

            const tbody = document.getElementById("usuariosBody");
            const tabla = document.getElementById("tablaUsuarios");
            const vacio = document.getElementById("usuariosVacio");
            const total = document.getElementById("totalUsuarios");

            tbody.innerHTML = "";
            total.textContent = usuarios.length;

            if (usuarios.length === 0) {
                tabla.style.display = "none";
                vacio.style.display = "block";
                return;
            }

            vacio.style.display = "none";
            tabla.style.display = "table";

            usuarios.forEach(u => {
                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td>${u.nombre}</td>
                    <td>${u.apellido}</td>
                    <td>${u.dni}</td>
                    <td>${u.correo}</td>
                    <td>${u.departamento}</td>
                    <td>${u.fecha}</td>
                `;
                tbody.appendChild(fila);
            });
        })
        .catch(error => {
            console.error("Error cargando usuarios:", error);
        });
}

function cargarVisitas() {
    fetch("/visitas/")
        .then(response => response.json())
        .then(data => {
            const visitas = data.visitas;

            const tbody = document.getElementById("visitasBody");
            const tabla = document.getElementById("tablaVisitas");
            const vacio = document.getElementById("visitasVacio");
            const total = document.getElementById("totalVisitas");

            tbody.innerHTML = "";
            total.textContent = visitas.length;

            if (visitas.length === 0) {
                tabla.style.display = "none";
                vacio.style.display = "block";
                return;
            }

            vacio.style.display = "none";
            tabla.style.display = "table";

            visitas.forEach(v => {
                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td>${v.nombre}</td>
                    <td>${v.apellido}</td>
                    <td>${v.dni}</td>
                    <td>${v.fecha}</td>
                `;
                tbody.appendChild(fila);
            });
        })
        .catch(error => {
            console.error("Error cargando visitas:", error);
        });
}