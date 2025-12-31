
import React from 'react';

interface ResourceMapSnapshot {
    enabled: boolean;
    rows: number;
    cols: number;
    resources: {
        id: string;
        label: string;
        isActive: boolean;
        position: {
            row: number;
            col: number;
        };
    }[];
}

interface BookingResourceMapMiniPreviewProps {
    resourceMapSnapshot?: ResourceMapSnapshot;
    reservedResourceId?: string;
    size?: 'xs' | 'sm';
}

const BookingResourceMapMiniPreview: React.FC<BookingResourceMapMiniPreviewProps> = ({
    resourceMapSnapshot,
    reservedResourceId,
    size = 'xs'
}) => {
    if (!resourceMapSnapshot || !resourceMapSnapshot.enabled || !resourceMapSnapshot.resources) {
        return null;
    }

    const { rows, cols, resources } = resourceMapSnapshot;

    // Visual constants
    const dotSize = size === 'xs' ? 6 : 8;
    const gap = size === 'xs' ? 6 : 8;
    const padding = 4;

    const width = cols * (dotSize + gap) - gap + 2 * padding;
    const height = rows * (dotSize + gap) - gap + 2 * padding;

    return (
        <div className="flex flex-col items-center justify-center py-2 w-full">
            <div
                className="relative bg-gray-50/50 rounded-lg p-1"
                style={{
                    width: 'fit-content',
                    height: 'fit-content',
                    maxHeight: '64px',
                    overflow: 'hidden'
                }}
            >
                <svg
                    width={width}
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                    style={{ display: 'block' }}
                >
                    {resources.map((res) => {
                        if (!res.isActive) return null; // Don't render inactive/disabled spots to respect map layout
                        const isReserved = res.id === reservedResourceId;
                        const x = padding + res.position.col * (dotSize + gap) + dotSize / 2;
                        const y = padding + res.position.row * (dotSize + gap) + dotSize / 2;

                        return (
                            <circle
                                key={res.id}
                                cx={x}
                                cy={y}
                                r={dotSize / 2}
                                fill={isReserved ? 'var(--primary, #4338ca)' : '#D1D5DB'}
                                className={isReserved ? 'animate-pulse' : ''}
                            />
                        );
                    })}
                </svg>
            </div>
            <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-medium">
                {reservedResourceId ? 'Tu lugar reservado' : 'Ubicación'}
            </span>
        </div>
    );
};

export default BookingResourceMapMiniPreview;
