-- Actualizar o insertar insignias de excelencia
INSERT INTO badges (id, label, color, slug)
VALUES 
  ('award_special', 'Categoría especial', 'bg-indigo-100 text-indigo-600 border-indigo-200', 'AWARD_SPECIAL'),
  ('award_innovator', 'Persona innovadora del año', 'bg-amber-100 text-amber-600 border-amber-200', 'AWARD_INNOVATOR'),
  ('award_talent', 'Nuevo talento público', 'bg-cyan-100 text-cyan-600 border-cyan-200', 'AWARD_TALENT'),
  ('award_woman', 'Mujer destacada del sector público', 'bg-pink-100 text-pink-600 border-pink-200', 'AWARD_WOMAN'),
  ('award_excellence', 'Valor de las personas excelentes', 'bg-emerald-100 text-emerald-600 border-emerald-200', 'AWARD_EXCELLENCE')
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label;
