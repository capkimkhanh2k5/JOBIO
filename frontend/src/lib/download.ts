export const EXCEL_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

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

export async function downloadFileFromUrl(url: string, filename: string) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Download failed: ${response.status}`);
        const blob = await response.blob();
        downloadBlob(blob, filename, blob.type || 'application/pdf');
    } catch {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}
