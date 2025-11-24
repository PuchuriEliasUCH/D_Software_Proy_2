/* reservas.js — GMT-5 Lima; deshabilitar horas pasadas; comprobante estilizado */
const PRICE_PER_PERSON = 10.00;
const LS_KEY = 'stoqing_reservas_v2';
const LS_TABLES = 'stoqing_tables_v2';
const LIMA_TZ = 'America/Lima';

const DEFAULT_TABLES = [
    {num: 1, capacidad: 2, ubicacion: 'salon'}, {num: 2, capacidad: 2, ubicacion: 'salon'},
    {num: 3, capacidad: 2, ubicacion: 'segundo_piso'}, {num: 4, capacidad: 2, ubicacion: 'segundo_piso'},
    {num: 5, capacidad: 4, ubicacion: 'salon'}, {num: 6, capacidad: 4, ubicacion: 'salon'},
    {num: 7, capacidad: 4, ubicacion: 'salon'}, {num: 8, capacidad: 4, ubicacion: 'segundo_piso'},
    {num: 9, capacidad: 4, ubicacion: 'segundo_piso'}, {num: 10, capacidad: 6, ubicacion: 'salon'},
    {num: 11, capacidad: 6, ubicacion: 'salon'}, {num: 12, capacidad: 6, ubicacion: 'segundo_piso'},
    {num: 13, capacidad: 6, ubicacion: 'segundo_piso'}, {num: 14, capacidad: 8, ubicacion: 'salon'},
    {num: 15, capacidad: 8, ubicacion: 'segundo_piso'}
];

const RESERVATION_STATES = {
    PEND_PAGO: 'pendiente_pago',
    CANCELADA: 'cancelada',
    PROGRAMADA: 'programada',
    EN_CURSO: 'en_curso',
    FINALIZADA: 'finalizada'
};

/* -------------------- Helpers de almacenamiento -------------------- */
function initStorage() {
    if (!localStorage.getItem(LS_KEY)) localStorage.setItem(LS_KEY, JSON.stringify([]));
    if (!localStorage.getItem(LS_TABLES)) localStorage.setItem(LS_TABLES, JSON.stringify(DEFAULT_TABLES));
}

