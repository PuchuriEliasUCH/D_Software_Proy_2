package com.stoqing.reservas.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping({"", "/"})
    public String index(){
        return "index";
    }

    @GetMapping("/reserva")
    public String reserva(){
        return "pages/reserva";
    }

    @GetMapping("/login")
    public String login(){
        return "pages/login";
    }

}
