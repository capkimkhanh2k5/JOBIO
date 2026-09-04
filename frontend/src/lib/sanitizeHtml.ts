import DOMPurify, { type Config } from 'dompurify';

const htmlConfig: Config = {
    FORCE_BODY: false,
    ADD_TAGS: ['style', 'script', 'link', 'meta', 'head', 'html', 'body', 'title'],
    ADD_ATTR: ['target', 'rel', 'class', 'style', 'src', 'href', 'type', 'id', 'data-cv-path', 'data-cv-editor', 'charset', 'name', 'content'],
    ALLOW_DATA_ATTR: true,
};

export function sanitizeHtml(value?: string | null) {
    if (!value) return '';
    if (typeof window === 'undefined') {
        return value.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    }
    return String(DOMPurify.sanitize(value, htmlConfig));
}

export function sanitizeHtmlDocument(value?: string | null) {
    const body = sanitizeHtml(value);
    return `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body>${body}</body></html>`;
}
