import { useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, MapPin, Star } from 'lucide-react';
import { taxonomyService } from '@/services/taxonomyService';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Combobox } from '@/components/ui/combobox';
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
        queryFn: () => taxonomyService.listProvinces(),
        staleTime: 60_000,
    });

    const { data: communes = [], isLoading: communeLoading } = useQuery({
        queryKey: ['communes', row.province_id],
        queryFn: () => taxonomyService.listCommunes({ province_id: Number(row.province_id) }),
        enabled: !!row.province_id,
        staleTime: 60_000,
    });

    const handleProvinceChange = useCallback((provinceId: string) => {
        const province = provinces.find((p) => p.id.toString() === provinceId);
        onUpdate({
            province_id: provinceId,
            province_name: province?.province_name ?? '',
            commune_id: '',
            commune_name: '',
        });
    }, [provinces, onUpdate]);

    const handleCommuneChange = useCallback((communeId: string) => {
        const commune = communes.find((c) => c.id.toString() === communeId);
        onUpdate({
            commune_id: communeId,
            commune_name: commune?.commune_name ?? '',
        });
    }, [communes, onUpdate]);

    const triggerClass = cn(
        'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm',
        'outline-none transition-all duration-200 focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/5'
    );

    const provinceOptions = provinces.map((province) => ({
        value: province.id.toString(),
        label: province.province_name,
    }));

    const communeOptions = communes.map((commune) => ({
        value: commune.id.toString(),
        label: commune.commune_name,
    }));

    return (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100">
                        <MapPin size={12} className="text-violet-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-500">Địa điểm #{index + 1}</span>
                </div>
                <div className="flex items-center gap-3">
                    <label className="group flex cursor-pointer items-center gap-1.5">
                        <Star size={12} className={row.is_primary ? 'fill-amber-500 text-amber-500' : 'text-slate-300 group-hover:text-slate-400'} />
                        <span className="text-xs font-medium text-slate-500">Chính</span>
                        <Switch checked={row.is_primary} onCheckedChange={(checked) => onUpdate({ is_primary: checked })} />
                    </label>
                    {canRemove && (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="p-1 text-slate-300 transition-colors hover:text-red-500"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                        Tỉnh / Thành phố <span className="text-red-500">*</span>
                    </label>
                    {provinceLoading ? (
                        <Skeleton className="h-10 w-full rounded-xl" />
                    ) : (
                        <Combobox
                            options={provinceOptions}
                            value={row.province_id}
                            onChange={(value) => handleProvinceChange(String(value))}
                            placeholder="-- Chọn tỉnh/thành phố --"
                            searchPlaceholder="Tìm tỉnh/thành phố..."
                            emptyMessage="Không tìm thấy tỉnh/thành phố phù hợp."
                            className={cn(triggerClass, 'justify-between font-normal')}
                        />
                    )}
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Quận / Huyện</label>
                    {communeLoading && row.province_id ? (
                        <Skeleton className="h-10 w-full rounded-xl" />
                    ) : (
                        <Combobox
                            options={communeOptions}
                            value={row.commune_id}
                            onChange={(value) => handleCommuneChange(String(value))}
                            disabled={!row.province_id}
                            placeholder="-- Chọn quận/huyện --"
                            searchPlaceholder="Tìm quận/huyện..."
                            emptyMessage="Không tìm thấy quận/huyện phù hợp."
                            className={cn(
                                triggerClass,
                                'justify-between font-normal',
                                !row.province_id && 'cursor-not-allowed opacity-40'
                            )}
                        />
                    )}
                </div>
            </div>

            <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Địa chỉ cụ thể</label>
                <input
                    type="text"
                    value={row.address_line}
                    onChange={(e) => onUpdate({ address_line: e.target.value })}
                    placeholder="Số nhà, tên đường..."
                    className={cn(triggerClass, 'placeholder:text-slate-400')}
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
                id: `loc_${Math.random().toString(36).substring(2, 7)}`,
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
        const newRows = value.filter((row) => row.id !== id);
        if (newRows.length > 0 && !newRows.some((row) => row.is_primary)) {
            newRows[0].is_primary = true;
        }
        onChange(newRows);
    };

    const updateRow = (id: string, patch: Partial<LocationRow>) => {
        let updated = value.map((row) => (row.id === id ? { ...row, ...patch } : row));
        if (patch.is_primary) {
            updated = updated.map((row) => (row.id === id ? row : { ...row, is_primary: false }));
        }
        onChange(updated);
    };

    useEffect(() => {
        if (value.length === 0) {
            addRow();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="space-y-3">
            {value.map((row, idx) => (
                <LocationRowItem
                    key={row.id}
                    row={row}
                    index={idx}
                    onUpdate={(patch) => updateRow(row.id, patch)}
                    onRemove={() => removeRow(row.id)}
                    canRemove={value.length > 1}
                />
            ))}

            <button
                type="button"
                onClick={addRow}
                className={cn(
                    'group flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-400',
                    'transition-all duration-200 hover:border-violet-500/40 hover:bg-violet-50/30 hover:text-violet-600'
                )}
            >
                <Plus size={15} className="transition-transform duration-200 group-hover:rotate-90" />
                Thêm địa điểm làm việc
            </button>
        </div>
    );
}
