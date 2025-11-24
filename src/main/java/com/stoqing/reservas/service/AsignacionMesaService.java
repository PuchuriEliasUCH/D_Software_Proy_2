package com.stoqing.reservas.service;

import com.stoqing.reservas.entities.model.AsignacionMesa;
import com.stoqing.reservas.repository.AsignacionMesaRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class AsignacionMesaService {
    private final AsignacionMesaRepository asignacionMesaRepo;

    public AsignacionMesa finByIdReserva(Integer id) {
        return  asignacionMesaRepo.findByReserva_Id(id);
    }
}
