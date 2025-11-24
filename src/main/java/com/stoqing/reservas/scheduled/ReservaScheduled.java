package com.stoqing.reservas.scheduled;

import com.stoqing.reservas.entities.model.Estado;
import com.stoqing.reservas.entities.model.Reserva;
import com.stoqing.reservas.repository.EstadoRepository;
import com.stoqing.reservas.repository.ReservaRepository;
import com.stoqing.reservas.utils.EstadosReserva;
import lombok.AllArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Component
@AllArgsConstructor
public class ReservaScheduled {

    private ReservaRepository reservaRepo;
    private EstadoRepository estadoRepo;

    // cambiar a 60000
    @Scheduled(fixedRate = 120000)
    @Transactional
    public void cancelarReservaNoPagada(){
        LocalDateTime actual = LocalDateTime.now(ZoneId.of("America/Lima"));

        List<Reserva> expiradas = reservaRepo.findByEstado_IdAndExpiraBefore(
            EstadosReserva.PAGO_PENDIENTE,
            actual
        );

        if (expiradas.isEmpty()) return;

        Estado cancelado = estadoRepo.findById(EstadosReserva.CANCELADO_EXPIRADO).orElseThrow();

        expiradas.forEach(reserva -> {
            reserva.setEstado(cancelado);
            reserva.setExpira(null);
            reserva.getAudit().setDeletedAt(actual);
            reserva.getAudit().setModifiedBy(1);
        });
    }

    @Scheduled(fixedRate = 10000)
    public void cancelarReservaNoShow(){}
}