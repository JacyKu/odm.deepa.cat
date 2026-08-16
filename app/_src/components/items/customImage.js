import Image from 'next/image';
import React from 'react';

export default function CustomImage({ ...props }) {
    const [src, setSrc] = React.useState(props.src);
    try {
        return (
            <Image
                width={props.width}
                height={props.height}
                src={src}
                alt={props.alt}
                onError={() => setSrc(props.altsrc)}
            />
        );
    } catch (e) {
        return null;
    }
}
