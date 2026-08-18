import React from 'react';
import searchStyles from '../../styles/SearchForm.module.css';
import { useHideLore } from './hideLoreContext';

export default function LoreToggle({ className } = {}) {
    const { hidden, toggle } = useHideLore();
    return (
        <label className={`${searchStyles.toggleLabel} ${className || ''}`}>
            <input type="checkbox" checked={hidden} onChange={toggle} aria-label="Hide lore" />
            Hide lore
        </label>
    );
}
