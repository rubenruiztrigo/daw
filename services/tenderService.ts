
import { Tender } from '../types';

export const fetchPublicTenders = async (query: string = ''): Promise<Tender[]> => {
  // Simulación de respuesta de la Plataforma de Contratación
  const mockTenders: Tender[] = [
    {
      id: 'EXP-2024-001',
      title: 'Suministro e instalación de sistemas de IA para la gestión de tráfico urbano sostenible',
      organization: 'Ayuntamiento de Madrid - Área de Medio Ambiente y Movilidad',
      budget: '1.240.000,00 €',
      status: 'Licitación',
      deadline: '2024-06-15',
      link: 'https://contrataciondelestado.es',
      description: 'El objeto del contrato es la implantación de una plataforma basada en visión artificial para la optimización de flujos de tráfico en el nodo norte.'
    },
    {
      id: 'EXP-2024-002',
      title: 'Servicio de mantenimiento y soporte de la infraestructura de administración electrónica',
      organization: 'Junta de Andalucía - Agencia Digital de Andalucía',
      budget: '450.000,00 €',
      status: 'Licitación',
      deadline: '2024-05-30',
      link: 'https://contrataciondelestado.es',
      description: 'Soporte técnico 24x7 para los sistemas críticos de tramitación administrativa y sede electrónica de la Junta de Andalucía.'
    },
    {
      id: 'EXP-2024-003',
      title: 'Desarrollo de una plataforma de Big Data para la transparencia en el gasto público',
      organization: 'Ministerio de Hacienda y Función Pública',
      budget: '890.000,00 €',
      status: 'Adjudicación',
      deadline: '2024-04-10',
      link: 'https://contrataciondelestado.es',
      description: 'Creación de un lago de datos para la analítica avanzada de contratos menores y subvenciones estatales.'
    },
    {
      id: 'EXP-2024-004',
      title: 'Obras de rehabilitación energética en edificios administrativos provinciales',
      organization: 'Diputación de Barcelona',
      budget: '2.100.000,00 €',
      status: 'Licitación',
      deadline: '2024-07-01',
      link: 'https://contrataciondelestado.es',
      description: 'Mejora de la envolvente térmica y sustitución de sistemas de climatización por aerotermia en 4 sedes administrativas.'
    }
  ];

  if (!query) return mockTenders;
  
  const normalizedQuery = query.toLowerCase();
  return mockTenders.filter(t => 
    t.title.toLowerCase().includes(normalizedQuery) || 
    t.organization.toLowerCase().includes(normalizedQuery) ||
    t.description?.toLowerCase().includes(normalizedQuery)
  );
};
