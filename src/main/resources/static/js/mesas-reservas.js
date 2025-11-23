// // mesas-reservas.js
// const STATE_CLASS_MAP = {
//     'Libre': 'estado-libre',
//     'Solicitada': 'estado-solicitada',
//     'Reservada': 'estado-reservada',
//     'Ocupada': 'estado-ocupada',
//     'Mantenimiento': 'estado-mantenimiento'
// };
//
// let mesasGlob = []; // cache simple
//
// document.addEventListener('DOMContentLoaded', () => {
//     cargarMesas();
//     setupBotonesHeader();
// });
//
// function setupBotonesHeader() {
//     const dashboardBtn = document.getElementById('dashboardBtn');
//     const logoutBtn = document.getElementById('logoutBtn');
//
//     if (dashboardBtn) {
//         dashboardBtn.addEventListener('click', () => {
//             window.location.href = '/dashboard';
//         });
//     }
//
//     if (logoutBtn) {
//         logoutBtn.addEventListener('click', () => {
//             const form = document.createElement('form');
//             form.method = 'POST';
//             form.action = '/logout';
//             document.body.appendChild(form);
//             form.submit();
//         });
//     }
// }
//
// function cargarMesas() {
//     fetch('/api/mesa/listar')
//         .then(r => {
//             if (!r.ok) throw new Error('Error cargando mesas');
//             return r.json();
//         })
//         .then(data => {
//             mesasGlob = data;
//             renderMesasMap(data);
//         })
//         .catch(err => {
//             console.error(err);
//             const mapEl = document.getElementById('mesasMap');
//             if (mapEl) {
//                 mapEl.innerHTML = '<div class="empty-state">No se pudieron cargar las mesas.</div>';
//             }
//         });
// }
//
// function renderMesasMap(mesas) {
//     const mapEl = document.getElementById('mesasMap');
//     if (!mapEl) return;
//
//     mapEl.innerHTML = '';
//
//     const container = document.createElement('div');
//     container.style.display = 'flex';
//     container.style.flexWrap = 'wrap';
//     container.style.gap = '8px';
//
//     mesas.forEach(mesa => {
//         const div = document.createElement('div');
//         const claseEstado = STATE_CLASS_MAP[mesa.estado] || 'estado-libre';
//
//         div.className = `mesa ${claseEstado}`;
//         div.tabIndex = 0;
//         div.style.cursor = 'pointer';
//
//         const icon = mesa.estado === 'Libre' ? '✅'
//             : mesa.estado === 'Solicitada' ? '🟢'
//                 : mesa.estado === 'Reservada' ? '🔴'
//                     : mesa.estado === 'Ocupada' ? '🟠'
//                         : '⚠️';
//
//         div.innerHTML = `
//       <div style="font-weight:bold;display:flex;align-items:center;gap:4px">
//         <span>${icon}</span>
//         <span>Mesa ${mesa.numMesa}</span>
//       </div>
//       <div style="font-size:0.75rem;margin-top:4px;text-align:center">
//         Cap.: ${capacidadTexto(mesa.capacidad)}
//       </div>
//     `;
//
//         div.addEventListener('click', () => onMesaClick(mesa.numMesa));
//         div.addEventListener('keydown', (e) => {
//             if (e.key === 'Enter') onMesaClick(mesa.numMesa);
//         });
//
//         container.appendChild(div);
//     });
//
//     mapEl.appendChild(container);
// }
//
// function capacidadTexto(cap) {
//     switch (cap) {
//         case 'DOS': return '2 personas';
//         case 'CUATRO': return '4 personas';
//         case 'SEIS': return '6 personas';
//         case 'OCHO': return '8 personas';
//         default: return cap;
//     }
// }
//
// function onMesaClick(numMesa) {
//     const mesa = mesasGlob.find(m => m.numMesa === numMesa);
//     if (!mesa) return;
//
//     const modal = document.getElementById('tableOptionsModal');
//     const info = document.getElementById('tableOptInfo');
//     const select = document.getElementById('tableStateSelect');
//     const maintWrap = document.getElementById('maintUntilWrap');
//
//     if (!modal || !info || !select) return;
//
//     info.textContent = `Mesa ${mesa.numMesa} — Capacidad ${capacidadTexto(mesa.capacidad)}`;
//
//     // Solo manejamos manualmente estos 3
//     if (mesa.estado === 'Libre')      select.value = 'libre';
//     else if (mesa.estado === 'Ocupada')      select.value = 'ocupada';
//     else if (mesa.estado === 'Mantenimiento') select.value = 'mantenimiento';
//     else select.value = 'libre';
//
//     maintWrap.style.display = select.value === 'mantenimiento' ? 'block' : 'none';
//
//     select.onchange = () => {
//         maintWrap.style.display = select.value === 'mantenimiento' ? 'block' : 'none';
//     };
//
//     document.getElementById('tableOptCancel').onclick = () => {
//         modal.style.display = 'none';
//     };
//
//     document.getElementById('tableOptSave').onclick = () => {
//         const val = select.value; // 'libre' | 'ocupada' | 'mantenimiento'
//         let nombreEstado;
//
//         if (val === 'libre') nombreEstado = 'Libre';
//         else if (val === 'ocupada') nombreEstado = 'Ocupada';
//         else nombreEstado = 'Mantenimiento';
//
//         fetch(`/api/mesa/${mesa.numMesa}/estado`, {
//             method: 'PATCH',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({ nombreEstado })
//         })
//             .then(r => {
//                 if (!r.ok) throw new Error('Error actualizando mesa');
//                 return r.json();
//             })
//             .then(updated => {
//                 // Actualizamos cache y re-render
//                 const idx = mesasGlob.findIndex(m => m.numMesa === updated.numMesa);
//                 if (idx !== -1) mesasGlob[idx] = updated;
//                 renderMesasMap(mesasGlob);
//                 modal.style.display = 'none';
//             })
//             .catch(err => {
//                 console.error(err);
//                 alert('No se pudo actualizar el estado de la mesa.');
//             });
//     };
//
//     modal.style.display = 'flex';
// }


