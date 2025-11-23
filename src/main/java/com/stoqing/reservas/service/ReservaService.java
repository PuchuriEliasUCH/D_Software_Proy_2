package com.stoqing.reservas.service;

import com.stoqing.reservas.config.UserDetailsCustom;
import com.stoqing.reservas.entities.dto.AceptarSolicitudDTO;
import com.stoqing.reservas.entities.dto.CardSoliDTO;
import com.stoqing.reservas.entities.dto.PanelAdminDashDTO;
import com.stoqing.reservas.entities.model.Reserva;
import com.stoqing.reservas.repository.EstadoRepository;
import com.stoqing.reservas.repository.ReservaRepository;
import com.stoqing.reservas.utils.EstadosReserva;
import jakarta.mail.MessagingException;
import lombok.AllArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@Service
@AllArgsConstructor
public class ReservaService {
    private ReservaRepository reservaRepo;

    public List<Reserva> findAll(){
        return reservaRepo.findAll();
    }

    public List<Reserva> findByEstado_IdAndFechaReserva(Integer id_estado, LocalDate fecha){
        return reservaRepo.findByEstado_IdAndFechaReserva(id_estado, fecha);
    }

    public List<Reserva> findByEstado_Id(Integer id){
        return reservaRepo.findByEstado_Id(id);
    }

    public void save(Reserva reserva){
        LocalDateTime actual = LocalDateTime.now(ZoneId.of("America/Lima"));
        reserva.setExpira(actual.plusSeconds(15L)); // cambiar a .plusMinutes(15L)
        reservaRepo.save(reserva);
        reservaRepo.asignarMesa(reserva.getCodigo(), reserva.getNumeroPersonas());
    }

    // Listar tarjetas DTO del dashboard
    public List<CardSoliDTO> listarCardSolicitud(){
        return reservaRepo.listarCardSolicitud();
    }

    public Optional<Reserva> findById(Integer id){
        return reservaRepo.findById(id);
    }

    public PanelAdminDashDTO listarContadoresDashboard(LocalDate fecha){

        long programado = 0L;
        long enCurso = 0L;
        long finalizado = 0L;
        long cancelado = 0L;

        List<Integer> ids = reservaRepo.ids_estado(fecha);

        cancelado = ids.stream()
            .filter(id -> Set.of(
                EstadosReserva.CANCELADO_EXPIRADO,
                EstadosReserva.CANCELADO_CLIENTE,
                EstadosReserva.CANCELADO_INCONVENIENTES,
                EstadosReserva.CANCELADO_NO_SHOW
            ).contains(id))
            .count();

        finalizado = ids.stream().filter(id -> Objects.equals(id, EstadosReserva.FINALIZADA)).count();
        enCurso = ids.stream().filter(id -> Objects.equals(id, EstadosReserva.EN_CURSO)).count();
        programado = ids.stream().filter(id -> Objects.equals(id, EstadosReserva.RESERVA_PROGRAMADA)).count();

        return new PanelAdminDashDTO(cancelado, programado, enCurso, finalizado);
    }

    public void actualizarEstadoReserva(Integer idEstado, Integer idReserva){
        UserDetailsCustom user =
            (UserDetailsCustom) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Reserva reserva = reservaRepo.findById(idReserva)
            .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        reserva.setExpira(null);
        reserva.getAudit().setModifiedBy(user.getOperario().getId());
        reservaRepo.actualizarEstadoReserva(idEstado, idReserva);
    }

    public void aceptarSolicitudReserva(AceptarSolicitudDTO acepSoliDTO) throws MessagingException {
        reservaRepo.aceptarSolicitudReserva(acepSoliDTO);
    }
}