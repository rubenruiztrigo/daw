
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
  following: 84
};

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
    tags: ['Datos Abiertos', 'Transparencia'],
    likes: 45,
    comments: 12,
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
    tags: ['Innovación Pública'],
    likes: 28,
    comments: 24,
    userLiked: false
  }
];