// mesas-reservas.js — Mesas + Reservas integradas con tu backend

'use strict';

/* ==========================
   Constantes y estado global
   ========================== */

// Estados visuales de MESA → clases CSS
const STATE_CLASS_MAP = {
    'Libre': 'estado-libre',
    'Solicitada': 'estado-solicitada',
    'Reservada': 'estado-reservada',
    'Ocupada': 'estado-ocupada',
    'Mantenimiento': 'estado-mantenimiento'
};

// Catálogo de estados de RESERVA (según tu tabla estado.tipo = "RESERVA")
const ESTADOS_RESERVA_BY_ID = {
    1: { code: 'pago_pendiente',     nombre: 'Pago pendiente' },
    2: { code: 'reserva_programada', nombre: 'Reserva programada' },
    3: { code: 'cancelado_expirado', nombre: 'Cancelado - Expirado' },
    4: { code: 'cancelado_cliente',  nombre: 'Cancelado - Cliente' },
    5: { code: 'cancelado_inconv',   nombre: 'Cancelado - Inconveniente' },
    6: { code: 'reserva_en_curso',   nombre: 'Reserva en curso' },
    7: { code: 'reserva_finalizada', nombre: 'Reserva finalizada' },
    8: { code: 'cancelado_no_show',  nombre: 'Cancelado - No show' }
};

let MESAS = [];    // [{ id, capacidad, estado, color }]
let RESERVAS = []; // reservas mapeadas al formato de UI

const LIMA_TZ = 'America/Lima';

/* ==========================
   Utilidades de tiempo / formato
   ========================== */

function nowLima() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: LIMA_TZ }));
}

