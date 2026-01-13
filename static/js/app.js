// para cambiar de seccion
function mostrar(id) {
    // Oculta todas las secciones
    const secciones = document.querySelectorAll('.seccion');
    secciones.forEach(sec => {
        sec.classList.add('hidden');
    });

    // Muestra la sección seleccionada
    const sel = document.getElementById(id);
    if (sel) sel.classList.remove('hidden');

    // Resalta el botón de navegación activo
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.nav-btn[data-target="${id}"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

// Inicializa vista por defecto
document.addEventListener('DOMContentLoaded', () => {
    mostrar('principal');
});

// Añadir efecto fade-in cuando se muestra una sección
const originalMostrar = mostrar;
function mostrarConAnimacion(id){
    originalMostrar(id);
    const sel = document.getElementById(id);
    if (sel){
        sel.classList.add('fade-in');
        sel.addEventListener('animationend', ()=> sel.classList.remove('fade-in'), {once:true});
    }
}

// Reemplaza la función global cambiarSeccion para usar animación
function cambiarSeccion(id){
    mostrarConAnimacion(id);
    // Asegurar que no queden cámaras activas
    cancelarCamara();
    cancelarDeteccion();

    // Iniciar cámaras automáticamente según sección
    if (id === 'registro') {
        iniciarCamara();
    } else if (id === 'detectar') {
        iniciarDeteccion();
    } else if (id === 'datos') {
        cargarUsuarios();
        cargarVisitas();
    }
}

// Estado visual simple
function showStatus(msg, timeout=2500){
    const el = document.getElementById('appStatus');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(()=> el.classList.remove('show'), timeout);
}

// Cámara seleccionada por el usuario (deviceId)
let currentCameraId = null;

function toggleCameraPanel(){
    const panel = document.getElementById('cameraPanel');
    if (!panel) return;
    const opening = panel.classList.contains('hidden');
    panel.classList.toggle('hidden');
    if (opening) {
        // al abrir, detectar cámaras automáticamente
        enumerarCamaras();
    }
}

async function enumerarCamaras(){
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices){
        showStatus('Tu navegador no soporta listar dispositivos', 4000);
        return;
    }

    try{
        let devices = await navigator.mediaDevices.enumerateDevices();
        let cams = devices.filter(d => d.kind === 'videoinput');
        // algunos navegadores sólo muestran labels después de permitir la cámara
        const anyHasLabel = cams.some(c => c.label && c.label.length>0);
        if (!anyHasLabel && navigator.mediaDevices.getUserMedia){
            // pedir permiso temporalmente para obtener labels
            try{
                const tmpStream = await navigator.mediaDevices.getUserMedia({video:true});
                tmpStream.getTracks().forEach(t=>t.stop());
                // re-enumerar
                devices = await navigator.mediaDevices.enumerateDevices();
                cams = devices.filter(d => d.kind === 'videoinput');
            }catch(e){
                console.warn('No se pudo pedir permiso temporalmente', e);
            }
        }
        const select = document.getElementById('cameraSelect');
        select.innerHTML = '';
        if (cams.length === 0){
            const opt = document.createElement('option'); opt.textContent = 'No se encontraron cámaras'; opt.value=''; select.appendChild(opt);
            showStatus('No se encontraron cámaras', 3000);
            return;
        }
        cams.forEach((c, i)=>{
            const opt = document.createElement('option');
            // Mostrar label si está disponible, si no mostrar índice
            opt.textContent = c.label || `Cámara ${i+1}`;
            opt.value = c.deviceId || '';
            select.appendChild(opt);
        });
        // seleccionar la cámara actual si existe
        if (currentCameraId){
            select.value = currentCameraId;
        }
        showStatus(`${cams.length} cámaras encontradas`, 2500);
    }catch(e){
        console.error('enumerarCamaras', e);
        showStatus('Error al listar cámaras', 4000);
    }
}

function seleccionarCamara(){
    const select = document.getElementById('cameraSelect');
    if (!select) return;
    currentCameraId = select.value || null;
    showStatus('Cámara seleccionada', 1400);
    // Reiniciar la cámara activa según sección visible
    const registroVisible = !document.getElementById('registro').classList.contains('hidden');
    const detectarVisible = !document.getElementById('detectar').classList.contains('hidden');
    if (registroVisible){
        cancelarCamara();
        iniciarCamara();
    }
    if (detectarVisible){
        cancelarDeteccion();
        iniciarDeteccion();
    }
}

async function queryPermission(name){
    if (!navigator.permissions) return null;
    try{
        const status = await navigator.permissions.query({name});
        return status.state; // 'granted'|'prompt'|'denied'
    }catch(e){
        return null;
    }
}

// camara de registro

let stream = null;
let ultimaImagenBlob = null; 

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');


const btnCapturar = document.getElementById('btnCapturar');
const btnCancelar = document.getElementById('btnCancelar');
const btnReintentar = document.getElementById('btnReintentar');

function iniciarCamara() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
        showStatus('Tu navegador no soporta cámara', 4000);
        console.error('mediaDevices.getUserMedia no soportado');
        return;
    }

    showStatus('Solicitando acceso a la cámara...');
    console.log('Iniciando cámara de registro...');

    const constraints = currentCameraId ? { video: { deviceId: { exact: currentCameraId } } } : { video: true };
    navigator.mediaDevices.getUserMedia(constraints)
        .then(async s => {
            stream = s;
            video.srcObject = stream;
            // Intentar reproducir (algunos navegadores bloquean autoplay)
            try{ await video.play(); }catch(e){ console.warn('video.play() bloqueado', e); }

            // Mostrar video y botones de captura
            video.classList.remove('hidden');
            canvas.classList.add('hidden');
            if (btnCapturar) btnCapturar.classList.remove('hidden');
            if (btnCancelar) btnCancelar.classList.remove('hidden');
            if (btnReintentar) btnReintentar.classList.add('hidden');

            showStatus('Cámara activada', 1200);
        })
        .catch(async (err) => {
            console.error('Error getUserMedia:', err);
            const perm = await queryPermission('camera');
            if (perm === 'denied'){
                showStatus('Permiso de cámara denegado. Revisa los permisos del navegador.', 6000);
            } else {
                showStatus('No se pudo acceder a la cámara (error).', 6000);
            }
        });
}

