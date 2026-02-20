import { useState, useEffect } from 'react';

export const useScrollDirection = () => {
    const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);

    useEffect(() => {
        let lastScrollY = window.scrollY;

        const updateScrollDirection = () => {
            const scrollY = window.scrollY;
            const direction = scrollY > lastScrollY ? 'down' : 'up';

            // Always show when near top to fix "stuck" states
            if (scrollY < 10) {
                setScrollDirection('up');
                lastScrollY = Math.max(0, scrollY);
                return;
            }

            // Only update if difference is significant enough to avoid jitter
            // But update lastScrollY on change to keep the "anchor" moving
            const diff = Math.abs(scrollY - lastScrollY);

            if (diff > 10) {
                setScrollDirection(direction);
                lastScrollY = scrollY > 0 ? scrollY : 0;
            }
        };

        window.addEventListener('scroll', updateScrollDirection);
        return () => {
            window.removeEventListener('scroll', updateScrollDirection);
        };
    }, []); // Remove dependency on scrollDirection to avoid re-binding loop

    return scrollDirection;
};