function todayIsoLima() {
    const n = nowLima();
    return (
        n.getFullYear() +
        '-' +
        String(n.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(n.getDate()).padStart(2, '0')
    );
}

function nowSlotHHMMLima() {
    const n = nowLima();
    return String(n.getHours()).padStart(2, '0') + ':00';
}

function limaDateTime(iso, hhmm) {
    return new Date(iso + 'T' + hhmm + ':00-05:00');
}

function slotDisplay(s) {
    if (!s) return '-';
    const [hStr, mStr] = s.split(':');
    const hh = parseInt(hStr, 10);
    const mm = parseInt(mStr, 10);
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    return (
        h12 +
        ':' +
        (mm < 10 ? '0' : '') +
        mm +
        ' ' +
        (hh < 12 ? 'AM' : 'PM')
    );
}

function formatDate(dateStr) {
    const d = limaDateTime(dateStr, '00:00');
    return d.toLocaleDateString('es-PE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/* ==========================
   Mapeos API → UI
   ========================== */

function mapEstadoReservaFromId(id) {
    const meta = ESTADOS_RESERVA_BY_ID[id];
    if (!meta) {
        return { code: 'desconocido', nombre: 'Desconocido' };
    }
    return meta;
}

// MesaDTO desde backend: { id, capacidad, estado, color }
function capacidadTexto(cap) {
    switch (cap) {
        case 'DOS':    return '2 personas';
        case 'CUATRO': return '4 personas';
        case 'SEIS':   return '6 personas';
        case 'OCHO':   return '8 personas';
        default:       return cap;
    }
}

function capacidadNumero(cap) {
    switch (cap) {
        case 'DOS':    return 2;
        case 'CUATRO': return 4;
        case 'SEIS':   return 6;
        case 'OCHO':   return 8;
        default:
            const n = parseInt(cap, 10);
            return isNaN(n) ? 0 : n;
    }
}

function mapMesaApiToUi(mApi) {
    return {
        id: mApi.id,
        capacidad: mApi.capacidad,  // "DOS", "CUATRO", etc.
        estado: mApi.estado,        // "Libre", "Ocupada", "Mantenimiento"...
        color: mApi.color
    };
}

// Reserva desde backend (ejemplo que enviaste)
function mapReservaApiToUi(rApi) {
    const estadoId = rApi.estado && typeof rApi.estado.id === 'number'
        ? rApi.estado.id
        : null;

    const est = mapEstadoReservaFromId(estadoId);

    return {
        id: rApi.id,
        cod: rApi.codigo,
        comentarios: rApi.comentarios,
        dni: rApi.dniCliente,
        correo: rApi.emailContacto,
        expira: rApi.expira,
        fecha: rApi.fechaReserva,
        hora: rApi.horaReserva ? rApi.horaReserva.substring(0, 5) : null, // "15:00:00" → "15:00"
        metodoPago: rApi.metodoPago,
        garantia: rApi.montoGarantia,
        nombre: rApi.nombreCliente,
        apellido: rApi.apellidoCliente,
        personas: rApi.numeroPersonas,
        telefono: rApi.telCliente,

        estadoId: estadoId,
        estadoCode: est.code,
        estadoNombre: est.nombre,

        // si luego tu backend devuelve mesa:
        mesa: rApi.mesa ? rApi.mesa.id : (rApi.numMesa || null)
    };
}

/* ==========================
   Fetch de datos
   ========================== */

async function fetchJson(url, options) {
    const res = await fetch(url, options || {});
    if (!res.ok) {
        console.error('Error HTTP', res.status, 'en', url);
        throw new Error('HTTP ' + res.status);
    }
    return res.json();
}

async function cargarDatosDia(fechaIso) {
    try {
        const [mesasRes, reservasRes] = await Promise.all([
            fetchJson('/api/mesa/listar'),
            fetchJson('/api/reserva/listar_estado/0/' + encodeURIComponent(fechaIso))
        ]);

        MESAS = Array.isArray(mesasRes) ? mesasRes.map(mapMesaApiToUi) : [];
        RESERVAS = Array.isArray(reservasRes) ? reservasRes.map(mapReservaApiToUi) : [];

        renderMesasView();
    } catch (e) {
        console.error(e);
        const mapEl = document.getElementById('mesasMap');
        if (mapEl) {
            mapEl.innerHTML =
                '<div class="empty-state">No se pudieron cargar las mesas.</div>';
        }
        const resEl = document.getElementById('reservasDelDia');
        if (resEl) {
            resEl.innerHTML =
                '<div class="empty-state">No se pudieron cargar las reservas.</div>';
        }
    }
}

/* ==========================
   Setup inicial
   ========================== */

document.addEventListener('DOMContentLoaded', () => {
    setupBotonesHeader();

    const fechaInput = document.getElementById('mesasDate');
    if (fechaInput) {
        fechaInput.value = todayIsoLima();
        fechaInput.addEventListener('change', () => {
            cargarDatosDia(fechaInput.value);
        });
    }

    const filtroEstado = document.getElementById('reservasEstadoFilter');
    if (filtroEstado) {
        filtroEstado.addEventListener('change', renderReservasDelDia);
    }

    const fechaInicial = fechaInput ? fechaInput.value : todayIsoLima();
    cargarDatosDia(fechaInicial);
});

function setupBotonesHeader() {
    const dashboardBtn = document.getElementById('dashboardBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', () => {
            window.location.href = '/dashboard';
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/logout';
            document.body.appendChild(form);
            form.submit();
        });
    }
}

/* ==========================
   Vista principal
   ========================== */

function renderMesasView() {
    const fechaInput = document.getElementById('mesasDate');
    const fecha = fechaInput ? fechaInput.value : todayIsoLima();
    renderMesasMap(fecha);
    renderReservasDelDia();
}

/* ==========================
   Lógica de estado de MESA
   ========================== */

function estadoVisualMesa(mesa, reservas, fecha) {
    // 1. Mantenimiento siempre manda
    if (mesa.estado === 'Mantenimiento') return 'Mantenimiento';

    const targetSlot = nowSlotHHMMLima();

    // 2. Revisar reservas asociadas a esa mesa y fecha
    for (let i = 0; i < reservas.length; i++) {
        const r = reservas[i];
        if (r.mesa === mesa.id && r.fecha === fecha) {
            // En curso
            if (r.estadoId === 6) return 'Ocupada'; // Reserva en curso
            // Programada en el tramo actual
            if (r.estadoId === 2 && r.hora === targetSlot) return 'Reservada';
            // Pago pendiente en el tramo actual
            if (r.estadoId === 1 && r.hora === targetSlot) return 'Solicitada';
        }
    }

    // 3. Si backend ya marcó la mesa como ocupada
    if (mesa.estado === 'Ocupada') return 'Ocupada';

    // 4. Por defecto, Libre
    return 'Libre';
}

/* ==========================
   Render del mapa de mesas
   ========================== */

function renderMesasMap(fecha) {
    const mapEl = document.getElementById('mesasMap');
    if (!mapEl) return;

    mapEl.innerHTML = '';

    // Agrupar mesas por capacidad (2,4,6,8)
    const byCap = {};
    MESAS.forEach(m => {
        const numCap = capacidadNumero(m.capacidad);
        if (!byCap[numCap]) byCap[numCap] = [];
        byCap[numCap].push(m);
    });

    const capacidades = Object.keys(byCap)
        .map(Number)
        .sort((a, b) => a - b);

    capacidades.forEach(cap => {
        const header = document.createElement('div');
        header.className = 'location-header';
        header.textContent = `Mesas para ${cap} persona${cap > 1 ? 's' : ''}`;
        mapEl.appendChild(header);

        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexWrap = 'wrap';
        container.style.gap = '8px';

        byCap[cap].forEach(mesa => {
            const estadoNombre = estadoVisualMesa(mesa, RESERVAS, fecha);
            const claseEstado = STATE_CLASS_MAP[estadoNombre] || 'estado-libre';

            const div = document.createElement('div');
            div.className = `mesa ${claseEstado}`;
            div.tabIndex = 0;
            div.style.cursor = 'pointer';

            const icon =
                estadoNombre === 'Libre'       ? '✅' :
                    estadoNombre === 'Solicitada'  ? '🟢' :
                        estadoNombre === 'Reservada'   ? '🔴' :
                            estadoNombre === 'Ocupada'     ? '🟠' :
                                '⚠️';

            div.innerHTML = `
        <div style="font-weight:bold;display:flex;align-items:center;gap:4px">
          <span>${icon}</span>
          <span>Mesa ${mesa.id}</span>
        </div>
        <div style="font-size:0.75rem;margin-top:4px;text-align:center">
          Cap.: ${capacidadTexto(mesa.capacidad)}
        </div>
      `;

            div.addEventListener('click', () => onMesaClick(mesa.id));
            div.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') onMesaClick(mesa.id);
            });

            container.appendChild(div);
        });

        mapEl.appendChild(container);
    });
}

