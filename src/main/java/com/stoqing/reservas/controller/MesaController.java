package com.stoqing.reservas.controller;

import com.stoqing.reservas.repository.ReservaRepository;
import com.stoqing.reservas.service.ReservaService;
import lombok.AllArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;

@Controller
@AllArgsConstructor
@RequestMapping("/gestion_mesas")
public class MesaController {
    private final ReservaService reservaService;

    @GetMapping({"/", ""})
    public String mesas(Model model) {
        LocalDate hoy = LocalDate.now();

        model.addAttribute("otras_reservas", reservaService.findByFechaReserva(hoy));

        return "pages/mesas";
    }

    @GetMapping("/relistar/{id}")
    public String relistar(
            @PathVariable Integer id,
            Model model
    ){
        LocalDate hoy = LocalDate.now();

        if (id == 0) {
            model.addAttribute("otras_reservas", reservaService.findByFechaReserva(hoy));
        } else {
            model.addAttribute("otras_reservas", reservaService.findByEstado_IdAndFechaReserva(id, hoy));
        }


        return "fragments/mesas/lista_reservas :: listaReservas";
    }
}
