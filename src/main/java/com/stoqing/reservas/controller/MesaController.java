package com.stoqing.reservas.controller;

import com.stoqing.reservas.repository.ReservaRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.time.LocalDate;
import java.util.TimeZone;

@Controller
@AllArgsConstructor
@RequestMapping("/gestion_mesas")
public class MesaController {
    private final ReservaRepository reservaRepo;

    @GetMapping({"/", ""})
    public String mesas(Model model) {
        LocalDate hoy = LocalDate.now();

        model.addAttribute("reservas", reservaRepo.findByEstado_IdAndFechaReserva(2, hoy));

        return "pages/mesas";
    }
}