/* ==========================
   Click en mesa + modal de estado manual
   ========================== */

function onMesaClick(idMesa) {
    const mesa = MESAS.find(m => m.id === idMesa);
    if (!mesa) return;

    const modal = document.getElementById('tableOptionsModal');
    const info = document.getElementById('tableOptInfo');
    const select = document.getElementById('tableStateSelect');
    const maintWrap = document.getElementById('maintUntilWrap');

    if (!modal || !info || !select) return;

    info.textContent = `Mesa ${mesa.id} — Capacidad ${capacidadTexto(mesa.capacidad)}`;

    if (mesa.estado === 'Libre')              select.value = 'libre';
    else if (mesa.estado === 'Ocupada')       select.value = 'ocupada';
    else if (mesa.estado === 'Mantenimiento') select.value = 'mantenimiento';
    else                                      select.value = 'libre';

    maintWrap.style.display =
        select.value === 'mantenimiento' ? 'block' : 'none';

    select.onchange = () => {
        maintWrap.style.display =
            select.value === 'mantenimiento' ? 'block' : 'none';
    };

    document.getElementById('tableOptCancel').onclick = () => {
        modal.style.display = 'none';
    };

    document.getElementById('tableOptSave').onclick = () => {
        const val = select.value; // 'libre' | 'ocupada' | 'mantenimiento'
        let nombreEstado;

        if (val === 'libre')       nombreEstado = 'Libre';
        else if (val === 'ocupada')nombreEstado = 'Ocupada';
        else                       nombreEstado = 'Mantenimiento';

        fetch(`/api/mesa/${mesa.id}/estado`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombreEstado })
        })
            .then(r => {
                if (!r.ok) throw new Error('Error actualizando mesa');
                return r.json();
            })
            .then(updated => {
                // updated es MesaDTO(id, capacidad, estado, color)
                const idx = MESAS.findIndex(m => m.id === updated.id);
                if (idx !== -1) {
                    MESAS[idx] = mapMesaApiToUi(updated);
                }
                renderMesasView();
                modal.style.display = 'none';
            })
            .catch(err => {
                console.error(err);
                alert('No se pudo actualizar el estado de la mesa.');
            });
    };

    modal.style.display = 'flex';
}

