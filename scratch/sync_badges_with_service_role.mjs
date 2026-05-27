import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co';
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const badges = [
  // Congresos
  { id: 'congress_2021_speaker', label: 'Ponente Congreso 2021', category: 'congreso', nova_reward: 15 },
  { id: 'congress_2021', label: 'Asistente Congreso 2021', category: 'congreso', nova_reward: 10 },
  { id: 'congress_2022_speaker', label: 'Ponente Congreso 2022', category: 'congreso', nova_reward: 15 },
  { id: 'congress_2022', label: 'Asistente Congreso 2022', category: 'congreso', nova_reward: 10 },
  { id: 'congress_2023_speaker', label: 'Ponente Congreso 2023', category: 'congreso', nova_reward: 15 },
  { id: 'congress_2023', label: 'Asistente Congreso 2023', category: 'congreso', nova_reward: 10 },
  { id: 'congress_2024_speaker', label: 'Ponente Congreso 2024', category: 'congreso', nova_reward: 15 },
  { id: 'congress_2024', label: 'Asistente Congreso 2024', category: 'congreso', nova_reward: 10 },
  { id: 'congress_2025_speaker', label: 'Ponente Congreso 2025', category: 'congreso', nova_reward: 15 },
  { id: 'congress_2025', label: 'Asistente Congreso 2025', category: 'congreso', nova_reward: 10 },
  { id: 'congress_2026_speaker', label: 'Ponente Congreso 2026', category: 'congreso', nova_reward: 15 },
  { id: 'congress_2026', label: 'Asistente Congreso 2026', category: 'congreso', nova_reward: 10 },

  // Premios
  { id: 'award_innovator', label: 'Persona innovadora del año', category: 'premio', nova_reward: 20 },
  { id: 'award_woman', label: 'Mujer destacada del Sector Publico', category: 'premio', nova_reward: 20 },
  { id: 'award_talent', label: 'Nuevo Talento Publico', category: 'premio', nova_reward: 20 },
  { id: 'award_excellence', label: 'Valor de las personas Excelentes', category: 'premio', nova_reward: 20 },
  { id: 'award_special', label: 'Categoría especial', category: 'premio', nova_reward: 20 },
  { id: 'award_creativity', label: 'Creatividad en la innovación', category: 'premio', nova_reward: 20 },
  { id: 'award_transformative_project', label: 'Proyecto más transformador', category: 'premio', nova_reward: 20 },
  { id: 'award_efficiency', label: 'Eficiencia en las AA.PP.', category: 'premio', nova_reward: 20 },
  { id: 'award_digital_transformation', label: 'Transformación Digital', category: 'premio', nova_reward: 20 },
  { id: 'award_people_management', label: 'Gestión de Personas', category: 'premio', nova_reward: 20 },
  { id: 'award_good_government', label: 'Buen Gobierno', category: 'premio', nova_reward: 20 },

  // Eventos
  { id: 'event_innovalencia_speaker', label: 'Ponente InnoValencia', category: 'evento', nova_reward: 10 },
  { id: 'event_innovalencia', label: 'Asistente InnoValencia', category: 'evento', nova_reward: 5 },
  { id: 'event_burocracia_speaker', label: 'Ponente Burocrac_IA', category: 'evento', nova_reward: 10 },
  { id: 'event_burocracia', label: 'Asistente Burocrac_IA', category: 'evento', nova_reward: 5 },
  { id: 'event_innovamos_speaker', label: 'Ponente Foro Innovamos', category: 'evento', nova_reward: 10 },
  { id: 'event_innovamos', label: 'Asistente Foro Innovamos', category: 'evento', nova_reward: 5 },

  // Ranking
  { id: 'ranking_top1', label: 'TOP 1', category: 'ranking', nova_reward: 10 },
  { id: 'ranking_top2', label: 'TOP 2', category: 'ranking', nova_reward: 7 },
  { id: 'ranking_top3', label: 'TOP 3', category: 'ranking', nova_reward: 5 },
];

async function run() {
  console.log('Syncing badges with service role...');
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
  console.log('Sync completed.');
}

run();
