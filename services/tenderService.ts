
import { Tender } from '../types';

export const fetchPublicTenders = async (): Promise<Tender[]> => {
  // Simulación de carga de datos de licitaciones públicas
  return [
    {
      id: 'LIC-2024-001',
      title: 'Desarrollo de plataforma de Inteligencia Artificial para atención ciudadana',
      organism: 'Ayuntamiento de Madrid - Área de Digitalización',
      status: 'published',
      budget: 120000.50,
      type: 'service',
      deadline: '2024-05-20',
      description: 'Implementación de un sistema conversacional basado en LLMs para la resolución de dudas frecuentes y trámites administrativos básicos.',
      link: '#',
      region: 'Madrid'
    },
    {
      id: 'LIC-2024-002',
      title: 'Suministro de mobiliario ergonómico para oficinas sostenibles',
      organism: 'Generalitat de Catalunya - Departamento de Infraestructuras',
      status: 'evaluation',
      budget: 45000.00,
      type: 'supply',
      deadline: '2024-04-15',
      description: 'Adquisición de sillas y mesas regulables fabricadas con materiales reciclados para los nuevos centros administrativos.',
      link: '#',
      region: 'Cataluña'
    },
    {
      id: 'LIC-2024-003',
      title: 'Renovación de infraestructura de red fibra óptica en polígonos industriales',
      organism: 'Diputación de Sevilla',
      status: 'published',
      budget: 850000.00,
      type: 'works',
      deadline: '2024-06-10',
      description: 'Obra civil e instalación de cableado de alta velocidad para mejorar la competitividad de las PYMES en el entorno rural.',
      link: '#',
      region: 'Andalucía'
    },
    {
      id: 'LIC-2024-004',
      title: 'Mantenimiento preventivo de sistemas de climatización eficiente',
      organism: 'Ministerio de Transición Ecológica',
      status: 'awarded',
      budget: 32000.00,
      type: 'service',
      deadline: '2024-03-01',
      description: 'Contrato de mantenimiento para los edificios centrales enfocado en la reducción de la huella de carbono.',
      link: '#',
      region: 'Nacional'
    },
    {
      id: 'LIC-2024-005',
      title: 'Auditoría de ciberseguridad y protección de datos sensibles',
      organism: 'Junta de Extremadura',
      status: 'published',
      budget: 58000.00,
      type: 'service',
      deadline: '2024-05-12',
      description: 'Evaluación técnica de los sistemas críticos de la administración para asegurar el cumplimiento del Esquema Nacional de Seguridad.',
      link: '#',
      region: 'Extremadura'
    }
  ];
};