/* ==========================
   Lista de reservas del día
   ========================== */

function renderReservasDelDia() {
    const el = document.getElementById('reservasDelDia');
    if (!el) return;

    const fechaInput = document.getElementById('mesasDate');
    const fecha = fechaInput ? fechaInput.value : todayIsoLima();

    const selectEstado = document.getElementById('reservasEstadoFilter');
    const estadoSel = selectEstado ? selectEstado.value : 'todas';

    const filtered = RESERVAS.filter(r => {
        if (r.fecha !== fecha) return false;

        if (estadoSel === 'todas') return true;

        // Mapeo select HTML → id_estado
        if (estadoSel === 'pendiente_pago') return r.estadoId === 1;
        if (estadoSel === 'programada')     return r.estadoId === 2;
        if (estadoSel === 'en_curso')       return r.estadoId === 6;
        if (estadoSel === 'finalizada')     return r.estadoId === 7;
        if (estadoSel === 'cancelada')      return [3,4,5,8].includes(r.estadoId);

        return true;
    });

    el.innerHTML = '';

    if (filtered.length === 0) {
        el.innerHTML =
            '<div class="empty-state">No hay reservas para ' +
            formatDate(fecha) +
            '.</div>';
        return;
    }

    filtered.sort((a, b) => {
        return a.hora.localeCompare(b.hora) ||
            (a.cod || '').localeCompare(b.cod || '');
    });

    filtered.forEach(res => {
        const esCancelada = [3,4,5,8].includes(res.estadoId);

        const statusClass =
            res.estadoId === 1 ? 'status-pendiente' :
                res.estadoId === 2 ? 'status-programada' :
                    res.estadoId === 6 ? 'status-en-curso' :
                        res.estadoId === 7 ? 'status-finalizada' :
                            esCancelada        ? 'status-cancelada' :
                                'status-desconocido';

        const statusText = res.estadoNombre || 'Desconocido';

        let btns = '';

        if (res.estadoId === 1) { // Pago pendiente
            btns =
                `<button class="btn btn-sm btn-success" type="button" onclick="confirmarPago('${res.id}')">Confirmar pago</button> ` +
                `<button class="btn btn-sm btn-danger" type="button" onclick="denegarSolicitud('${res.id}')">Denegar</button>`;
        } else if (res.estadoId === 2) { // Programada
            btns =
                `<button class="btn btn-sm btn-outline-primary" type="button" onclick="openEditModal('${res.id}')">Editar</button> ` +
                `<button class="btn btn-sm btn-success" type="button" onclick="iniciarReserva('${res.id}')">Iniciar</button>`;
        } else if (res.estadoId === 6) { // En curso
            btns =
                `<button class="btn btn-sm btn-primary" type="button" onclick="finalizarReserva('${res.id}')">Finalizar</button>`;
        }

        if (![7,3,4,5,8].includes(res.estadoId)) { // no finalizada ni canceladas
            btns +=
                ` <button class="btn btn-sm btn-outline-danger" type="button" onclick="cancelReserva('${res.id}')">Cancelar</button>`;
        }

        btns +=
            ` <button class="btn btn-sm btn-outline-dark" type="button" onclick="viewReservaDetails('${res.id}')">Ver detalles</button>`;

        const div = document.createElement('div');
        div.className = 'reserva-item';
        div.innerHTML =
            `<div><strong>${res.cod}</strong> - ${res.nombre} ${res.apellido} ` +
            `<span class="reserva-status ${statusClass}">${statusText}</span></div>` +
            `<div class="small-muted">${slotDisplay(res.hora)} | ${res.personas} persona(s) | Mesa ${res.mesa || '-'} | ${res.telefono}</div>` +
            `<div style="margin-top:8px">${btns}</div>`;

        el.appendChild(div);
    });
}

