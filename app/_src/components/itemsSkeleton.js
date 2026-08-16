import styles from '../styles/Items.module.css';

export default function ItemsSkeleton() {
    return (
        <div className={styles.main}>
            <h1>Monumenta Items</h1>
            <div className={styles.skeletonSearchForm}>
                <div className={styles.skeletonRow}>
                    <div className={`${styles.skeleton} ${styles.skeletonInput}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonInput}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonButton}`} />
                </div>
                <div className={styles.skeletonRow}>
                    <div className={`${styles.skeleton} ${styles.skeletonInput}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonButton}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonButton}`} />
                </div>
            </div>
            <div className={`${styles.skeleton} ${styles.skeletonLine}`} />
            <div className={styles.skeletonGrid}>
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className={`${styles.skeleton} ${styles.skeletonTile}`}>
                        <div className={`${styles.skeleton} ${styles.skeletonIcon}`} />
                        <div className={`${styles.skeleton} ${styles.skeletonText}`} />
                        <div className={`${styles.skeleton} ${styles.skeletonText}`} />
                        <div className={`${styles.skeleton} ${styles.skeletonTextShort}`} />
                    </div>
                ))}
            </div>
        </div>
    );
}
