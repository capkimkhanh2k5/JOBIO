function decodeHtmlEntities(value: string) {
    if (typeof document === 'undefined') return value;
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value;
    return textarea.value;
}

export function htmlToPlainText(value?: string | null) {
    if (!value) return '';

    return decodeHtmlEntities(
        value
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p\s*>/gi, '\n\n')
            .replace(/<\/div\s*>/gi, '\n')
            .replace(/<\/li\s*>/gi, '\n')
            .replace(/<li[^>]*>/gi, '- ')
            .replace(/<[^>]+>/g, '')
    )
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

export function splitTextParagraphs(value?: string | null) {
    const text = htmlToPlainText(value);
    return text ? text.split(/\n{2,}/).map(paragraph => paragraph.trim()).filter(Boolean) : [];
}
