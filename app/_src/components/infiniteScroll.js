'use client';

import React from 'react';

// Replacement for react-infinite-scroll-component:
// loads more items when the sentinel element scrolls into view.
export default function InfiniteScroll({ className, children, next, hasMore = true, loader }) {
    const sentinelRef = React.useRef(null);

    React.useEffect(() => {
        if (!sentinelRef.current || !hasMore) return;
        const el = sentinelRef.current;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    next();
                }
            },
            { rootMargin: '200px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, next]);

    return (
        <div className={className}>
            {children}
            {hasMore ? <div ref={sentinelRef} /> : loader}
        </div>
    );
}
