/**
 * Universal Subdomain Routing Middleware
 *
 * Intercepta todas las requests y hace redirect 301 de subdomain-based routing
 * a las páginas [hotel]/ existentes (SSG), manteniendo SEO y rendimiento óptimo.
 *
 * Ejemplos:
 * - maisondemo.daotomata.io/accommodation → redirect 301 a /maisondemo/accommodation
 * - baberrih.daotomata.io/facilities → redirect 301 a /baberrih/facilities
 * - localhost:4321/accommodation → redirect 301 a /maisondemo/accommodation (fallback)
 */

import {
  isSubdomainBasedRouting,
  getSubdomainFromHostname,
  debugHotelDetection
} from './lib/domain-mapping.js';

/**
 * Lista de rutas que deben ser interceptadas para rewrite
 * Estas corresponden a las páginas existentes en src/pages/[hotel]/
 */
const HOTEL_ROUTES = [
  'accommodation',
  'activities',
  'book', 
  'contact',
  'experiences',
  'facilities',
  'menu',
  'restaurant',
  'rooms'
];

/**
 * Rutas que NO deben ser interceptadas (admin, api, assets, etc.)
 */
const EXCLUDED_ROUTES = [
  'admin',
  'api',
  '_astro',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'multitenant-showcase',
  'test-chatwoot'
];

/**
 * Middleware principal de Astro
 */
export async function onRequest(context, next) {
  const { url } = context;
  const pathname = url.pathname;
  
  // Debug logging para desarrollo
  console.log(`🚀 Middleware intercepted: ${url.hostname}${pathname}`);
  
  // Saltar rutas excluidas
  if (shouldSkipRoute(pathname)) {
    console.log(`⏭️ Skipping excluded route: ${pathname}`);
    return next();
  }
  
  // Detectar si es subdomain-based routing
  const isSubdomain = isSubdomainBasedRouting(url.hostname);
  
  if (isSubdomain) {
    // SUBDOMAIN ROUTING: Rewrite interno a páginas [hotel]/
    const subdomain = getSubdomainFromHostname(url.hostname);
    const targetRoute = extractRouteFromPath(pathname);
    
    if (targetRoute && HOTEL_ROUTES.includes(targetRoute)) {
      const newPath = `/${subdomain}${pathname}`;
      console.log(`🔄 Subdomain redirect 301: ${pathname} → ${newPath}`);

      // Debug detección de hotel
      debugHotelDetection(url, { hotel: subdomain });

      // Redirect 301 SEO-friendly a página SSG
      return context.redirect(newPath, 301);
    }
  } else {
    // LEGACY ROUTING: Verificar si es una ruta de hotel sin prefijo
    const targetRoute = extractRouteFromPath(pathname);
    
    if (targetRoute && HOTEL_ROUTES.includes(targetRoute) && !pathname.startsWith('/maisondemo') && !pathname.startsWith('/baberrih')) {
      // Ruta legacy sin prefijo de hotel - usar fallback
      const fallbackHotel = 'maisondemo';
      const newPath = `/${fallbackHotel}${pathname}`;
      console.log(`🔄 Legacy fallback redirect 301: ${pathname} → ${newPath}`);

      // Debug detección de hotel
      debugHotelDetection(url, { hotel: fallbackHotel });

      // Redirect 301 a página SSG
      return context.redirect(newPath, 301);
    }
  }
  
  // Continuar con request normal si no necesita rewrite
  console.log(`✅ No rewrite needed for: ${pathname}`);
  return next();
}

/**
 * Verifica si una ruta debe ser saltada por el middleware
 * @param {string} pathname - Ruta de la request
 * @returns {boolean} - True si debe ser saltada
 */
function shouldSkipRoute(pathname) {
  // Ruta raíz
  if (pathname === '/') {
    return true;
  }
  
  // Rutas que empiezan con prefijos excluidos
  return EXCLUDED_ROUTES.some(route => 
    pathname.startsWith(`/${route}`) || pathname === `/${route}`
  );
}

/**
 * Extrae el nombre de la ruta del pathname
 * @param {string} pathname - Pathname completo
 * @returns {string|null} - Nombre de la ruta o null
 */
function extractRouteFromPath(pathname) {
  // Remover slash inicial y obtener primer segmento
  const segments = pathname.replace(/^\//, '').split('/');
  const firstSegment = segments[0];
  
  // Si está vacío, es la ruta raíz
  if (!firstSegment) {
    return null;
  }
  
  // Si el primer segmento es un hotel conocido, tomar el segundo
  if (firstSegment === 'maisondemo' || firstSegment === 'baberrih') {
    return segments[1] || null;
  }
  
  // Caso subdomain: el primer segmento es la ruta
  return firstSegment;
}
