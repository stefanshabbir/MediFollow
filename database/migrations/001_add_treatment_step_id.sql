-- Add treatment_plan_step_id to appointment_requests to track requests from plan steps
alter table public.appointment_requests 
add column treatment_plan_step_id uuid references public.treatment_template_steps(id) on delete set null;
