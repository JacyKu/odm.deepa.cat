import styles from '../styles/HomeButton.module.css';
import Link from 'next/link';
import { getOdmBase } from '../utils/base';

function HomeIcon() {
    return (
        <svg viewBox="0 0 24 24" width="50" height="50" fill="currentColor" aria-hidden="true">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
    );
}

export default function HomeButton() {
    return (
        <div className={styles.homebutton} title="Go to homepage">
            <Link href={getOdmBase() + '/'} className={styles.button}>
                <HomeIcon />
            </Link>
        </div>
    );
}
