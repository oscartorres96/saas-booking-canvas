
export function generateResourceMapPreview(resourceMapSnapshot: any, reservedResourceId: string, primaryColor: string = '#4338ca'): string {
    if (!resourceMapSnapshot || !resourceMapSnapshot.enabled) return '';

    const { rows = 5, cols = 5, resources = [] } = resourceMapSnapshot;

    // Visual constants
    const padding = 5;
    const gap = 8;
    const dotSize = 8;

    const width = cols * (dotSize + gap) - gap + 2 * padding;
    const height = rows * (dotSize + gap) - gap + 2 * padding;

    const dots = resources.map((res: any) => {
        const isReserved = res.id === reservedResourceId;
        const x = padding + res.position.col * (dotSize + gap) + dotSize / 2;
        const y = padding + res.position.row * (dotSize + gap) + dotSize / 2;
        const color = isReserved ? primaryColor : '#D1D5DB';

        return `<circle cx="${x}" cy="${y}" r="${dotSize / 2}" fill="${color}" />`;
    }).join('\n');

    const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="transparent" />
      ${dots}
    </svg>
  `.trim();

    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
}
