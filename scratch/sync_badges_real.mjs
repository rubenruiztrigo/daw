import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const supabaseAnonKey = 'sb_publishable_of5--OpMVZV1Vr2Ay2ke-g_SlQ1A-IF';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const badges = [
  // Congresos
  { id: 'congress_2021_speaker', label: 'Ponente Congreso 2021', description: 'Ponente en el Congreso NovaGob 2021.', category: 'congresos' },
  { id: 'congress_2021', label: 'Asistente Congreso 2021', description: 'Asistente al Congreso NovaGob 2021.', category: 'congresos' },
  { id: 'congress_2022_speaker', label: 'Ponente Congreso 2022', description: 'Ponente en el Congreso NovaGob 2022.', category: 'congresos' },
  { id: 'congress_2022', label: 'Asistente Congreso 2022', description: 'Asistente al Congreso NovaGob 2022.', category: 'congresos' },
  { id: 'congress_2023_speaker', label: 'Ponente Congreso 2023', description: 'Ponente en el Congreso NovaGob 2023.', category: 'congresos' },
  { id: 'congress_2023', label: 'Asistente Congreso 2023', description: 'Asistente al Congreso NovaGob 2023.', category: 'congresos' },
  { id: 'congress_2024_speaker', label: 'Ponente Congreso 2024', description: 'Ponente en el Congreso NovaGob 2024.', category: 'congresos' },
  { id: 'congress_2024', label: 'Asistente Congreso 2024', description: 'Asistente al Congreso NovaGob 2024.', category: 'congresos' },
  { id: 'congress_2025_speaker', label: 'Ponente Congreso 2025', description: 'Ponente en el Congreso NovaGob 2025.', category: 'congresos' },
  { id: 'congress_2025', label: 'Asistente Congreso 2025', description: 'Asistente al Congreso NovaGob 2025.', category: 'congresos' },
  { id: 'congress_2026_speaker', label: 'Ponente Congreso 2026', description: 'Ponente en el Congreso NovaGob 2026.', category: 'congresos' },
  { id: 'congress_2026', label: 'Asistente Congreso 2026', description: 'Asistente al Congreso NovaGob 2026.', category: 'congresos' },

  // Premios
  { id: 'award_innovator', label: 'Persona innovadora del año', description: 'Premio de excelencia a la persona innovadora del año.', category: 'premios_excelencia' },
  { id: 'award_woman', label: 'Mujer destacada del Sector Publico', description: 'Premio de excelencia a la mujer destacada del Sector Publico.', category: 'premios_excelencia' },
  { id: 'award_talent', label: 'Nuevo Talento Publico', description: 'Premio de excelencia al nuevo talento público.', category: 'premios_excelencia' },
  { id: 'award_excellence', label: 'Valor de las personas Excelentes', description: 'Premio de excelencia al valor de las personas excelentes.', category: 'premios_excelencia' },
  { id: 'award_special', label: 'Categoría especial', description: 'Premio de excelencia en categoría especial del jurado.', category: 'premios_excelencia' },
  { id: 'award_creativity', label: 'Creatividad en la innovación', description: 'Premio a la creatividad en la innovación.', category: 'premios_excelencia' },
  { id: 'award_transformative_project', label: 'Proyecto más transformador', description: 'Premio al proyecto más transformador.', category: 'premios_excelencia' },
  { id: 'award_efficiency', label: 'Eficiencia en las AA.PP.', description: 'Premio a la eficiencia en las Administraciones Públicas.', category: 'premios_excelencia' },
  { id: 'award_digital_transformation', label: 'Transformación Digital', description: 'Premio a la transformación digital.', category: 'premios_excelencia' },
  { id: 'award_people_management', label: 'Gestión de Personas', description: 'Premio a la gestión de personas.', category: 'premios_excelencia' },
  { id: 'award_good_government', label: 'Buen Gobierno', description: 'Premio al buen gobierno.', category: 'premios_excelencia' },

  // Eventos
  { id: 'event_innovalencia_speaker', label: 'Ponente InnoValencia', description: 'Ponente en InnoValencia.', category: 'eventos' },
  { id: 'event_innovalencia', label: 'Asistente InnoValencia', description: 'Asistente a InnoValencia.', category: 'eventos' },
  { id: 'event_burocracia_speaker', label: 'Ponente Burocrac_IA', description: 'Ponente en el Festival Burocrac_IA.', category: 'eventos' },
  { id: 'event_burocracia', label: 'Asistente Burocrac_IA', description: 'Asistente al Festival Burocrac_IA.', category: 'eventos' },
  { id: 'event_innovamos_speaker', label: 'Ponente Foro Innovamos', description: 'Ponente en Foro Innovamos Lab.', category: 'eventos' },
  { id: 'event_innovamos', label: 'Asistente Foro Innovamos', description: 'Asistente al Foro Innovamos Lab.', category: 'eventos' },

  // Ranking
  { id: 'ranking_top1', label: 'TOP 1', description: 'Primer lugar en el ranking semanal.', category: 'ranking' },
  { id: 'ranking_top2', label: 'TOP 2', description: 'Segundo lugar en el ranking semanal.', category: 'ranking' },
  { id: 'ranking_top3', label: 'TOP 3', description: 'Tercer lugar en el ranking semanal.', category: 'ranking' },
];

async function syncBadges() {
  console.log('Syncing badges to real Supabase (no color property)...');
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
