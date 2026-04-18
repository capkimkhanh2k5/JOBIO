import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { taxonomyService } from '@/services/taxonomyService';
import { Plus, Trash2, MapPin, Star } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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
        queryFn: () => taxonomyService.listProvinces().then(r => r.data.results ?? r.data),
        staleTime: 60_000,
    });

    const { data: communes = [], isLoading: communeLoading } = useQuery({
        queryKey: ['communes', row.province_id],
        queryFn: () => taxonomyService.listCommunes({ province_id: Number(row.province_id) }).then(r => r.data.results ?? r.data),
        enabled: !!row.province_id,
        staleTime: 60_000,
    });

    const handleProvinceChange = useCallback((provinceId: string) => {
        const province = provinces.find(p => p.id.toString() === provinceId);
        onUpdate({
            province_id: provinceId,
            province_name: province?.province_name ?? '',
            commune_id: '',
            commune_name: '',
        });
    }, [provinces, onUpdate]);

    const handleCommuneChange = useCallback((communeId: string) => {
        const commune = communes.find(c => c.id.toString() === communeId);
        onUpdate({ commune_id: communeId, commune_name: commune?.commune_name ?? '' });
    }, [communes, onUpdate]);

    const triggerClass = cn(
        'w-full py-2.5 rounded-xl text-sm h-10',
        'bg-white border border-slate-200 text-slate-900 px-3',
        'focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500/40 outline-none',
        'transition-all duration-200 shadow-sm'
    );

    return (
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                        <MapPin size={12} className="text-violet-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-500">Địa điểm #{index + 1}</span>
                </div>
                <div className="flex items-center gap-3">
                    {/* is_primary toggle */}
                    <label className="flex items-center gap-1.5 cursor-pointer group">
                        <Star size={12} className={row.is_primary ? 'text-amber-500 fill-amber-500' : 'text-slate-300 group-hover:text-slate-400'} />
                        <span className="text-xs text-slate-500 font-medium">Chính</span>
                        <Switch
                            checked={row.is_primary}
                            onCheckedChange={v => onUpdate({ is_primary: v })}
                        />
                    </label>
                    {canRemove && (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Province */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-slate-500 mb-1 block font-medium">Tỉnh / Thành phố <span className="text-red-500">*</span></label>
                    {provinceLoading ? (
                        <Skeleton className="h-10 w-full rounded-xl" />
                    ) : (
                        <Select value={row.province_id} onValueChange={handleProvinceChange}>
                            <SelectTrigger className={triggerClass}>
                                <SelectValue placeholder="-- Chọn tỉnh/thành phố --" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-200">
                                {provinces.map(p => (
                                    <SelectItem 
                                        key={p.id} 
                                        value={p.id.toString()} 
                                        className="text-[#0f172a] focus:bg-slate-50 focus:text-[#0f172a] bg-white"
                                        style={{ color: '#0f172a' }}
                                    >
                                        {p.province_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* Commune */}
                <div>
                    <label className="text-xs text-slate-500 mb-1 block font-medium">Quận / Huyện</label>
                    {communeLoading && row.province_id ? (
                        <Skeleton className="h-10 w-full rounded-xl" />
                    ) : (
                        <Select
                            value={row.commune_id}
                            onValueChange={handleCommuneChange}
                            disabled={!row.province_id}
                        >
                            <SelectTrigger className={cn(triggerClass, !row.province_id && 'opacity-40 cursor-not-allowed')}>
                                <SelectValue placeholder="-- Chọn quận/huyện --" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-200">
                                {communes.map(c => (
                                    <SelectItem 
                                        key={c.id} 
                                        value={c.id.toString()} 
                                        className="text-[#0f172a] focus:bg-slate-50 focus:text-[#0f172a] bg-white"
                                        style={{ color: '#0f172a' }}
                                    >
                                        {c.commune_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* Address line */}
            <div>
                <label className="text-xs text-slate-500 mb-1 block font-medium">Địa chỉ cụ thể</label>
                <input
                    type="text"
                    value={row.address_line}
                    onChange={e => onUpdate({ address_line: e.target.value })}
                    placeholder="Số nhà, tên đường..."
                    className={cn(triggerClass, 'w-full placeholder:text-slate-400')}
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
                    'w-full py-3 rounded-xl border border-dashed border-slate-300',
                    'flex items-center justify-center gap-2 text-sm text-slate-400 font-medium',
                    'hover:border-violet-500/40 hover:text-violet-600 hover:bg-violet-50/30 transition-all duration-200',
                    'group'
                )}
            >
                <Plus size={15} className="group-hover:rotate-90 transition-transform duration-200" />
                Thêm địa điểm làm việc
            </button>
        </div>
    );
}
