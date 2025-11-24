// mesas-reservas.js
const STATE_CLASS_MAP = {
    'Libre': 'estado-libre',
    'Solicitada': 'estado-solicitada',
    'Reservada': 'estado-reservada',
    'Ocupada': 'estado-ocupada',
    'Mantenimiento': 'estado-mantenimiento'
};

let mesasGlob = []; // cache simple

document.addEventListener('DOMContentLoaded', () => {
    cargarMesas();
    setupBotonesHeader();
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

function cargarMesas() {
    fetch('/api/mesa/listar')
        .then(r => {
            if (!r.ok) throw new Error('Error cargando mesas');
            return r.json();
        })
        .then(data => {
            mesasGlob = data;
            renderMesasMap(data);
        })
        .catch(err => {
            console.error(err);
            const mapEl = document.getElementById('mesasMap');
            if (mapEl) {
                mapEl.innerHTML = '<div class="empty-state">No se pudieron cargar las mesas.</div>';
            }
        });
}

function renderMesasMap(mesas) {
    const mapEl = document.getElementById('mesasMap');
    if (!mapEl) return;

    mapEl.innerHTML = '';

    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = '8px';

    mesas.forEach(mesa => {
        const div = document.createElement('div');
        const claseEstado = STATE_CLASS_MAP[mesa.estado] || 'estado-libre';

        div.className = `mesa ${claseEstado}`;
        div.tabIndex = 0;
        div.style.cursor = 'pointer';

        const icon = mesa.estado === 'Libre' ? '✅'
            : mesa.estado === 'Solicitada' ? '🟢'
                : mesa.estado === 'Reservada' ? '🔴'
                    : mesa.estado === 'Ocupada' ? '🟠'
                        : '⚠️';

        div.innerHTML = `
      <div style="font-weight:bold;display:flex;align-items:center;gap:4px">
        <span>${icon}</span>
        <span>Mesa ${mesa.numMesa}</span>
      </div>
      <div style="font-size:0.75rem;margin-top:4px;text-align:center">
        Cap.: ${capacidadTexto(mesa.capacidad)}
      </div>
    `;

        div.addEventListener('click', () => onMesaClick(mesa.numMesa));
        div.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') onMesaClick(mesa.numMesa);
        });

        container.appendChild(div);
    });

    mapEl.appendChild(container);
}

function capacidadTexto(cap) {
    switch (cap) {
        case 'DOS': return '2 personas';
        case 'CUATRO': return '4 personas';
        case 'SEIS': return '6 personas';
        case 'OCHO': return '8 personas';
        default: return cap;
    }
}

function onMesaClick(numMesa) {
    const mesa = mesasGlob.find(m => m.numMesa === numMesa);
    if (!mesa) return;

    const modal = document.getElementById('tableOptionsModal');
    const info = document.getElementById('tableOptInfo');
    const select = document.getElementById('tableStateSelect');
    const maintWrap = document.getElementById('maintUntilWrap');

    if (!modal || !info || !select) return;

    info.textContent = `Mesa ${mesa.numMesa} — Capacidad ${capacidadTexto(mesa.capacidad)}`;

    // Solo manejamos manualmente estos 3
    if (mesa.estado === 'Libre')      select.value = 'libre';
    else if (mesa.estado === 'Ocupada')      select.value = 'ocupada';
    else if (mesa.estado === 'Mantenimiento') select.value = 'mantenimiento';
    else select.value = 'libre';

    maintWrap.style.display = select.value === 'mantenimiento' ? 'block' : 'none';

    select.onchange = () => {
        maintWrap.style.display = select.value === 'mantenimiento' ? 'block' : 'none';
    };

    document.getElementById('tableOptCancel').onclick = () => {
        modal.style.display = 'none';
    };

    document.getElementById('tableOptSave').onclick = () => {
        const val = select.value; // 'libre' | 'ocupada' | 'mantenimiento'
        let nombreEstado;

        if (val === 'libre') nombreEstado = 'Libre';
        else if (val === 'ocupada') nombreEstado = 'Ocupada';
        else nombreEstado = 'Mantenimiento';

        fetch(`/api/mesa/${mesa.numMesa}/estado`, {
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
                // Actualizamos cache y re-render
                const idx = mesasGlob.findIndex(m => m.numMesa === updated.numMesa);
                if (idx !== -1) mesasGlob[idx] = updated;
                renderMesasMap(mesasGlob);
                modal.style.display = 'none';
            })
            .catch(err => {
                console.error(err);
                alert('No se pudo actualizar el estado de la mesa.');
            });
    };

    modal.style.display = 'flex';
}


const cancelReserva = (id) => {
    fetch('/api/reserva/')
}


