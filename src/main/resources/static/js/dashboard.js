
const URL_BASE = "http://localhost:8080"

const listarCards = () => {
    const fecha = document.getElementById("adminDate").value;
    const tarjetasSoli = document.getElementById('pendientesAccept');
    const contadorDashboard = document.getElementById('contadores_dashboard');


    Promise.all([
        fetch(`${URL_BASE}/dashboard/listar_solis_fecha?fecha=${fecha.toString()}`),
        fetch(`${URL_BASE}/dashboard/listar_contadores_fecha?fecha=${fecha.toString()}`)
    ])
        .then(([resSoli, resConta]) => {
            if (!resSoli.ok || !resConta.ok) throw new Error('Error en el servidor');
            return Promise.all([resSoli.text(), resConta.text()]);
        })
        .then(([solicitudes, contadores]) => {
            tarjetasSoli.innerHTML = solicitudes;
            contadorDashboard.innerHTML = contadores;
        })
        .catch(r => console.error(r))
}

const confirmarPago = (idReserva) => {
    const metodoPago = document.getElementById("metPago").value;

    fetch(`/api/reserva/aceptar_soli`, {
        method: "PATCH",
        body: JSON.stringify({
            "idEstado": 2,
            idReserva,
            "metodoPago": metodoPago.toString()
        }),
        headers: {
            "Content-Type": "application/json"
        }
    })
        .then(arr => listarCards())
        .catch(er => alert(er));
}

const denegarSolicitud = (idReserva) => {
    // fetch(`/api/reserva/denegar_soli/${idReserva}`, {
    fetch(`/api/reserva/actualizar_estados?id_estado=5&id_reserva=${idReserva}`, {
        method : "PATCH",
        headers: {
            "Content-Type": "application/json"
        }
    })
        .then(arr => listarCards())
        .catch(er => alert(er));
}


document.getElementById("modalAceptarSoli").addEventListener('click', () => {
    const btnAceptarSoli = document.getElementById("btnAceptarSoli");
    const idTarjeta = btnAceptarSoli.getAttribute('reserva-id');
    const modalElement = document.getElementById("confirmarSolicitud");

    const modal = bootstrap.Modal.getInstance(modalElement);
    modal.hide();

    confirmarPago(idTarjeta);

})
document.getElementById("modalDenegarSoli").addEventListener('click', () => {
    const btnDenegarSoli = document.getElementById("btnDenegarSoli");
    const idTarjeta = btnDenegarSoli.getAttribute('reserva-id');
    const modalElement = document.getElementById("denegarSolicitud");

    const modal = bootstrap.Modal.getInstance(modalElement);
    modal.hide();

    denegarSolicitud(idTarjeta);

})
