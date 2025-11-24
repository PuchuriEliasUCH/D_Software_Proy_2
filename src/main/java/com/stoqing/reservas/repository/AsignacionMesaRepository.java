package com.stoqing.reservas.repository;

import com.stoqing.reservas.entities.model.AsignacionMesa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AsignacionMesaRepository extends JpaRepository<AsignacionMesa, Integer> {

    AsignacionMesa findByReserva_Id(Integer id);

}
