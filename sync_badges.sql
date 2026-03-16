-- Script para sincronizar las insignias en la tabla 'badges'
-- Ejecuta este script en el SQL Editor de Supabase
-- Eliminadas las columnas 'description' y 'category' según la estructura real de la tabla

INSERT INTO public.badges (id, label, color, nova_reward)
VALUES 
  -- Congresos
  ('congress_2021_speaker', 'Ponente Congreso 2021', 'bg-amber-100 text-amber-600 border-amber-200', 15),
  ('congress_2021', 'Asistente Congreso 2021', 'bg-slate-100 text-slate-500 border-slate-200', 10),
  ('congress_2022_speaker', 'Ponente Congreso 2022', 'bg-amber-100 text-amber-600 border-amber-200', 15),
  ('congress_2022', 'Asistente Congreso 2022', 'bg-slate-100 text-slate-500 border-slate-200', 10),
  ('congress_2023_speaker', 'Ponente Congreso 2023', 'bg-amber-100 text-amber-600 border-amber-200', 15),
  ('congress_2023', 'Asistente Congreso 2023', 'bg-slate-100 text-slate-500 border-slate-200', 10),
  ('congress_2024_speaker', 'Ponente Congreso 2024', 'bg-amber-100 text-amber-600 border-amber-200', 15),
  ('congress_2024', 'Asistente Congreso 2024', 'bg-slate-100 text-slate-500 border-slate-200', 10),
  ('congress_2025_speaker', 'Ponente Congreso 2025', 'bg-amber-100 text-amber-600 border-amber-200', 15),
  ('congress_2025', 'Asistente Congreso 2025', 'bg-slate-100 text-slate-500 border-slate-200', 10),
  ('congress_2026_speaker', 'Ponente Congreso 2026', 'bg-amber-100 text-amber-600 border-amber-200', 15),
  ('congress_2026', 'Asistente Congreso 2026', 'bg-slate-100 text-slate-500 border-slate-200', 10),
  
  -- Premios
  ('award_innovator', 'Persona innovadora del año', 'bg-amber-100 text-amber-600 border-amber-200', 20),
  ('award_woman', 'Mujer destacada del Sector Publico', 'bg-pink-100 text-pink-600 border-pink-200', 20),
  ('award_talent', 'Nuevo Talento Publico', 'bg-cyan-100 text-cyan-600 border-cyan-200', 20),
  ('award_excellence', 'Valor de las personas Excelentes', 'bg-emerald-100 text-emerald-600 border-emerald-200', 20),
  ('award_special', 'Categoría especial', 'bg-indigo-100 text-indigo-600 border-indigo-200', 20),
  ('award_creativity', 'Creatividad en la innovación', 'bg-yellow-100 text-yellow-600 border-yellow-200', 20),
  ('award_transformative_project', 'Proyecto más transformador', 'bg-blue-100 text-blue-600 border-blue-200', 20),
  ('award_efficiency', 'Eficiencia en las AA.PP.', 'bg-green-100 text-green-600 border-green-200', 20),
  ('award_digital_transformation', 'Transformación Digital', 'bg-purple-100 text-purple-600 border-purple-200', 20),
  ('award_people_management', 'Gestión de Personas', 'bg-orange-100 text-orange-600 border-orange-200', 20),
  ('award_good_government', 'Buen Gobierno', 'bg-slate-100 text-slate-600 border-slate-200', 20),
  
  -- Eventos
  ('event_innovalencia_speaker', 'Ponente InnoValencia', 'bg-amber-100 text-amber-600 border-amber-200', 10),
  ('event_innovalencia', 'Asistente InnoValencia', 'bg-slate-100 text-slate-500 border-slate-200', 5),
  ('event_burocracia_speaker', 'Ponente Burocrac_IA', 'bg-amber-100 text-amber-600 border-amber-200', 10),
  ('event_burocracia', 'Asistente Burocrac_IA', 'bg-slate-100 text-slate-500 border-slate-200', 5),
  ('event_innovamos_speaker', 'Ponente Foro Innovamos', 'bg-amber-100 text-amber-600 border-amber-200', 10),
  ('event_innovamos', 'Asistente Foro Innovamos', 'bg-slate-100 text-slate-500 border-slate-200', 5),
  
  -- Ranking
  ('ranking_top1', 'TOP 1', 'bg-yellow-100 text-yellow-600 border-yellow-200', 10),
  ('ranking_top2', 'TOP 2', 'bg-slate-200 text-slate-500 border-slate-300', 7),
  ('ranking_top3', 'TOP 3', 'bg-orange-100 text-orange-700 border-orange-200', 5)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  color = EXCLUDED.color,
  nova_reward = EXCLUDED.nova_reward;