function capturar() {
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Actualizar UI inmediatamente
    canvas.classList.remove('hidden');
    video.classList.add('hidden');
    if (btnCapturar) btnCapturar.classList.add('hidden');
    if (btnCancelar) btnCancelar.classList.add('hidden');
    if (btnReintentar) btnReintentar.classList.remove('hidden');

    // Convertir el canvas a dataURL y a Blob de forma síncrona
    try{
        const dataURL = canvas.toDataURL('image/jpeg');
        // convertir dataURL a Blob
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        ultimaImagenBlob = new Blob([u8arr], {type:mime});
        console.log('Imagen capturada y lista para enviar (sync)');
    }catch(e){
        // Fallback a toBlob si falla
        canvas.toBlob(blob => {
            ultimaImagenBlob = blob;
            console.log('Imagen capturada y lista para enviar (async)');
        }, 'image/jpeg');
    }
}

function reiniciarCaptura() {
    canvas.classList.add('hidden');
    ultimaImagenBlob = null;

    // Si la cámara está detenida, reiniciarla; si está activa, solo mostrar video
    if (!stream) {
        iniciarCamara();
    } else {
        video.classList.remove('hidden');
        if (btnCapturar) btnCapturar.classList.remove('hidden');
        if (btnCancelar) btnCancelar.classList.remove('hidden');
        if (btnReintentar) btnReintentar.classList.add('hidden');
    }
}

function cancelarCamara() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    // Ocultar elementos relacionados con la captura
    if (video) video.classList.add('hidden');
    if (canvas) canvas.classList.add('hidden');

    if (btnCapturar) btnCapturar.classList.add('hidden');
    if (btnCancelar) btnCancelar.classList.add('hidden');
    if (btnReintentar) btnReintentar.classList.add('hidden');

    ultimaImagenBlob = null;
}

// camara de deteccion
let streamDetectar = null;
let intervaloDeteccion = null;

const videoDetectar = document.getElementById('videoDetectar');
const estado = document.getElementById('estado');

function iniciarDeteccion() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
        showStatus('Tu navegador no soporta cámara', 4000);
        return;
    }

    showStatus('Solicitando acceso a la cámara para detección...');
    console.log('Iniciando cámara de detección...');

    const constraints = currentCameraId ? { video: { deviceId: { exact: currentCameraId } } } : { video: true };
    navigator.mediaDevices.getUserMedia(constraints)
        .then(async s => {
            streamDetectar = s;
            videoDetectar.srcObject = streamDetectar;
            try{ await videoDetectar.play(); }catch(e){ console.warn('videoDetectar.play() bloqueado', e); }

            // Mostrar video y actualizar estado
            if (videoDetectar) videoDetectar.classList.remove('hidden');
            if (estado) estado.innerHTML = '<strong>Estado: Activo</strong> – detección cada 3 segundos';

            intervaloDeteccion = setInterval(() => {
                console.log('Enviando frame al backend...');
                const canvasTmp = document.createElement('canvas');
                canvasTmp.width = videoDetectar.videoWidth || 320;
                canvasTmp.height = videoDetectar.videoHeight || 240;
                const ctx = canvasTmp.getContext('2d');
                ctx.drawImage(videoDetectar, 0, 0, canvasTmp.width, canvasTmp.height);

                // Convertir a Blob
                canvasTmp.toBlob(blob => {
                    const formData = new FormData();
                    formData.append('imagen', blob, 'frame.jpg');

                    //  Enviar al backend
                    fetch('/detectar/', {
                        method: 'POST',
                        body: formData
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.ok && data.nombre) {
                            mostrarNotificacion(data.nombre);
                        }
                    })
                    .catch(err => console.error(err));

                }, 'image/jpeg');
            }, 3000);

            showStatus('Detección activa', 1200);
        })
        .catch(async (err) => {
            console.error('Error getUserMedia (detección):', err);
            const perm = await queryPermission('camera');
            if (perm === 'denied'){
                showStatus('Permiso de cámara denegado. Revisa permisos.', 6000);
            } else {
                showStatus('No se pudo acceder a la cámara (error).', 6000);
            }
        });
}

function cancelarDeteccion() {
    if (streamDetectar) {
        streamDetectar.getTracks().forEach(track => track.stop());
        streamDetectar = null;
    }

    clearInterval(intervaloDeteccion);
    if (videoDetectar) videoDetectar.classList.add('hidden');
    if (estado) estado.innerHTML = '<strong>Estado: Inactivo</strong>';
}





