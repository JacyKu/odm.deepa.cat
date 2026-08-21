import styles from '../styles/Items.module.css';
import dbStyles from '../styles/Database.module.css';

// Skeleton grid shown while the first page of public builds loads. Mirrors
// the BuildCard grid layout (title, tag chips, author/date footer).
export default function DatabaseSkeleton() {
    return (
        <div className={dbStyles.skeletonCards}>
            {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className={`${styles.skeleton} ${dbStyles.skeletonCard}`}>
                    <div className={`${styles.skeleton} ${dbStyles.skeletonCardTitle}`} />
                    <div className={`${styles.skeleton} ${dbStyles.skeletonCardRow}`} />
                    <div className={`${styles.skeleton} ${dbStyles.skeletonCardRowShort}`} />
                    <div className={`${styles.skeleton} ${dbStyles.skeletonCardFooter}`} />
                </div>
            ))}
        </div>
    );
}
