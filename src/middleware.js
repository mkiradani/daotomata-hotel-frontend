/**
 * Universal Subdomain Routing Middleware
 *
 * Intercepta todas las requests y hace rewrite interno de subdomain-based routing
 * a las páginas [hotel]/ existentes (SSG), manteniendo URLs limpias y SEO óptimo.
 *
 * Ejemplos:
 * - baberrih.daotomata.io/ → rewrite interno a /baberrih (hotel homepage)
 * - baberrih.daotomata.io/accommodation → rewrite interno a /baberrih/accommodation
 * - maisondemo.daotomata.io/facilities → rewrite interno a /maisondemo/facilities
 * - localhost:4321/accommodation → rewrite interno a /maisondemo/accommodation (fallback)
 */

import {
  isSubdomainBasedRouting,
  getSubdomainFromHostname,
  debugHotelDetection,
} from "./lib/domain-mapping.js";

/**
 * Lista de rutas que deben ser interceptadas para rewrite
 * Estas corresponden a las páginas existentes en src/pages/[hotel]/
 */
const HOTEL_ROUTES = [
  "accommodation",
  "activities",
  "book",
  "contact",
  "experiences",
  "facilities",
  "menu",
  "restaurant",
  "rooms",
];

/**
 * Rutas que NO deben ser interceptadas (admin, api, assets, etc.)
 * NOTA: multitenant-showcase removido para permitir interceptación desde subdomains
 */
const EXCLUDED_ROUTES = [
  "admin",
  "api",
  "_astro",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "test-chatwoot",
];

/**
 * Middleware principal de Astro
 */
export async function onRequest(context, next) {
  const { url } = context;
  const pathname = url.pathname;

  // Debug logging detallado para producción
  console.log(`🚀 Middleware intercepted: ${url.hostname}${pathname}`);
  console.log(`🔍 Request details:`, {
    hostname: url.hostname,
    pathname: pathname,
    origin: url.origin,
    protocol: url.protocol,
    headers: {
      host: context.request.headers.get("host"),
      "x-forwarded-host": context.request.headers.get("x-forwarded-host"),
      "x-forwarded-proto": context.request.headers.get("x-forwarded-proto"),
    },
  });

  // Saltar rutas excluidas
  if (shouldSkipRoute(pathname)) {
    console.log(`⏭️ Skipping excluded route: ${pathname}`);
    return next();
  }

  // Detectar si es subdomain-based routing
  const isSubdomain = isSubdomainBasedRouting(url.hostname);
  console.log(
    `🌐 Subdomain detection: ${isSubdomain} for hostname: ${url.hostname}`,
  );

  if (isSubdomain) {
    // SUBDOMAIN ROUTING: Rewrite interno a páginas [hotel]/
    const subdomain = getSubdomainFromHostname(url.hostname);
    console.log(`🏨 Detected subdomain: ${subdomain}`);

    // Manejar ruta raíz del subdomain (homepage del hotel)
    if (pathname === "/") {
      const newPath = `/${subdomain}`;
      console.log(`🔄 Subdomain root rewrite: ${pathname} → ${newPath}`);

      // Debug detección de hotel
      debugHotelDetection(url, { hotel: subdomain });

      // Rewrite interno a la homepage del hotel (sin cambiar URL)
      return context.rewrite(newPath);
    }

    // Manejar rutas específicas del hotel
    const targetRoute = extractRouteFromPath(pathname);
    console.log(`🎯 Target route extracted: ${targetRoute}`);

    if (targetRoute && HOTEL_ROUTES.includes(targetRoute)) {
      const newPath = `/${subdomain}${pathname}`;
      console.log(`🔄 Subdomain route rewrite: ${pathname} → ${newPath}`);

      // Debug detección de hotel
      debugHotelDetection(url, { hotel: subdomain });

      // Rewrite interno a página SSG (sin cambiar URL)
      return context.rewrite(newPath);
    }

    // 🚨 SEGURIDAD: Cualquier otra ruta desde subdomain → homepage del hotel
    // Esto bloquea acceso a /multitenant-showcase, /admin, etc. desde subdomains
    const newPath = `/${subdomain}`;
    console.log(
      `🛡️ Subdomain security rewrite: ${pathname} → ${newPath} (unauthorized route blocked)`,
    );

    // Debug detección de hotel
    debugHotelDetection(url, { hotel: subdomain });

    // Rewrite a homepage del hotel para bloquear rutas no autorizadas
    return context.rewrite(newPath);
  } else {
    // LEGACY ROUTING: Verificar si es una ruta de hotel sin prefijo
    const targetRoute = extractRouteFromPath(pathname);
    console.log(`🔗 Legacy routing check for: ${targetRoute}`);

    if (
      targetRoute &&
      HOTEL_ROUTES.includes(targetRoute) &&
      !pathname.startsWith("/maisondemo") &&
      !pathname.startsWith("/baberrih")
    ) {
      // Ruta legacy sin prefijo de hotel - usar fallback
      const fallbackHotel = "maisondemo";
      const newPath = `/${fallbackHotel}${pathname}`;
      console.log(`🔄 Legacy fallback rewrite: ${pathname} → ${newPath}`);

      // Debug detección de hotel
      debugHotelDetection(url, { hotel: fallbackHotel });

      // Rewrite interno a página SSG (sin cambiar URL)
      return context.rewrite(newPath);
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
  if (pathname === "/") {
    return true;
  }

  // Rutas que empiezan con prefijos excluidos
  return EXCLUDED_ROUTES.some(
    (route) => pathname.startsWith(`/${route}`) || pathname === `/${route}`,
  );
}

/**
 * Extrae el nombre de la ruta del pathname
 * @param {string} pathname - Pathname completo
 * @returns {string|null} - Nombre de la ruta o null
 */
function extractRouteFromPath(pathname) {
  // Remover slash inicial y obtener primer segmento
  const segments = pathname.replace(/^\//, "").split("/");
  const firstSegment = segments[0];

  // Si está vacío, es la ruta raíz
  if (!firstSegment) {
    return null;
  }

  // Si el primer segmento es un hotel conocido, tomar el segundo
  if (firstSegment === "maisondemo" || firstSegment === "baberrih") {
    return segments[1] || null;
  }

  // Caso subdomain: el primer segmento es la ruta
  return firstSegment;
}
