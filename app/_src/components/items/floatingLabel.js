import React from 'react';

// Wraps a react-select with a label that sits inside the control and
// floats up to the top edge when the control is focused or has a value.
export default function FloatingLabel({ label, children }) {
    const [focused, setFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);
    const wrapperRef = React.useRef(null);

    React.useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const check = () => {
            setHasValue(!!el.querySelector('[class*="-singleValue"]'));
        };
        check();
        const observer = new MutationObserver(check);
        observer.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const floating = focused || hasValue;

    const child = React.cloneElement(children, {
        onFocus: (e) => {
            setFocused(true);
            children.props.onFocus?.(e);
        },
        onBlur: (e) => {
            setFocused(false);
            children.props.onBlur?.(e);
        },
    });

    return (
        <div ref={wrapperRef} style={{ position: 'relative' }}>
            {child}
            <span
                style={{
                    position: 'absolute',
                    left: 12,
                    top: floating ? -8 : '50%',
                    transform: floating ? 'none' : 'translateY(-50%)',
                    fontSize: floating ? 11 : 14,
                    lineHeight: 1,
                    background: floating ? 'var(--glass-1)' : 'transparent',
                    padding: floating ? '0 4px' : 0,
                    color: 'var(--text-2)',
                    pointerEvents: 'none',
                    transition:
                        'top 120ms ease, transform 120ms ease, font-size 120ms ease, background-color 120ms ease',
                    zIndex: 1,
                    whiteSpace: 'nowrap',
                    maxWidth: 'calc(100% - 24px)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}
            >
                {label}
            </span>
        </div>
    );
}
