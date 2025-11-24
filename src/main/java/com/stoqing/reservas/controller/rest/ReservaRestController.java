package com.stoqing.reservas.controller.rest;

import com.stoqing.reservas.config.UserDetailsCustom;
import com.stoqing.reservas.entities.dto.AceptarSolicitudDTO;
import com.stoqing.reservas.entities.dto.EmailDTO;
import com.stoqing.reservas.entities.model.AsignacionMesa;
import com.stoqing.reservas.entities.model.Operario;
import com.stoqing.reservas.entities.model.Reserva;
import com.stoqing.reservas.repository.ReservaRepository;
import com.stoqing.reservas.service.*;
import com.stoqing.reservas.utils.EstadosReserva;
import jakarta.mail.MessagingException;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;


@RestController
@RequestMapping("/api/reserva")
@AllArgsConstructor
public class ReservaRestController {

    private final WhatsAppService whatsAppService;
    private final ReservaService reservaService;
    private final MailService mailService;
    private final AsignacionMesaService asignacionMesaService;
    private final MesaService mesaService;

    @Transactional(readOnly = true)
    @GetMapping("/listar_todo")
    public ResponseEntity<?> listarTodo(){
        return ResponseEntity.status(HttpStatus.OK).body(reservaService.findAll());
    }

    @GetMapping("/listar")
    public ResponseEntity<?> listarPendientes(){
        return ResponseEntity.status(HttpStatus.OK).body(reservaService.findByEstado_Id(EstadosReserva.PAGO_PENDIENTE));
    }

    @GetMapping("/listar_estado/{id}/{fecha}")
    public ResponseEntity<?> listarPorFechaAndEstado(@PathVariable Integer id, @PathVariable LocalDate fecha){
        if (id == 0){
            return  ResponseEntity.status(HttpStatus.OK).body(
                reservaService.findAll());
        }

        return ResponseEntity.status(HttpStatus.OK).body(
            reservaService.findByEstado_IdAndFechaReserva(id, fecha));
    }

    @Transactional
    @PostMapping("/crear")
    public ResponseEntity<?> crear(@RequestBody Reserva reserva){
        reservaService.save(reserva);
        reserva.getAudit().setModifiedBy(1);
        return ResponseEntity.status(HttpStatus.CREATED).body(reserva);
    }

    @GetMapping("/listar_fecha")
    public ResponseEntity<?> listarFecha(){
        return ResponseEntity.status(HttpStatus.OK).body(reservaService.listarCardSolicitud());
    }

    @Transactional
    @PatchMapping("/aceptar_soli")
    public ResponseEntity<?> aceptarSoli(@RequestBody AceptarSolicitudDTO acepSoliDto) throws MessagingException {

        int id_reserva = acepSoliDto.getIdReserva();

        UserDetailsCustom sessionUser =
            (UserDetailsCustom) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        acepSoliDto.setIdOperario(sessionUser.getOperario().getId());

        Reserva reserva = reservaService.findById(id_reserva)
            .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        reservaService.aceptarSolicitudReserva(acepSoliDto);

        AsignacionMesa asign = asignacionMesaService.finByIdReserva(id_reserva);

        mesaService.cambiarEstadoMesa(asign.getMesa().getId(), 11);

        mailService.sendMail(new EmailDTO(reserva.getEmailContacto(), "Confirmacion de reserva", "xd", reserva));


        whatsAppService.confirmacionMensaje(reserva.getTelCliente(), "Reserva confirmada\n" +
            "- Código de reserva: " + reserva.getCodigo() + "\n" +
            "- Fecha: " + reserva.getFechaReserva() + "\n" +
            "- Hora: " + reserva.getHoraReserva() + "\n" +
            "- Número de personas: " + reserva.getNumeroPersonas() + "\n" +
            "- Monto de garantía: " + reserva.getMontoGarantia() + "\n" +
            "- Método de pago utilizado: " + acepSoliDto.getMetodoPago().name().toLowerCase() + "\n" +
            "Lo esperamos!");
        return ResponseEntity.status(HttpStatus.OK).body("Reserva aceptada exitosamente");
    }

    @Transactional
    @PatchMapping("/denegar_soli/{idReserva}")
    public ResponseEntity<?> denegarrSoli(@PathVariable int idReserva){

        reservaService.actualizarEstadoReserva(EstadosReserva.CANCELADO_INCONVENIENTES, idReserva);

        return ResponseEntity.status(HttpStatus.OK).body("Reserva denegada");
    }

    @Transactional
    @PatchMapping("/actualizar_estados")
    public ResponseEntity<?> actualizarEstado(@RequestParam Integer id_estado, @RequestParam int id_reserva){

        LocalDateTime actual = LocalDateTime.now(ZoneId.of("America/Lima"));

        UserDetailsCustom user =
            (UserDetailsCustom) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Reserva reserva = reservaService.findById(id_reserva)
            .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        if (
            id_estado.equals(EstadosReserva.CANCELADO_EXPIRADO) ||
                id_estado.equals(EstadosReserva.CANCELADO_INCONVENIENTES) ||
                id_estado.equals(EstadosReserva.CANCELADO_NO_SHOW) ||
                id_estado.equals(EstadosReserva.CANCELADO_CLIENTE) ||
                id_estado.equals(EstadosReserva.FINALIZADA)
        ){
            reserva.getAudit().setDeletedAt(actual);
        } else if (id_estado.equals(EstadosReserva.EN_CURSO)){

        }

        reserva.setExpira(null);
        reserva.getAudit().setModifiedBy(user.getOperario().getId());

        reservaService.actualizarEstadoReserva(id_estado, id_reserva);

        return ResponseEntity.status(HttpStatus.OK).body("Actualizado correctamente");
    }




}