/* ==========================
   Acciones principales (solo front)
   ========================== */
/*
   NOTA: aquí solo cambiamos estado en memoria.
   Si quieres, luego lo conectamos a:
   - PATCH /api/reserva/aceptar_soli
   - PATCH /api/reserva/denegar_soli/{idReserva}
   etc.
*/

function confirmarPago(id) {
    if (!confirm('¿Confirmar pago recibido e iniciar?')) return;
    const r = RESERVAS.find(x => String(x.id) === String(id));
    if (!r) return;
    r.estadoId = 6;
    r.estadoCode = 'reserva_en_curso';
    r.estadoNombre = 'Reserva en curso';
    renderMesasView();
}

function denegarSolicitud(id) {
    if (!confirm('¿Denegar solicitud?')) return;
    const r = RESERVAS.find(x => String(x.id) === String(id));
    if (!r) return;
    r.estadoId = 5;
    r.estadoCode = 'cancelado_inconv';
    r.estadoNombre = 'Cancelado - Inconveniente';
    renderMesasView();
}

function iniciarReserva(id) {
    if (!confirm('¿El cliente llegó? ¿Iniciar reserva?')) return;
    const r = RESERVAS.find(x => String(x.id) === String(id));
    if (!r) return;
    r.estadoId = 6;
    r.estadoCode = 'reserva_en_curso';
    r.estadoNombre = 'Reserva en curso';
    renderMesasView();
}

function finalizarReserva(id) {
    if (!confirm('¿Finalizar reserva?')) return;
    const r = RESERVAS.find(x => String(x.id) === String(id));
    if (!r) return;
    r.estadoId = 7;
    r.estadoCode = 'reserva_finalizada';
    r.estadoNombre = 'Reserva finalizada';
    renderMesasView();
}

function cancelReserva(id) {
    if (!confirm('¿Cancelar esta reserva?')) return;
    const r = RESERVAS.find(x => String(x.id) === String(id));
    if (!r) return;
    r.estadoId = 4;
    r.estadoCode = 'cancelado_cliente';
    r.estadoNombre = 'Cancelado - Cliente';
    renderMesasView();
}

function viewReservaDetails(id) {
    const r = RESERVAS.find(x => String(x.id) === String(id));
    if (!r) {
        alert('Reserva no encontrada');
        return;
    }

    alert(
        'DETALLES DE RESERVA\n\n' +
        'Código: ' + r.cod +
        '\nCliente: ' + r.nombre + ' ' + r.apellido +
        '\nDNI: ' + r.dni +
        '\nTeléfono: ' + r.telefono +
        '\nEmail: ' + r.correo +
        '\n\nFecha: ' + formatDate(r.fecha) +
        '\nHora: ' + slotDisplay(r.hora) +
        '\nPersonas: ' + r.personas +
        '\nMesa: ' + (r.mesa || '-') +
        '\nGarantía: S/ ' + (r.garantia || (r.personas * 5).toFixed(2)) +
        '\nEstado: ' + (r.estadoNombre || r.estadoCode) +
        '\nComentarios: ' + (r.comentarios || 'Ninguno')
    );
}

