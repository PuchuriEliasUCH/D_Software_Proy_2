// MesaRestController.java
package com.stoqing.reservas.controller.rest;

import com.stoqing.reservas.entities.dto.CambiarEstadoMesaDTO;
import com.stoqing.reservas.entities.dto.MesaDTO;
import com.stoqing.reservas.entities.model.Mesa;
import com.stoqing.reservas.service.MesaService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mesa")
@AllArgsConstructor
public class MesaRestController {

    private final MesaService mesaService;

    @GetMapping("/listar")
    public List<MesaDTO> listar() {
        List<Mesa> mesas = mesaService.listarTodas();
        return mesas.stream()
            .map(m -> new MesaDTO(
                m.getId(),
                m.getCapacidad().name(),              // "DOS"
                m.getEstado().getNombre(),            // "Libre"
                m.getEstado().getColor()              // "#22BB74"
            ))
            .toList();
    }

    @PatchMapping("/{numMesa}/estado")
    public ResponseEntity<MesaDTO> cambiarEstado(
        @PathVariable int numMesa,
        @RequestBody CambiarEstadoMesaDTO body
    ) {
        Mesa mesa = mesaService.cambiarEstadoMesaFront(numMesa, body.getNombreEstado());
        MesaDTO dto = new MesaDTO(
            mesa.getId(),
            mesa.getCapacidad().name(),
            mesa.getEstado().getNombre(),
            mesa.getEstado().getColor()
        );
        return ResponseEntity.ok(dto);
    }
}