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
