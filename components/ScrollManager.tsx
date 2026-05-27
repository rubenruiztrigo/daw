import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * ScrollManager handles scroll restoration and memory.
 * - Saves scroll position for each route when leaving.
 * - Restores scroll position when returning via back/forward (POP).
 * - Scrolls to top for new navigations (PUSH/REPLACE).
 */
export const ScrollManager = () => {
    const { pathname } = useLocation();
    const navigationType = useNavigationType();
    const prevPathRef = useRef(pathname);
    const scrollPositions = useRef<Record<string, number>>({});

    // Disable native browser scroll restoration so we control it entirely
    useEffect(() => {
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
    }, []);

    useEffect(() => {
        // Save current position before the pathname changes
        const handleScroll = () => {
            scrollPositions.current[pathname] = window.scrollY;
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [pathname]);

    useEffect(() => {
        // If we are already in messages and just switching chats, skip global scroll
        const wasInMessages = prevPathRef.current.startsWith('/mensajes');
        const isInMessages = pathname.startsWith('/mensajes');

        if (wasInMessages && isInMessages) {
            prevPathRef.current = pathname;
            return;
        }

        // If navigating between any profile page and an event (/:user → /:user/:event or
        // /:user → /:otherUser/:event), skip scroll so the page stays in place.
        const SYSTEM_ROUTES = new Set(['inicio', 'noticias', 'calendario', 'mensajes', 'notificaciones', 'recompensas', 'buscar', 'configuracion', 'admin']);
        const prevSegments = prevPathRef.current.split('/').filter(Boolean);
        const currSegments = pathname.split('/').filter(Boolean);
        const isProfileRoute = (segs: string[]) => segs.length >= 1 && !SYSTEM_ROUTES.has(segs[0]);
        const isProfileEventNavigation =
            isProfileRoute(prevSegments) && isProfileRoute(currSegments) &&
            ((prevSegments.length === 1 && currSegments.length === 2) ||
             (prevSegments.length === 2 && currSegments.length === 1));

        if (isProfileEventNavigation) {
            prevPathRef.current = pathname;
            // When closing an event (2 segments → 1), restore the saved profile scroll
            if (prevSegments.length === 2 && currSegments.length === 1) {
                const savedPosition = scrollPositions.current[pathname] || 0;
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    window.scrollTo({ top: savedPosition, behavior: 'instant' });
                }));
            }
            return;
        }

        prevPathRef.current = pathname;

        // Determine scroll behavior based on navigation type
        if (navigationType === 'POP') {
            // Back/Forward: Restore saved position
            const savedPosition = scrollPositions.current[pathname] || 0;
            // Use a microtask to ensure the DOM is ready
            setTimeout(() => {
                window.scrollTo(0, savedPosition);
            }, 0);
        } else {
            // New navigation: Scroll to top
            window.scrollTo(0, 0);
        }
    }, [pathname, navigationType]);

    return null;
};
