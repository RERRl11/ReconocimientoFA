function mostrarNotificacion(nombre) {
    if (!nombre) return; // no mostrar si es desconocido
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = `Detectado: ${nombre}`;
    document.body.appendChild(toast);

    // Animación de entrada usando clases CSS
    setTimeout(() => toast.classList.add('show'), 50);

    // Desaparece después de 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { try{ document.body.removeChild(toast);}catch(e){} }, 300);
    }, 3000);
}
