import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Trash2, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { companyService } from '@/services/companyService';
import type { CompanyMemberRole, CompanyMemberStatus } from '@/types/api';

const editableRoles: Exclude<CompanyMemberRole, 'owner'>[] = ['admin', 'recruiter', 'viewer'];
const statuses: CompanyMemberStatus[] = ['active', 'invited', 'disabled'];

export default function CompanyTeamPage() {
    const qc = useQueryClient();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<Exclude<CompanyMemberRole, 'owner'>>('recruiter');

    const { data: company, isLoading: loadingCompany } = useQuery({
        queryKey: ['company', 'me'],
        queryFn: () => companyService.getMyCompany().then(r => r.data),
    });

    const companyId = company?.id;
    const { data: members = [], isLoading } = useQuery({
        queryKey: ['company', companyId, 'members'],
        queryFn: () => companyService.listMembers(Number(companyId)).then(r => r.data),
        enabled: !!companyId,
    });

    const invalidate = () => qc.invalidateQueries({ queryKey: ['company', companyId, 'members'] });

    const addMutation = useMutation({
        mutationFn: () => companyService.addMember(Number(companyId), { email, role, status: 'active' }),
        onSuccess: () => {
            setEmail('');
            setRole('recruiter');
            invalidate();
            toast.success('Đã thêm thành viên');
        },
        onError: (error: any) => toast.error(error?.response?.data?.detail || 'Không thể thêm thành viên'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, nextRole, nextStatus }: { id: number; nextRole?: Exclude<CompanyMemberRole, 'owner'>; nextStatus?: CompanyMemberStatus }) =>
            companyService.updateMember(Number(companyId), id, { role: nextRole, status: nextStatus }),
        onSuccess: () => {
            invalidate();
            toast.success('Đã cập nhật thành viên');
        },
        onError: (error: any) => toast.error(error?.response?.data?.detail || 'Không thể cập nhật thành viên'),
    });

    const removeMutation = useMutation({
        mutationFn: (id: number) => companyService.removeMember(Number(companyId), id),
        onSuccess: () => {
            invalidate();
            toast.success('Đã xóa thành viên');
        },
        onError: (error: any) => toast.error(error?.response?.data?.detail || 'Không thể xóa thành viên'),
    });

    return (
        <div className="p-6 lg:p-8 space-y-6 w-full flex-1">
            <div>
                <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-foreground">
                    <Users className="h-6 w-6 text-teal-600" />
                    Team & Seats
                </h1>
                <p className="mt-1 text-sm font-medium text-muted-foreground">Quản lý HR/recruiter cùng vận hành tuyển dụng của công ty</p>
            </div>

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    if (!companyId || !email) return;
                    addMutation.mutate();
                }}
                className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[minmax(0,1fr)_180px_auto]"
            >
                <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    required
                    placeholder="email@company.com"
                    className="h-11 rounded-xl border border-border px-4 text-sm font-medium outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/10"
                />
                <select
                    value={role}
                    onChange={(event) => setRole(event.target.value as Exclude<CompanyMemberRole, 'owner'>)}
                    className="h-11 rounded-xl border border-border bg-card px-3 text-sm font-bold outline-none focus:border-teal-400"
                >
                    {editableRoles.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
                <Button type="submit" className="h-11 rounded-xl bg-teal-600 font-bold text-white hover:bg-teal-700" disabled={addMutation.isPending || loadingCompany}>
                    {addMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    Thêm
                </Button>
            </form>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
                <table className="w-full text-sm">
                    <thead className="border-b border-border/60 bg-muted">
                        <tr>
                            <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground">Thành viên</th>
                            <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground">Role</th>
                            <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground">Status</th>
                            <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted-foreground">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr><td colSpan={4} className="py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-teal-600" /></td></tr>
                        ) : members.length === 0 ? (
                            <tr><td colSpan={4} className="py-16 text-center text-sm font-medium text-muted-foreground/60">Chưa có thành viên</td></tr>
                        ) : members.map(member => (
                            <tr key={member.id} className="hover:bg-muted/60">
                                <td className="px-5 py-4">
                                    <p className="font-bold text-foreground">{member.user_name || member.user_email}</p>
                                    <p className="text-xs font-medium text-muted-foreground">{member.user_email}</p>
                                </td>
                                <td className="px-5 py-4">
                                    {member.role === 'owner' ? (
                                        <Badge className="bg-teal-100 text-teal-700">owner</Badge>
                                    ) : (
                                        <select
                                            value={member.role}
                                            onChange={(event) => updateMutation.mutate({ id: member.id, nextRole: event.target.value as Exclude<CompanyMemberRole, 'owner'>, nextStatus: member.status })}
                                            className="h-9 rounded-lg border border-border bg-card px-2 text-xs font-bold"
                                        >
                                            {editableRoles.map(item => <option key={item} value={item}>{item}</option>)}
                                        </select>
                                    )}
                                </td>
                                <td className="px-5 py-4">
                                    {member.role === 'owner' ? (
                                        <Badge variant="outline">active</Badge>
                                    ) : (
                                        <select
                                            value={member.status}
                                            onChange={(event) => updateMutation.mutate({ id: member.id, nextRole: member.role as Exclude<CompanyMemberRole, 'owner'>, nextStatus: event.target.value as CompanyMemberStatus })}
                                            className="h-9 rounded-lg border border-border bg-card px-2 text-xs font-bold"
                                        >
                                            {statuses.map(item => <option key={item} value={item}>{item}</option>)}
                                        </select>
                                    )}
                                </td>
                                <td className="px-5 py-4 text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                                        disabled={member.role === 'owner' || removeMutation.isPending}
                                        onClick={() => removeMutation.mutate(member.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
