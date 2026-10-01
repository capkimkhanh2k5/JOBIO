import { getStoredTokens } from '@/lib/authStorage';

export const EXCEL_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
const API_PATH_PREFIX = '/' + 'api/';

export function downloadBlob(data: BlobPart, filename: string, mimeType = EXCEL_MIME_TYPE) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

function resolveDownloadUrl(url: string) {
    if (url.startsWith('/')) {
        return `${API_BASE_URL}${url}`;
    }
    return url;
}

function shouldAttachAuth(url: string) {
    if (url.startsWith(API_PATH_PREFIX)) return true;

    try {
        const target = new URL(url, window.location.origin);
        const apiBase = new URL(API_BASE_URL, window.location.origin);
        return target.origin === apiBase.origin && target.pathname.startsWith(API_PATH_PREFIX);
    } catch {
        return false;
    }
}

export async function fetchFileBlobFromUrl(url: string) {
    const resolvedUrl = resolveDownloadUrl(url);
    const headers: Record<string, string> = {};
    const { accessToken } = getStoredTokens();

    if (accessToken && shouldAttachAuth(url)) {
        headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(resolvedUrl, { headers });
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);
    return response.blob();
}

export async function createObjectUrlFromFileUrl(url: string) {
    const blob = await fetchFileBlobFromUrl(url);
    return window.URL.createObjectURL(blob);
}

export async function downloadFileFromUrl(url: string, filename: string) {
    try {
        const blob = await fetchFileBlobFromUrl(url);
        downloadBlob(blob, filename, blob.type || 'application/pdf');
    } catch {
        window.open(resolveDownloadUrl(url), '_blank', 'noopener,noreferrer');
    }
}
