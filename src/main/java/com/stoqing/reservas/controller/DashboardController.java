package com.stoqing.reservas.controller;

import com.stoqing.reservas.service.ReservaService;
import lombok.AllArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;

@Controller
@RequestMapping("/dashboard")
@AllArgsConstructor
public class DashboardController {

    private final ReservaService reservaService;

    @Transactional(readOnly = true)
    @GetMapping({"/", ""})
    public String dashboard(Model model){
        LocalDate ahora = LocalDate.now();
        model.addAttribute("cards", reservaService.listarCardSolicitud());
        model.addAttribute("contadores", reservaService.listarContadoresDashboard(ahora));
        return "pages/admin_dashboard";
    }

    @Transactional(readOnly = true)
    @GetMapping("/listar_solis_fecha")
    public String listarSolisFecha(
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate fecha,
        Model model
    ){
        model.addAttribute("cards", reservaService.listarCardSolicitud());

        return "fragments/dashboard/fragment_solicitudes :: fragmentSoli";
    }

    @Transactional(readOnly = true)
    @GetMapping("/listar_contadores_fecha")
    public String listarContadoresDashboard(
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate fecha,
        Model model
    ){
        LocalDate fechaBusqueda = (fecha != null) ? fecha : LocalDate.now();

        model.addAttribute("contadores", reservaService.listarContadoresDashboard(fechaBusqueda));

        return "fragments/dashboard/contador_panel :: contador";
    }


}