function getReservas() {
    try {
        return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveReservas(arr) {
    // localStorage.setItem(LS_KEY, JSON.stringify(arr));
    fetch("api/reserva/crear", {
        method: "POST",
        body: JSON.stringify(arr),
        headers:{
            "Content-Type": "application/json"
        }
    }).catch(er => console.log(er))
}

function getTables() {
    try {
        return JSON.parse(localStorage.getItem(LS_TABLES) || '[]');
    } catch {
        return DEFAULT_TABLES;
    }
}

/* -------------------- Helpers de tiempo (GMT‑5: Lima) -------------------- */
function nowLima() {
    return new Date(new Date().toLocaleString('en-US', {timeZone: LIMA_TZ}));
}

function todayIsoLima() {
    const n = nowLima();
    const y = n.getFullYear(), m = String(n.getMonth() + 1).padStart(2, '0'), d = String(n.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function nowHH00Lima() {
    const n = nowLima();
    return String(n.getHours()).padStart(2, '0') + ':00';
}

function isoFromParts(y, m1, d) {
    return `${y}-${String(m1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function limaDateTime(isoDate, hhmm = '00:00') {
    return new Date(`${isoDate}T${hhmm}:00-05:00`);
} // fecha/hora fija a GMT-5

/* -------------------- Lógica de disponibilidad -------------------- */
function slotDisplay(s) {
    if (!s) return '-';
    const [hh, mm] = s.split(':').map(Number);
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${h12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`;
}

function generateSlots() {
    return ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
} // 1–9 PM (doc) :contentReference[oaicite:1]{index=1}
function statusLabel(s) {
    switch (s) {
        case 'pendiente_pago':
            return 'Pendiente de pago';
        case 'cancelada':
            return 'Cancelada';
        case 'programada':
            return 'Programada';
        case 'en_curso':
            return 'En curso';
        case 'finalizada':
            return 'Finalizada';
        default:
            return s || '-';
    }
}

function capacidadRequerida(p) {
    if (p <= 2) return 2;
    if (p <= 4) return 4;
    if (p <= 6) return 6;
    return 8;
}

function isTableAvailableForSlot(tableNum, dateIso, slotTime) {
    const t = getTables().find(x => String(x.num) === String(tableNum));
    if (t && t.manual === 'mantenimiento') return false;
    const reservas = getReservas();
    const blocking = [RESERVATION_STATES.PROGRAMADA, RESERVATION_STATES.EN_CURSO, RESERVATION_STATES.PEND_PAGO];
    return !reservas.some(r => r.fecha === dateIso && r.hora === slotTime && String(r.mesa) === String(tableNum) && blocking.includes(r.estado));
}

function asignarMesaAutomatica(personas, fecha, hora) {
    const cap = capacidadRequerida(personas);
    const candidatos = getTables().filter(t => t.capacidad === cap && t.manual !== 'mantenimiento');
    for (const m of candidatos) {
        if (isTableAvailableForSlot(m.num, fecha, hora)) return m.num;
    }
    return null;
}

function countFreeTablesForSlot(dateIso, slotTime, personas) {
    const cap = capacidadRequerida(personas);
    const candidatos = getTables().filter(t => t.capacidad === cap && t.manual !== 'mantenimiento');
    let free = 0;
    for (const t of candidatos) if (isTableAvailableForSlot(t.num, dateIso, slotTime)) free++;
    return free;
}

/* -------------------- Comprobante exclusivo (bonito) -------------------- */
function buildReceiptHTML(r) {
    return `<!doctype html><html><head><meta charset="utf-8"><title>Comprobante ${r.codigo}</title>
  <style>
  @page{size:A4;margin:20mm}*{box-sizing:border-box}
  body{font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#111;background:#fff}
  .wrap{max-width:640px;margin:0 auto}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #eee;padding-bottom:12px}
  .brand{font-weight:800;font-size:22px;letter-spacing:.3px}
  .code{font-weight:700;font-size:14px;color:#333}
  .tag{display:inline-block;background:#111;color:#fff;padding:4px 8px;border-radius:6px;font-weight:700;font-size:12px}
  .section{margin-top:16px}
  .grid{display:grid;grid-template-columns:180px 1fr;gap:6px 16px}
  .label{color:#6b6f73;font-weight:600}.value{font-weight:600}
  .notice{background:#fff6e6;border:1px solid #ffe0b2;padding:10px 12px;border-radius:8px;font-size:13px}
  .total{font-size:18px;font-weight:800;margin-top:12px}
  .footer{border-top:2px solid #eee;padding-top:10px;margin-top:18px;font-size:12px;color:#6b6f73}
  .print-hint{display:none}@media print{.no-print{display:none}.print-hint{display:block;margin-top:8px;color:#6b6f73;font-size:12px}}
  </style></head><body><div class="wrap">
    <div class="header">
      <div><div class="brand">StoqING</div><div class="code">Comprobante de reserva — <span>${r.codigo}</span></div></div>
      <div class="tag">RESERVA</div>
    </div>
    <div class="section grid">
      <div class="label">Cliente</div><div class="value">${r.nombreCliente} ${r.apellidoCliente}</div>
      <div class="label">DNI</div><div class="value">${r.dniCliente}</div>
      <div class="label">Teléfono</div><div class="value">${r.telCliente}</div>
      <div class="label">Correo</div><div class="value">${r.emailContacto}</div>
      <div class="label">Fecha</div><div class="value">${r.fechaReserva}</div>
      <div class="label">Hora</div><div class="value">${slotDisplay(r.horaReserva)}</div>
      <div class="label">Personas</div><div class="value">${r.numeroPersonas}</div>
      <div class="label">Estado</div><div class="value">${statusLabel(r.estado)}</div>
    </div>
    ${r.comentarios ? `<div class="section"><div class="label">Comentarios</div><div>${r.comentarios}</div></div>` : ''}
    <div class="section notice">Tienes <strong>15 minutos</strong> para completar el pago. El monto se descuenta de tu consumo.</div>
    <div class="total">Monto garantía: S/ ${r.garantia}</div>
    <div class="footer">Generado el ${new Date().toLocaleString('es-PE')} · StoqING · Av. Pedro de Osma 301, Barranco · +51 1 242-8515
      <div class="print-hint">Sugerencia: “Guardar como PDF”.</div>
    </div>
    <div class="no-print" style="margin-top:12px"><button onclick="window.print()">Imprimir / Guardar PDF</button></div>
  </div></body></html>`;
}

function openReceiptWindow(r) {
    const html = buildReceiptHTML(r);
    const w = window.open('', '_blank');
    if (!w) {
        alert('Permite ventanas emergentes para ver/imprimir el comprobante.');
        return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(() => {
        try {
            w.focus();
            w.print();
        } catch (e) {
        }
    }, 400);
}

function downloadReceiptHTML(r) {
    const html = buildReceiptHTML(r);
    const blob = new Blob([html], {type: 'text/html;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprobante_${r.codigo}.html`;
    a.click();
    URL.revokeObjectURL(url);
}

/* -------------------- Calendario & UI -------------------- */
function buildCalendar(rootEl, year, month, onDateClick) {
    rootEl.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'calendar-header';
    const monthName = document.createElement('div');
    monthName.className = 'month';
    monthName.textContent = new Date(year, month).toLocaleString('es-PE', {month: 'long', year: 'numeric'});
    const btns = document.createElement('div');
    const prev = document.createElement('button');
    prev.className = 'btn btn-sm btn-light';
    prev.textContent = '‹';
    const next = document.createElement('button');
    next.className = 'btn btn-sm btn-light';
    next.textContent = '›';
    btns.appendChild(prev);
    btns.appendChild(next);
    header.appendChild(monthName);
    header.appendChild(btns);
    rootEl.appendChild(header);

    const weekdays = document.createElement('div');
    weekdays.className = 'weekdays';
    ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].forEach(w => {
        const d = document.createElement('div');
        d.textContent = w;
        weekdays.appendChild(d);
    });
    rootEl.appendChild(weekdays);

    const grid = document.createElement('div');
    grid.className = 'calendar-grid';
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'day other-month';
        grid.appendChild(empty);
    }

    const todayIso = todayIsoLima();
    for (let d = 1; d <= daysInMonth; d++) {
        const iso = isoFromParts(year, month + 1, d);
        const cell = document.createElement('div');
        cell.className = 'day card';
        cell.textContent = d;
        if (iso < todayIso) {
            cell.classList.add('past');
        } else {
            cell.addEventListener('click', () => {
                onDateClick(iso, cell);
            });
            cell.style.cursor = 'pointer';
        }
        grid.appendChild(cell);
    }
    rootEl.appendChild(grid);
    return {prev, next, monthName, grid};
}

function setupReservasPage() {
    initStorage();

    const calendarEl = document.getElementById('calendarEl');
    const slotsContainer = document.getElementById('slotsUnderCalendar');
    const form = document.getElementById('reservaForm');
    const mensajeEl = document.getElementById('mensaje');
    const resumenDiv = document.getElementById('resumenReserva');
    const resumenContenido = document.getElementById('resumenContenido');
    const imprimirBtn = document.getElementById('imprimirBtn');
    const descargarBtn = document.getElementById('descargarBtn');

    if (!calendarEl) return;

    // Solo dígitos en DNI/Teléfono
    const dniInput = document.getElementById('dni');
    const telInput = document.getElementById('telefono');
    [dniInput, telInput].forEach(inp => {
        if (!inp) return;
        inp.addEventListener('input', () => {
            const max = inp.getAttribute('maxlength') || 999;
            inp.value = inp.value.replace(/\D/g, '').slice(0, max);
        });
    });

    const slots = generateSlots();
    // Mes/año iniciales en Lima
    let current = nowLima(), month = current.getMonth(), year = current.getFullYear();
    let selectedDate = null, selectedSlot = null, currentPersonas = 0;

    slotsContainer.innerHTML = '<div class="small-muted" style="padding:20px;text-align:center;color:#6b6f73;">Primero selecciona la cantidad de personas y una fecha.</div>';

    // Select personas
    const personasInput = document.getElementById('personas');
    if (personasInput) {
        personasInput.addEventListener('change', function () {
            currentPersonas = parseInt(this.value) || 0;
            if (currentPersonas > 0) {
                if (!selectedDate) {
                    slotsContainer.innerHTML = '<div class="small-muted" style="padding:20px;text-align:center;color:#28a745;">Ahora selecciona una fecha del calendario.</div>';
                } else {
                    renderSlotsUnderCalendar(selectedDate);
                }
            } else {
                slotsContainer.innerHTML = '<div class="small-muted" style="padding:20px;text-align:center;color:#6b6f73;">Primero selecciona la cantidad de personas.</div>';
            }
        });
    }

    function renderSlotsUnderCalendar(isoDate) {
        if (currentPersonas === 0) {
            slotsContainer.innerHTML = '<div class="small-muted" style="padding:20px;text-align:center;color:#ff8c42;">Por favor, selecciona primero la cantidad de personas.</div>';
            return;
        }
        slotsContainer.innerHTML = '';
        selectedDate = isoDate;
        selectedSlot = null;

        const cap = capacidadRequerida(currentPersonas);
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = 'background:#e7f3ff;padding:12px;border-radius:8px;margin-bottom:16px;font-size:0.9rem';
        infoDiv.innerHTML = `<strong>Para ${currentPersonas} persona${currentPersonas > 1 ? 's' : ''}:</strong> Se asignará mesa de ${cap} personas.`;
        slotsContainer.appendChild(infoDiv);

        const todayIso = todayIsoLima(), nowHH = nowHH00Lima();
        slots.forEach((s) => {
            const free = countFreeTablesForSlot(isoDate, s, currentPersonas);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'slot';
            btn.textContent = `${slotDisplay(s)} — ${free} mesa(s) disponible(s)`;
            if (free === 0) {
                btn.classList.add('disabled');
                btn.disabled = true;
            }
            // Bloqueo GMT‑5: si es hoy en Lima y la hora ya pasó (o ya empezó), no se puede elegir
            if (isoDate === todayIso && s <= nowHH) {
                btn.classList.add('disabled');
                btn.disabled = true;
            }  /* doc: “No se pueden elegir horarios que ya pasaron”. */ /* :contentReference[oaicite:2]{index=2} */

            btn.addEventListener('click', () => {
                if (btn.disabled) return;
                document.querySelectorAll('.slot.selected').forEach(el => el.classList.remove('selected'));
                btn.classList.add('selected');
                selectedSlot = s;
                mensajeEl.textContent = '';
            });
            slotsContainer.appendChild(btn);
        });
    }

    // Calendario inicial (Lima)
    const cal = buildCalendar(calendarEl, year, month, (iso, cell) => {
        if (!personasInput.value) {
            alert('Por favor, selecciona primero la cantidad de personas.');
            return;
        }
        document.querySelectorAll('.day.selected').forEach(e => e.classList.remove('selected'));
        cell.classList.add('selected');
        renderSlotsUnderCalendar(iso);
    });

    function goPrev() {
        month--;
        if (month < 0) {
            month = 11;
            year--;
        }
        const n = buildCalendar(calendarEl, year, month, (iso, cell) => {
            document.querySelectorAll('.day.selected').forEach(e => e.classList.remove('selected'));
            cell.classList.add('selected');
            renderSlotsUnderCalendar(iso);
        });
        n.prev.addEventListener('click', goPrev);
        n.next.addEventListener('click', goNext);
    }

    function goNext() {
        month++;
        if (month > 11) {
            month = 0;
            year++;
        }
        const n = buildCalendar(calendarEl, year, month, (iso, cell) => {
            document.querySelectorAll('.day.selected').forEach(e => e.classList.remove('selected'));
            cell.classList.add('selected');
            renderSlotsUnderCalendar(iso);
        });
        n.prev.addEventListener('click', goPrev);
        n.next.addEventListener('click', goNext);
    }

    cal.prev.addEventListener('click', goPrev);
    cal.next.addEventListener('click', goNext);

    // Submit
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const nombreCliente = document.getElementById('nombre').value.trim();
            const apellidoCliente = document.getElementById('apellido').value.trim();
            const dniCliente = document.getElementById('dni').value.trim();
            const telCliente = document.getElementById('telefono').value.trim();
            const emailContacto = document.getElementById('correo').value.trim();
            const numeroPersonas = parseInt(document.getElementById('personas').value, 10);
            const comentarios = document.getElementById('comentarios').value.trim();
            const aceptaGarantia = document.getElementById('aceptaGarantia').checked;

            if (!nombreCliente || !apellidoCliente || !dniCliente || !telCliente || !emailContacto || !numeroPersonas) {
                mensajeEl.textContent = 'Completa todos los campos obligatorios.';
                mensajeEl.style.color = 'crimson';
                return;
            }
            if (!/^\d{8}$/.test(dniCliente)) {
                mensajeEl.textContent = 'DNI inválido (8 dígitos).';
                mensajeEl.style.color = 'crimson';
                return;
            }
            if (!/^\d{9}$/.test(telCliente)) {
                mensajeEl.textContent = 'Teléfono inválido (9 dígitos).';
                mensajeEl.style.color = 'crimson';
                return;
            }
            if (!/^\S+@\S+\.\S+$/.test(emailContacto)) {
                mensajeEl.textContent = 'Correo inválido.';
                mensajeEl.style.color = 'crimson';
                return;
            }
            if (!aceptaGarantia) {
                mensajeEl.textContent = 'Debes aceptar el pago de garantía para continuar.';
                mensajeEl.style.color = 'crimson';
                return;
            }
            if (!selectedDate || !selectedSlot) {
                mensajeEl.textContent = 'Selecciona una fecha y un horario desde el calendario.';
                mensajeEl.style.color = 'crimson';
                return;
            }

            const mesaAsignada = asignarMesaAutomatica(numeroPersonas, selectedDate, selectedSlot);
            if (!mesaAsignada) {
                mensajeEl.textContent = 'No hay mesas disponibles para la cantidad seleccionada en este horario.';
                mensajeEl.style.color = 'crimson';
                renderSlotsUnderCalendar(selectedDate);
                return;
            }

            const monto = numeroPersonas * PRICE_PER_PERSON;
            const codigo = 'R' + Math.random().toString(36).substring(2, 8).toUpperCase();
            const nueva = {
                "estado": { "id": 1 },
                nombreCliente,
                apellidoCliente,
                dniCliente,
                telCliente,
                emailContacto,
                numeroPersonas,
                codigo,
                fechaReserva: selectedDate,
                horaReserva: selectedSlot,
                montoGarantia: monto.toFixed(2),
                comentarios: comentarios || null,
            };

            const paraLocal = {...nueva,
                garantia: monto.toFixed(2),
                mesaAsignada
            }

            console.log(paraLocal);


            const reservas = getReservas();
            reservas.push(nueva);
            saveReservas(nueva);

            resumenContenido.innerHTML =
                `<div class="note" style="margin-bottom:12px"><strong>Importante:</strong> Tienes <strong>15 minutos</strong> para completar el pago.</div>
         <div><strong>Código de reserva:</strong> ${paraLocal.codigo}</div>
         <div><strong>Nombre:</strong> ${paraLocal.nombre} ${paraLocal.apellido}</div>
         <div><strong>Fecha:</strong> ${paraLocal.fechaReserva}</div>
         <div><strong>Hora:</strong> ${slotDisplay(paraLocal.horaReserva)}</div>
         <div><strong>Personas:</strong> ${paraLocal.numeroPersonas}</div>
         <div style="font-size:1.1rem;color:#28a745;margin:12px 0"><strong>Monto a pagar: S/ ${paraLocal.garantia}</strong></div>
         <div style="background:#e7f3ff;padding:12px;border-radius:8px;margin-top:12px">
           <strong>Canales de pago:</strong>
           <ul style="list-style:none;padding-left:0;margin-top:8px">
             <li><strong>WhatsApp Business:</strong> +51 1 242-8515</li>
             <li><strong>Correo:</strong> pagos@stoqing.com</li>
           </ul>
           <div style="margin-top:8px;font-size:0.9rem">Envía tu comprobante de pago con el código <strong>${paraLocal.codigo}</strong>.</div>
         </div>
         <div style="background:#fff;padding:10px;border-radius:6px;margin-top:12px;border:1px solid #dee2e6">
           <strong>Mesa asignada:</strong> Mesa ${mesaAsignada}<br><strong>El monto pagado se descontará de tu consumo.</strong>
         </div>`;
            resumenDiv.style.display = 'block';
            mensajeEl.textContent = `Solicitud registrada — Código ${codigo} — Total: S/ ${paraLocal.garantia}`;
            mensajeEl.style.color = '#0a7a07';

            if (imprimirBtn) {
                imprimirBtn.onclick = () => openReceiptWindow(nueva);
            }
            if (descargarBtn) {
                descargarBtn.onclick = () => downloadReceiptHTML(nueva);
            }

            selectedSlot = null;
            document.querySelectorAll('.slot.selected').forEach(el => el.classList.remove('selected'));
            if (selectedDate) renderSlotsUnderCalendar(selectedDate);
        });
    }
}

document.addEventListener('DOMContentLoaded', setupReservasPage);