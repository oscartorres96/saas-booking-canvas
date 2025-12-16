import { useState, useEffect } from 'react';
import { leadsApi, Lead } from '@/api/leadsApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Search } from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

export function LeadsPanel() {
    const { t, i18n } = useTranslation();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [accessType, setAccessType] = useState<'trial' | 'paid'>('paid');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        try {
            setLoading(true);
            const data = await leadsApi.getPendingLeads();
            setLeads(data);
        } catch (error) {
            console.error('Error loading leads:', error);
            toast.error(t('admin.leads.error_load', { defaultValue: 'Error al cargar leads' }));
        } finally {
            setLoading(false);
        }
    };

    const handleApproveClick = (lead: Lead) => {
        setSelectedLead(lead);
        setShowApproveDialog(true);
    };

    const handleConfirmApprove = async () => {
        if (!selectedLead) return;

        try {
            setProcessing(true);
            await leadsApi.approveLead(selectedLead._id, accessType);

            toast.success(t('admin.leads.success_approve'));
            setShowApproveDialog(false);
            loadLeads(); // Refresh list
        } catch (error) {
            console.error('Error approving lead:', error);
            toast.error(t('admin.leads.error_approve', { defaultValue: 'Error al aprobar lead' }));
        } finally {
            setProcessing(false);
        }
    };

    const handleRejectClick = async (lead: Lead) => {
        if (!window.confirm(t('admin.leads.confirm_reject', { defaultValue: `¿Estás seguro de rechazar la solicitud de ${lead.name}?` }))) return;

        try {
            await leadsApi.rejectLead(lead._id, 'Rechazado por admin');
            toast.success(t('admin.leads.success_reject'));
            loadLeads();
        } catch (error) {
            console.error('Error rejecting lead:', error);
            toast.error(t('admin.leads.error_reject', { defaultValue: 'Error al rechazar lead' }));
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    const dateLocale = i18n.language === 'es' ? es : enUS;

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-xl flex items-center justify-between">
                    {t('admin.leads.title')}
                    <Badge variant="secondary">{leads.length}</Badge>
                </CardTitle>
                <CardDescription>
                    {t('admin.leads.description', { defaultValue: 'Aprueba o rechaza solicitudes de nuevos clientes.' })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {leads.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        {t('admin.leads.empty')}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Empresa</TableHead>
                                    <TableHead>Contacto</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead className="text-right">{t('admin.leads.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads.map((lead) => (
                                    <TableRow key={lead._id}>
                                        <TableCell className="whitespace-nowrap">
                                            {format(new Date(lead.createdAt), 'dd MMM yyyy', { locale: dateLocale })}
                                            <div className="text-xs text-muted-foreground">
                                                {format(new Date(lead.createdAt), 'HH:mm', { locale: dateLocale })}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{lead.name}</TableCell>
                                        <TableCell>{lead.company || '-'}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">{lead.email}</div>
                                            <div className="text-xs text-muted-foreground">{lead.phone || '-'}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{lead.type}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleRejectClick(lead)}
                                            >
                                                <XCircle className="h-4 w-4 mr-1" />
                                                {t('admin.leads.reject')}
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleApproveClick(lead)}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                {t('admin.leads.approve')}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Approve Dialog */}
                <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('admin.leads.approve_dialog.title')}: {selectedLead?.name}</DialogTitle>
                            <DialogDescription>
                                {t('admin.leads.approve_dialog.description', { name: selectedLead?.name })}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${accessType === 'paid' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}
                                onClick={() => setAccessType('paid')}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold flex items-center">
                                        <span className="w-4 h-4 rounded-full border border-primary mr-2 flex items-center justify-center">
                                            {accessType === 'paid' && <div className="w-2 h-2 rounded-full bg-primary" />}
                                        </span>
                                        {t('admin.leads.approve_dialog.paid')}
                                    </h4>
                                    <Badge>Recomendado</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground pl-6">
                                    El cliente deberá suscribirse ($299/mes) para usar el sistema.
                                </p>
                            </div>

                            <div
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${accessType === 'trial' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}
                                onClick={() => setAccessType('trial')}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold flex items-center">
                                        <span className="w-4 h-4 rounded-full border border-primary mr-2 flex items-center justify-center">
                                            {accessType === 'trial' && <div className="w-2 h-2 rounded-full bg-primary" />}
                                        </span>
                                        {t('admin.leads.approve_dialog.trial')}
                                    </h4>
                                </div>
                                <p className="text-sm text-muted-foreground pl-6">
                                    El cliente tendrá acceso completo por 14 días sin necesidad de pagar.
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>{t('common.cancel', { defaultValue: 'Cancelar' })}</Button>
                            <Button onClick={handleConfirmApprove} disabled={processing}>
                                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                {t('admin.leads.approve_dialog.confirm')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
