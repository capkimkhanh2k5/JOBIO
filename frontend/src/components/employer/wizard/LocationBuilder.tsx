import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mockApi } from '@/services/mockApi';
import { Plus, Trash2, MapPin, Star } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface LocationRow {
    id: string;
    province_id: string;
    province_name: string;
    commune_id: string;
    commune_name: string;
    address_line: string;
    is_primary: boolean;
}

interface LocationBuilderProps {
    value: LocationRow[];
    onChange: (rows: LocationRow[]) => void;
}

function LocationRowItem({
    row,
    index,
    onUpdate,
    onRemove,
    canRemove,
}: {
    row: LocationRow;
    index: number;
    onUpdate: (patch: Partial<LocationRow>) => void;
    onRemove: () => void;
    canRemove: boolean;
}) {
    const { data: provinces = [], isLoading: provinceLoading } = useQuery({
        queryKey: ['provinces-detailed'],
        queryFn: () => mockApi.getProvincesDetailed(),
        staleTime: 60_000,
    });

    const { data: communes = [], isLoading: communeLoading } = useQuery({
        queryKey: ['communes', row.province_id],
        queryFn: () => mockApi.getCommunesByProvince(row.province_id),
        enabled: !!row.province_id,
        staleTime: 60_000,
    });

    const handleProvinceChange = useCallback((provinceId: string) => {
        const province = provinces.find(p => p.id === provinceId);
        onUpdate({
            province_id: provinceId,
            province_name: province?.name ?? '',
            commune_id: '',
            commune_name: '',
        });
    }, [provinces, onUpdate]);

    const handleCommuneChange = useCallback((communeId: string) => {
        const commune = communes.find(c => c.id === communeId);
        onUpdate({ commune_id: communeId, commune_name: commune?.name ?? '' });
    }, [communes, onUpdate]);

    const selectClass = cn(
        'w-full px-3 py-2.5 rounded-xl text-sm',
        'bg-white/5 border border-white/10 text-white',
        'focus:outline-none focus:border-cyan-500/40',
        'transition-all duration-200 appearance-none cursor-pointer'
    );

    return (
        <div className="p-4 rounded-xl border border-white/10 bg-white/3 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center">
                        <MapPin size={12} className="text-cyan-400" />
                    </div>
                    <span className="text-xs font-semibold text-white/60">Địa điểm #{index + 1}</span>
                </div>
                <div className="flex items-center gap-3">
                    {/* is_primary toggle */}
                    <label className="flex items-center gap-1.5 cursor-pointer">
                        <Star size={12} className={row.is_primary ? 'text-amber-400' : 'text-white/30'} />
                        <span className="text-xs text-white/50">Chính</span>
                        <Switch
                            checked={row.is_primary}
                            onCheckedChange={v => onUpdate({ is_primary: v })}
                            className="scale-75"
                        />
                    </label>
                    {canRemove && (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="text-white/30 hover:text-red-400 transition-colors p-1"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Province */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-white/50 mb-1 block">Tỉnh / Thành phố <span className="text-red-400">*</span></label>
                    {provinceLoading ? (
                        <Skeleton className="h-10 w-full rounded-xl" />
                    ) : (
                        <select value={row.province_id} onChange={e => handleProvinceChange(e.target.value)} className={selectClass}>
                            <option value="" className="bg-[#0f1117]">-- Chọn tỉnh/thành phố --</option>
                            {provinces.map(p => (
                                <option key={p.id} value={p.id} className="bg-[#0f1117]">{p.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Commune */}
                <div>
                    <label className="text-xs text-white/50 mb-1 block">Quận / Huyện</label>
                    {communeLoading && row.province_id ? (
                        <Skeleton className="h-10 w-full rounded-xl" />
                    ) : (
                        <select
                            value={row.commune_id}
                            onChange={e => handleCommuneChange(e.target.value)}
                            disabled={!row.province_id}
                            className={cn(selectClass, !row.province_id && 'opacity-40 cursor-not-allowed')}
                        >
                            <option value="" className="bg-[#0f1117]">-- Chọn quận/huyện --</option>
                            {communes.map(c => (
                                <option key={c.id} value={c.id} className="bg-[#0f1117]">{c.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Address line */}
            <div>
                <label className="text-xs text-white/50 mb-1 block">Địa chỉ cụ thể</label>
                <input
                    type="text"
                    value={row.address_line}
                    onChange={e => onUpdate({ address_line: e.target.value })}
                    placeholder="Số nhà, tên đường..."
                    className={cn(selectClass, 'w-full appearance-none placeholder:text-white/30')}
                />
            </div>
        </div>
    );
}

export function LocationBuilder({ value, onChange }: LocationBuilderProps) {
    const addRow = () => {
        onChange([
            ...value,
            {
                id: 'loc_' + Math.random().toString(36).substring(2, 7),
                province_id: '',
                province_name: '',
                commune_id: '',
                commune_name: '',
                address_line: '',
                is_primary: value.length === 0,
            },
        ]);
    };

    const removeRow = (id: string) => {
        const newRows = value.filter(r => r.id !== id);
        // Ensure first row is primary
        if (newRows.length > 0 && !newRows.some(r => r.is_primary)) {
            newRows[0].is_primary = true;
        }
        onChange(newRows);
    };

    const updateRow = (id: string, patch: Partial<LocationRow>) => {
        let updated = value.map(r => r.id === id ? { ...r, ...patch } : r);
        // If setting is_primary, unset others
        if (patch.is_primary) {
            updated = updated.map(r => r.id === id ? r : { ...r, is_primary: false });
        }
        onChange(updated);
    };

    // Init with one empty row
    useEffect(() => {
        if (value.length === 0) addRow();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="space-y-3">
            {value.map((row, idx) => (
                <LocationRowItem
                    key={row.id}
                    row={row}
                    index={idx}
                    onUpdate={patch => updateRow(row.id, patch)}
                    onRemove={() => removeRow(row.id)}
                    canRemove={value.length > 1}
                />
            ))}

            <button
                type="button"
                onClick={addRow}
                className={cn(
                    'w-full py-3 rounded-xl border border-dashed border-white/20',
                    'flex items-center justify-center gap-2 text-sm text-white/40',
                    'hover:border-cyan-500/40 hover:text-cyan-400 transition-all duration-200',
                    'group'
                )}
            >
                <Plus size={15} className="group-hover:rotate-90 transition-transform duration-200" />
                Thêm địa điểm làm việc
            </button>
        </div>
    );
}
