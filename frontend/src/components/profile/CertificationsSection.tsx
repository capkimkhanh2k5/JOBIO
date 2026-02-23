import React from 'react';
import { Plus, Trash2, Award, ExternalLink, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { SectionWrapper } from './SectionWrapper';
import { useQuery } from '@tanstack/react-query';
import { mockApi } from '../../services/mockApi';

export const CertificationsSection = ({ userId }: { userId: string }) => {
    // Note: mockApi needs to be updated for certifications if we want real mock data, 
    // but for now we can use the pattern or expand mockApi.
    const certifications = [
        {
            id: "cert1",
            certification_name: "AWS Certified Solutions Architect",
            issuing_organization: "Amazon Web Services",
            issue_date: "2023-05-15",
            expiry_date: "2026-05-15",
            credential_url: "https://aws.amazon.com",
            does_not_expire: false
        }
    ];

    return (
        <SectionWrapper title="Chứng chỉ" id="certifications">
            <div className="space-y-4">
                {certifications.map((cert) => (
                    <div key={cert.id} className="glass-effect p-6 rounded-2xl flex gap-4 items-start group">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary">
                            <Award className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between">
                                <h3 className="font-bold">{cert.certification_name}</h3>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <p className="text-sm font-medium text-primary/80">{cert.issuing_organization}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Cấp: {cert.issue_date}
                                </div>
                                {!cert.does_not_expire && (
                                    <div className="text-amber-500">Hết hạn: {cert.expiry_date}</div>
                                )}
                            </div>
                            {cert.credential_url && (
                                <a href={cert.credential_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-3 text-xs text-primary hover:underline font-bold">
                                    Xem chứng chỉ <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    </div>
                ))}
                <Button variant="outline" className="w-full h-12 border-dashed border-2 rounded-2xl">
                    <Plus className="w-5 h-5 mr-2" />
                    Thêm chứng chỉ
                </Button>
            </div>
        </SectionWrapper>
    );
};
