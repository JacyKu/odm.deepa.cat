const BAD_WORD_STEMS = [
    'faggot',
    'nigger',
    'nigga',
    'tranny',
];

const badWordRegex = new RegExp('\\b(?:' + BAD_WORD_STEMS.join('|') + ')\\w*', 'gi');

export function filterBadWords(text) {
    if (!text) return { cleaned: text, found: false };
    badWordRegex.lastIndex = 0;
    const found = badWordRegex.test(text);
    badWordRegex.lastIndex = 0;
    if (!found) return { cleaned: text, found: false };
    const cleaned = text.replace(badWordRegex, ' ').replace(/\s{2,}/g, ' ').trim();
    return { cleaned, found };
}
