package com.stoqing.reservas.service;

import com.stoqing.reservas.config.UserDetailsCustom;
import com.stoqing.reservas.entities.emuns.TipoEstado;
import com.stoqing.reservas.entities.model.Estado;
import com.stoqing.reservas.entities.model.Mesa;
import com.stoqing.reservas.repository.AsignacionMesaRepository;
import com.stoqing.reservas.repository.EstadoRepository;
import com.stoqing.reservas.repository.MesaRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class MesaService {

    private final MesaRepository mesaRepository;
    private final EstadoRepository estadoRepository;
    private final AsignacionMesaRepository asignacionMesaRepository;

    public List<Mesa> listarTodas() {
        return mesaRepository.findAllByOrderByIdAsc();
    }

    public Mesa buscarPorId(Integer id){
        return mesaRepository.findById(id).orElse(null);
    }

    public Mesa cambiarEstadoMesaFront(int numMesa, String nombreEstado) {

        UserDetailsCustom sessionUser =
            (UserDetailsCustom) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Mesa mesa = mesaRepository.findById(numMesa)
            .orElseThrow(() -> new IllegalArgumentException("Mesa no encontrada: " + numMesa));

        Estado estado = estadoRepository
            .findByNombreAndTipo(nombreEstado, TipoEstado.MESA)
            .orElseThrow(() -> new IllegalArgumentException("Estado MESA no encontrado: " + nombreEstado));

        mesa.setEstado(estado);
        mesa.getAudit().setModifiedBy(sessionUser.getOperario().getId());
        return mesaRepository.save(mesa);
    }


    public void cambiarEstadoMesa(int numMesa, int id_estado) {
        mesaRepository.actualizarEstado(numMesa, id_estado);
    }
}