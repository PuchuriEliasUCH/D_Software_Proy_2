package com.stoqing.reservas.repository;

import com.stoqing.reservas.entities.model.Mesa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MesaRepository extends JpaRepository<Mesa, Integer> {

    List<Mesa> findAllByOrderByIdAsc();

    @Query("update Mesa m set m.estado.id = :id_estado where m.id = :num_mesa")
    @Modifying
    void actualizarEstado(
        @Param("num_mesa") Integer num_mesa,
        @Param("id_estado") Integer id_estado
    );

    @Query("select mesa from AsignacionMesa where reserva.id = :id_reserva")
    Mesa findById_mesa(Integer id_reserva);
}