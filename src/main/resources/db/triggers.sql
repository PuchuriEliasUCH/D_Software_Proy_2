delimiter $$

create trigger trg_cancelar
    after update on reserva
    for each row
begin
    declare v_num_mesa int;

    if new.deleted_at is not null and old.deleted_at is null then
        select
            am.num_mesa
        into
            v_num_mesa
        from
            asignacion_mesa am
        where
            am.id_reserva = new.id_reserva
        limit 1;

        if v_num_mesa is not null then
            update
                mesa
            set
                id_estado = 9,
                updated_at = now()
            where num_mesa = v_num_mesa;

            update
                asignacion_mesa am
            set
                am.deleted_at = now(),
                am.modified_by = coalesce(new.modified_by, 1)
            where
                am.id_reserva = new.id_reserva;
        end if;
    end if;

end$$

delimiter ;

delimiter $$

create trigger trg_historial_mesa
    after update on mesa
    for each row
begin

    if new.id_estado != old.id_estado then
        insert into
            historial_mesa
        values (
                   null,
                   current_date,
                   current_time,
                   old.id_estado,
                   new.id_estado,
                   old.num_mesa,
                   new.modified_by
               );
    end if;

end$$

delimiter ;

delimiter $$
# drop trigger trg_historial_reserva
create trigger trg_historial_reserva
    after update on reserva
    for each row
begin

    if new.id_estado != old.id_estado then
        insert into
            historial_reserva
        values (
                   null,
                   current_date,
                   current_time,
                   old.id_estado,
                   new.id_estado,
                   new.modified_by,
                   old.id_reserva
               );
    end if;

end$$

delimiter ;

