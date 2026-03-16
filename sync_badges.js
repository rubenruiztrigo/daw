
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lobfoivjtkmewqhunnry.supabase.co';
const supabaseAnonKey = 'sb_publishable_zDbz86NkA466tHkQBpYvbA_KjKaPsJv'; // This is public anyway

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const badges = [
  // Congresos
  { id: 'congress_2021_speaker', label: 'Ponente Congreso 2021', description: 'Ponente en el Congreso NovaGob 2021.', color: 'bg-amber-100 text-amber-600 border-amber-200', category: 'congresos' },
  { id: 'congress_2021', label: 'Asistente Congreso 2021', description: 'Asistente al Congreso NovaGob 2021.', color: 'bg-slate-100 text-slate-500 border-slate-200', category: 'congresos' },
  { id: 'congress_2022_speaker', label: 'Ponente Congreso 2022', description: 'Ponente en el Congreso NovaGob 2022.', color: 'bg-amber-100 text-amber-600 border-amber-200', category: 'congresos' },
  { id: 'congress_2022', label: 'Asistente Congreso 2022', description: 'Asistente al Congreso NovaGob 2022.', color: 'bg-slate-100 text-slate-500 border-slate-200', category: 'congresos' },
  { id: 'congress_2023_speaker', label: 'Ponente Congreso 2023', description: 'Ponente en el Congreso NovaGob 2023.', color: 'bg-amber-100 text-amber-600 border-amber-200', category: 'congresos' },
  { id: 'congress_2023', label: 'Asistente Congreso 2023', description: 'Asistente al Congreso NovaGob 2023.', color: 'bg-slate-100 text-slate-500 border-slate-200', category: 'congresos' },
  { id: 'congress_2024_speaker', label: 'Ponente Congreso 2024', description: 'Ponente en el Congreso NovaGob 2024.', color: 'bg-amber-100 text-amber-600 border-amber-200', category: 'congresos' },
  { id: 'congress_2024', label: 'Asistente Congreso 2024', description: 'Asistente al Congreso NovaGob 2024.', color: 'bg-slate-100 text-slate-500 border-slate-200', category: 'congresos' },
  { id: 'congress_2025_speaker', label: 'Ponente Congreso 2025', description: 'Ponente en el Congreso NovaGob 2025.', color: 'bg-amber-100 text-amber-600 border-amber-200', category: 'congresos' },
  { id: 'congress_2025', label: 'Asistente Congreso 2025', description: 'Asistente al Congreso NovaGob 2025.', color: 'bg-slate-100 text-slate-500 border-slate-200', category: 'congresos' },
  { id: 'congress_2026_speaker', label: 'Ponente Congreso 2026', description: 'Ponente en el Congreso NovaGob 2026.', color: 'bg-amber-100 text-amber-600 border-amber-200', category: 'congresos' },
  { id: 'congress_2026', label: 'Asistente Congreso 2026', description: 'Asistente al Congreso NovaGob 2026.', color: 'bg-slate-100 text-slate-500 border-slate-200', category: 'congresos' },

  // Premios
  { id: 'award_innovator', label: 'Persona innovadora del año', description: 'Premio de excelencia a la persona innovadora del año.', color: 'bg-amber-100 text-amber-600 border-amber-200', category: 'premios_excelencia' },
  { id: 'award_woman', label: 'Mujer destacada del Sector Publico', description: 'Premio de excelencia a la mujer destacada del Sector Publico.', color: 'bg-pink-100 text-pink-600 border-pink-200', category: 'premios_excelencia' },
  { id: 'award_talent', label: 'Nuevo Talento Publico', description: 'Premio de excelencia al nuevo talento público.', color: 'bg-cyan-100 text-cyan-600 border-cyan-200', category: 'premios_excelencia' },
  { id: 'award_excellence', label: 'Valor de las personas Excelentes', description: 'Premio de excelencia al valor de las personas excelentes.', color: 'bg-emerald-100 text-emerald-600 border-emerald-200', category: 'premios_excelencia' },
  { id: 'award_special', label: 'Categoría especial', description: 'Premio de excelencia en categoría especial del jurado.', color: 'bg-indigo-100 text-indigo-600 border-indigo-200', category: 'premios_excelencia' },
  { id: 'award_creativity', label: 'Creatividad en la innovación', description: 'Premio a la creatividad en la innovación.', color: 'bg-yellow-100 text-yellow-600 border-yellow-200', category: 'premios_excelencia' },
  { id: 'award_transformative_project', label: 'Proyecto más transformador', description: 'Premio al proyecto más transformador.', color: 'bg-blue-100 text-blue-600 border-blue-200', category: 'premios_excelencia' },
  { id: 'award_efficiency', label: 'Eficiencia en las AA.PP.', description: 'Premio a la eficiencia en las Administraciones Públicas.', color: 'bg-green-100 text-green-600 border-green-200', category: 'premios_excelencia' },
  { id: 'award_digital_transformation', label: 'Transformación Digital', description: 'Premio a la transformación digital.', color: 'bg-purple-100 text-purple-600 border-purple-200', category: 'premios_excelencia' },
  { id: 'award_people_management', label: 'Gestión de Personas', description: 'Premio a la gestión de personas.', color: 'bg-orange-100 text-orange-600 border-orange-200', category: 'premios_excelencia' },
  { id: 'award_good_government', label: 'Buen Gobierno', description: 'Premio al buen gobierno.', color: 'bg-slate-100 text-slate-600 border-slate-200', category: 'premios_excelencia' },

  // Eventos
  { id: 'event_innovalencia_speaker', label: 'Ponente InnoValencia', description: 'Ponente en InnoValencia.', color: 'bg-amber-100 text-amber-600 border-amber-200', category: 'eventos' },
  { id: 'event_innovalencia', label: 'Asistente InnoValencia', description: 'Asistente a InnoValencia.', color: 'bg-slate-100 text-slate-500 border-slate-200', category: 'eventos' },
  { id: 'event_burocracia_speaker', label: 'Ponente Burocrac_IA', description: 'Ponente en el Festival Burocrac_IA.', color: 'bg-amber-100 text-amber-600 border-amber-200', category: 'eventos' },
  { id: 'event_burocracia', label: 'Asistente Burocrac_IA', description: 'Asistente al Festival Burocrac_IA.', color: 'bg-slate-100 text-slate-500 border-slate-200', category: 'eventos' },
  { id: 'event_innovamos_speaker', label: 'Ponente Foro Innovamos', description: 'Ponente en Foro Innovamos Lab.', color: 'bg-amber-100 text-amber-600 border-amber-200', category: 'eventos' },
  { id: 'event_innovamos', label: 'Asistente Foro Innovamos', description: 'Asistente al Foro Innovamos Lab.', color: 'bg-slate-100 text-slate-500 border-slate-200', category: 'eventos' },

  // Ranking
  { id: 'ranking_top1', label: 'TOP 1', description: 'Primer lugar en el ranking semanal.', color: 'bg-yellow-100 text-yellow-600 border-yellow-200', category: 'ranking' },
  { id: 'ranking_top2', label: 'TOP 2', description: 'Segundo lugar en el ranking semanal.', color: 'bg-slate-200 text-slate-500 border-slate-300', category: 'ranking' },
  { id: 'ranking_top3', label: 'TOP 3', description: 'Tercer lugar en el ranking semanal.', color: 'bg-orange-100 text-orange-700 border-orange-200', category: 'ranking' },
];

async function syncBadges() {
  console.log('Syncing badges...');
  for (const badge of badges) {
    const { error } = await supabase
      .from('badges')
      .upsert(badge, { onConflict: 'id' });
    
    if (error) {
      console.error(`Error syncing badge ${badge.id}:`, error.message);
    } else {
      console.log(`Synced: ${badge.label}`);
    }
  }
  console.log('Done.');
}

syncBadges();
