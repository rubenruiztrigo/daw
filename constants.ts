
export const COUNTRIES_DATA: Record<string, string[]> = {
  "España": [
    "Andalucía", "Aragón", "Asturias", "Baleares", "Canarias", "Cantabria", 
    "Castilla-La Mancha", "Castilla y León", "Cataluña", "Comunidad Valenciana", 
    "Extremadura", "Galicia", "Madrid", "Murcia", "Navarra", "País Vasco", "La Rioja",
    "Ceuta", "Melilla"
  ],
  "Portugal": [
    "Lisboa", "Oporto", "Braga", "Coímbra", "Faro (Algarve)", "Setúbal", 
    "Aveiro", "Leiria", "Santarém", "Viseu", "Madeira", "Azores", "Évora", "Viana do Castelo"
  ],
  "Perú": [
    "Lima", "Arequipa", "Cusco", "La Libertad", "Piura", "Ica", "Lambayeque", 
    "Ancash", "Junín", "Callao", "Loreto", "San Martín", "Cajamarca", "Puno"
  ],
  "Brasil": [
    "Brasilia", "São Paulo", "Rio de Janeiro", "Bahia", "Minas Gerais", "Amazonas", "Paraná"
  ],
  "México": [
    "CDMX", "Jalisco", "Nuevo León", "Yucatán", "Puebla", "Estado de México", "Veracruz"
  ]
};

export const COUNTRIES = Object.keys(COUNTRIES_DATA);

export const PUBLIC_INTERESTS = [
  'Innovación Pública', 
  'IA en Gobierno', 
  'Transformación Digital', 
  'Transparencia', 
  'Gestión del Talento', 
  'Smart Cities', 
  'Contratación Pública', 
  'Datos Abiertos', 
  'Liderazgo', 
  'Laboratorios de Innovación'
];

export const MOCK_USER: any = {
  id: 'u1',
  name: 'Ana García',
  position: 'Directora de Innovación',
  department: 'Diputación General',
  avatar: 'https://i.pravatar.cc/150?u=ana',
  bio: 'Apasionada por la transformación digital del sector público. Siempre buscando nuevas formas de mejorar los servicios ciudadanos.',
  interests: ['Innovación Pública', 'IA en Gobierno', 'Transparencia'],
  followers: 128,
  following: 84,
  joinedDate: '2018-06-15T10:00:00.000Z'
};

export const MOCK_USERS_LIST: any[] = [
  MOCK_USER,
  {
    id: 'u2',
    name: 'Carlos Ruiz',
    position: 'Analista de Datos',
    department: 'Ayuntamiento Central',
    avatar: 'https://i.pravatar.cc/150?u=carlos',
    bio: 'Experto en visualización de datos y Open Data. Trabajo para hacer la administración más transparente.',
    interests: ['Datos Abiertos', 'Transparencia', 'Smart Cities'],
    followers: 89,
    following: 120,
    country: 'España'
  },
  {
    id: 'u3',
    name: 'Elena Belmonte',
    position: 'Gestora de Proyectos',
    department: 'Agencia Digital',
    avatar: 'https://i.pravatar.cc/150?u=elena',
    bio: 'Especialista en metodologías ágiles aplicadas al sector público.',
    interests: ['Innovación Pública', 'Transformación Digital', 'Liderazgo'],
    followers: 215,
    following: 180,
    country: 'España'
  },
  {
    id: 'u4',
    name: 'Roberto Sánchez',
    position: 'Recursos Humanos',
    department: 'Ministerio de Trabajo',
    avatar: 'https://i.pravatar.cc/150?u=roberto',
    bio: 'Enfocado en la gestión del talento y el cambio cultural en las instituciones.',
    interests: ['Gestión del Talento', 'Liderazgo', 'Innovación Pública'],
    followers: 56,
    following: 45,
    country: 'España'
  }
];

export const MOCK_POSTS: any[] = [
  {
    id: 'p1',
    authorId: 'u2',
    authorName: 'Carlos Ruiz',
    authorPosition: 'Analista de Datos',
    authorAvatar: 'https://i.pravatar.cc/150?u=carlos',
    content: 'Acabamos de lanzar el nuevo portal de datos abiertos en nuestra comunidad. ¡Hacia una administración más transparente! 🚀 #DatosAbiertos #Transparencia',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    type: 'news',
    tags: ['DatosAbiertos', 'Transparencia'],
    likes: 45,
    comments: 2,
    commentsList: [
      {
        id: 'c1',
        authorName: 'Elena Belmonte',
        authorAvatar: 'https://i.pravatar.cc/150?u=elena',
        text: '¡Excelente noticia! ¿Está disponible la API para desarrolladores?',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString()
      },
      {
        id: 'c2',
        authorName: 'Roberto Sánchez',
        authorAvatar: 'https://i.pravatar.cc/150?u=roberto',
        text: 'Gran trabajo Carlos, esto facilita mucho la rendición de cuentas.',
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString()
      }
    ],
    userLiked: false
  },
  {
    id: 'p2',
    authorId: 'u3',
    authorName: 'Elena Belmonte',
    authorPosition: 'Gestora de Proyectos',
    authorAvatar: 'https://i.pravatar.cc/150?u=elena',
    content: '¿Alguien ha probado metodologías ágiles en procesos de contratación? Me gustaría conocer experiencias previas. #InnovaciónPública',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    type: 'post',
    tags: ['InnovaciónPública'],
    likes: 28,
    comments: 1,
    commentsList: [
      {
        id: 'c3',
        authorName: 'Ana García',
        authorAvatar: 'https://i.pravatar.cc/150?u=ana',
        text: 'Estamos pilotando algo similar en mi departamento. ¡Hablemos!',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString()
      }
    ],
    userLiked: false
  }
];

export const MOCK_CHATS_INITIAL = [
  { 
    id: 'c1', 
    participant: { 
      id: 'u2', 
      name: 'Carlos Ruiz', 
      avatar: 'https://i.pravatar.cc/150?u=carlos', 
      position: 'Analista de Datos', 
      department: 'Ayuntamiento Central' 
    }, 
    messages: [
      { id: 'm1', senderId: 'u2', text: '¿Pudiste revisar el borrador del nuevo protocolo?', timestamp: new Date(Date.now() - 1000 * 60 * 60) }
    ],
    lastMessage: '¿Pudiste revisar el borrador del nuevo protocolo?', 
    timestamp: new Date(Date.now() - 1000 * 60 * 60) 
  },
  { 
    id: 'c2', 
    participant: { 
      id: 'u4', 
      name: 'Roberto Sánchez', 
      avatar: 'https://i.pravatar.cc/150?u=roberto', 
      position: 'Recursos Humanos', 
      department: 'Ministerio de Trabajo' 
    }, 
    messages: [
      { id: 'm2', senderId: 'u4', text: 'Mañana reunión a las 10:00.', timestamp: new Date(Date.now() - 1000 * 60 * 120) }
    ],
    lastMessage: 'Mañana reunión a las 10:00.', 
    timestamp: new Date(Date.now() - 1000 * 60 * 120) 
  }
];