/* ==========================
   Reprogramar reserva (slots)
   ========================== */

function openEditModal(id) {
    const r = RESERVAS.find(x => String(x.id) === String(id));
    if (!r) return;

    if (r.estadoId !== 2) { // solo programadas
        alert('Solo se pueden editar reservas programadas.');
        return;
    }

    const modal   = document.getElementById('editModal');
    const info    = document.getElementById('editInfo');
    const slotsDiv= document.getElementById('editSlots');
    const msg     = document.getElementById('editMsg');

    if (!modal || !info || !slotsDiv || !msg) return;

    info.textContent = `${r.cod} — ${r.nombre} ${r.apellido}`;
    msg.textContent = '';

    renderEditSlots(slotsDiv, r.fecha, r.personas, r.hora);

    slotsDiv.onclick = (e) => {
        if (e.target && e.target.matches('button.slot')) {
            if (e.target.disabled) return;
            slotsDiv.querySelectorAll('.slot.selected').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            r.hora = e.target.getAttribute('data-hora');
        }
    };

    document.getElementById('editCancel').onclick = () => {
        modal.style.display = 'none';
    };

    document.getElementById('editSave').onclick = () => {
        const mesaNueva = asignarMesaAutomatica(parseInt(r.personas, 10), r.fecha, r.hora);
        if (!mesaNueva) {
            msg.textContent = 'No hay mesa disponible para esa combinación.';
            return;
        }
        r.mesa = mesaNueva;
        modal.style.display = 'none';
        renderMesasView();
    };

    modal.style.display = 'flex';
}

function renderEditSlots(container, date, personas, selected) {
    container.innerHTML = '';

    const slots = ['13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];

    slots.forEach(s => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'slot';
        btn.textContent = slotDisplay(s);
        btn.setAttribute('data-hora', s);

        if (!countFreeTablesForSlot(date, s, personas)) {
            btn.disabled = true;
        }
        if (s === selected) {
            btn.classList.add('selected');
        }

        container.appendChild(btn);
    });
}

/* ==========================
   Asignación automática de mesas
   ========================== */

function capacidadRequerida(p) {
    p = Number(p) || 0;
    if (p <= 2) return 2;
    if (p <= 4) return 4;
    if (p <= 6) return 6;
    return 8;
}

function isTableAvailableForSlot(idMesa, dateIso, slotTime) {
    const blockingIds = [1,2,6]; // pago pendiente, programada, en curso

    return !RESERVAS.some(r =>
        r.fecha === dateIso &&
        r.hora === slotTime &&
        String(r.mesa) === String(idMesa) &&
        blockingIds.includes(r.estadoId)
    );
}

function countFreeTablesForSlot(dateIso, slotTime, personas) {
    const capReq = capacidadRequerida(personas);

    let free = 0;
    MESAS.forEach(m => {
        const capMesa = capacidadNumero(m.capacidad);
        if (capMesa === capReq && isTableAvailableForSlot(m.id, dateIso, slotTime)) {
            free++;
        }
    });

    return free;
}

function asignarMesaAutomatica(personas, fecha, hora) {
    const capReq = capacidadRequerida(personas);

    for (const m of MESAS) {
        const capMesa = capacidadNumero(m.capacidad);
        if (capMesa !== capReq) continue;
        if (isTableAvailableForSlot(m.id, fecha, hora)) {
            return m.id;
        }
    }
    return null;
}

/* ==========================
   Exponer funciones globales usadas en HTML
   ========================== */

window.confirmarPago      = confirmarPago;
window.denegarSolicitud   = denegarSolicitud;
window.iniciarReserva     = iniciarReserva;
window.finalizarReserva   = finalizarReserva;
window.cancelReserva      = cancelReserva;
window.viewReservaDetails = viewReservaDetails;
window.renderMesasView    = renderMesasView;
window.openEditModal      = openEditModal;
