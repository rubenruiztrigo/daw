import { useEffect } from 'react';

let lockCount = 0;
let savedScrollY = 0;

export const useScrollLock = (lock: boolean = true) => {
    useEffect(() => {
        if (!lock) return;

        if (lockCount === 0) {
            savedScrollY = window.scrollY;
            document.body.style.overflow = 'hidden';
        }
        lockCount++;

        return () => {
            lockCount--;
            if (lockCount <= 0) {
                document.body.style.overflow = '';
                lockCount = 0;
                // Wait for the browser to reflow (scrollbar reappears) before restoring position
                requestAnimationFrame(() => {
                    window.scrollTo({ top: savedScrollY, behavior: 'instant' as ScrollBehavior });
                });
            }
        };
    }, [lock]);
};
