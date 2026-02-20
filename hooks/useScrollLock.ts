import { useEffect } from 'react';

let lockCount = 0;

export const useScrollLock = (lock: boolean = true) => {
    useEffect(() => {
        if (!lock) return;

        if (lockCount === 0) {
            document.body.style.overflow = 'hidden';
        }
        lockCount++;

        return () => {
            lockCount--;
            if (lockCount <= 0) {
                document.body.style.overflow = '';
                lockCount = 0;
            }
        };
    }, [lock]);
};
