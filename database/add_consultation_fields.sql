
-- Add consultation fields to appointments table
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'appointments' and column_name = 'consultation_notes') then
    alter table public.appointments add column consultation_notes text null;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'appointments' and column_name = 'diagnosis') then
    alter table public.appointments add column diagnosis text null;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'appointments' and column_name = 'prescriptions') then
      alter table public.appointments add column prescriptions jsonb null;
  end if;
end $$;
