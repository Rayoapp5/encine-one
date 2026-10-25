// Mi Fuente - Kino Plugin por Rayoapp5

// Función auxiliar para limpiar la URL del servidor que escribe el usuario
function getBaseUrl() {
  const serverSetting = kino.config.get("server");
  if (!serverSetting) return "https://enmcine.uk";
  return String(serverSetting).replace(/\/+$/, "");
}

// 1. Capacidad de Búsqueda
export async function search(query) {
  // Regla dura: Primer await antes de cualquier validación o throw
  await null; 
  
  if (!query.q.trim()) return [];

  const baseUrl = getBaseUrl();
  // Llamada a la API usando kino.fetch (reemplaza por la ruta de búsqueda real de tu servidor si la conoces)
  const response = await kino.fetch(`${baseUrl}/api/search?q=${encodeURIComponent(query.q)}`);
  
  if (!response.ok) {
    throw kino.error("unavailable", "Error al conectar con el servidor: " + response.status);
  }

  const data = response.json();
  // Mapeamos los resultados al contrato de ítems de Kino
  return (data.results || []).map(item => ({
    id: "enm-" + item.id,
    ref: String(item.id),
    title: item.title,
    kind: item.isSeries ? "series" : "movie",
    year: item.year ? String(item.year) : undefined,
    poster: item.posterUrl ? baseUrl + item.posterUrl : undefined
  }));
}

// 2. Capacidad de Inicio (Home)
export async function home() {
  await null; // Primer await obligatorio

  const baseUrl = getBaseUrl();
  const response = await kino.fetch(`${baseUrl}/api/home`);
  
  if (!response.ok) {
    // Retornamos filas vacías en lugar de colgar el inicio completo si el servidor falla
    return []; 
  }

  const data = response.json();
  // Organizamos en filas según el contrato de Kino
  return (data.rows || []).map(row => ({
    id: "row-" + row.id,
    title: row.title,
    genre: "peliculas", // Categoría base de Kino
    items: (row.items || []).map(item => ({
      id: "enm-" + item.id,
      ref: String(item.id),
      title: item.title,
      kind: item.isSeries ? "series" : "movie",
      poster: item.posterUrl ? baseUrl + item.posterUrl : undefined
    }))
  }));
}

// 3. Capacidad de Exploración de filas perezosas
export async function browse(ref, cursor) {
  await null;
  const baseUrl = getBaseUrl();
  const pageCursor = cursor ? `&cursor=${encodeURIComponent(cursor)}` : "";
  const response = await kino.fetch(`${baseUrl}/api/browse?ref=${encodeURIComponent(ref)}${pageCursor}`);
  
  if (!response.ok) throw kino.error("unavailable");

  const data = response.json();
  return {
    items: (data.items || []).map(item => ({
      id: "enm-" + item.id,
      ref: String(item.id),
      title: item.title,
      kind: item.isSeries ? "series" : "movie"
    })),
    next: data.nextCursor || undefined
  };
}

// 4. Capacidad de listar Capítulos (Series/Anime)
export async function episodes(ref) {
  await null;
  const baseUrl = getBaseUrl();
  const response = await kino.fetch(`${baseUrl}/api/series/${encodeURIComponent(ref)}`);
  
  if (response.status === 404) throw kino.error("not_found");
  if (!response.ok) throw kino.error("unavailable");

  const data = response.json();
  return {
    episodes: (data.episodes || []).map(ep => ({
      season: ep.season || 1,
      number: ep.number,
      ref: String(ep.id),
      title: ep.title || `Episodio ${ep.number}`
    }))
  };
}

// 5. Capacidad de Resolución (Delegado a app resolutora externa)
export async function resolve(ref) {
  // Primer await obligatorio
  await null; 

  // Como indicaste que otra app resuelve el stream reproducible (externalResolve),
  // enviamos la instrucción en vez de una URL directa de video.
  // "my-protocol" es el nombre del protocolo que tu app resolutora debe saber escuchar.
  return {
    external: {
      protocol: "enmcine-resolver",
      ref: ref 
    }
  };
}
