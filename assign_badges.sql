-- ASIGNACIÓN DE INSIGNIAS
-- Asigna las insignias solicitadas a los usuarios "Jaime" y "david".

-- 1. Jaime: 3 insignias de eventos especiales
UPDATE public.profiles
SET badges = '[
  {"id": "event_innovalencia"},
  {"id": "event_burocracia"},
  {"id": "event_innovamos"}
]'::jsonb
WHERE name ILIKE '%Jaime%';

-- 2. David: Insignia de InnoValencia
UPDATE public.profiles
SET badges = '[
  {"id": "event_innovalencia"}
]'::jsonb
WHERE name ILIKE '%David%' OR username ILIKE '%daviidcruz%'; -- Asegurando por si acaso (el usuario mencionó "david")

SELECT name, badges FROM public.profiles WHERE name ILIKE '%Jaime%' OR name ILIKE '%David%';
