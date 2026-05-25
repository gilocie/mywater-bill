
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Bill, User } from '@/app/lib/mock-data';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Receipt, 
  Printer, 
  Download, 
  ExternalLink,
  FileSearch,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Droplets,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function BillingPage() {
  const { user, waterRate, settings } = useAuth();
  const { toast } = useToast();
  const [bills, setBills] = useState<Bill[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);

  // Pagination & selection
  const [perPage, setPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Currency helper – 2 decimal places
  const fmt = (val: number) =>
    Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  useEffect(() => {
    const loadBills = () => {
      const stored = localStorage.getItem('mywater_all_bills');
      if (stored) {
        const all: Bill[] = JSON.parse(stored);
        if (user?.role === 'CUSTOMER') {
          setBills(all.filter(b => b.customerId === user.id));
        } else {
          setBills(all);
        }
      }
    };
    loadBills();
    window.addEventListener('storage', loadBills);
    return () => window.removeEventListener('storage', loadBills);
  }, [user]);

  const getStatusBadge = (status: Bill['status']) => {
    switch(status) {
      case 'PAID': return <Badge className="bg-green-500/20 text-green-500 border-green-500/30 rounded-[5px]"><CheckCircle2 className="h-3 w-3 mr-1" /> Paid</Badge>;
      case 'PENDING': return <Badge variant="secondary" className="bg-slate-800 text-slate-400 rounded-[5px]"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'OVERDUE': return <Badge variant="destructive" className="bg-red-500/20 text-red-500 border-red-500/30 rounded-[5px]"><AlertTriangle className="h-3 w-3 mr-1" /> Overdue</Badge>;
    }
  };

  const handlePrint = () => { window.print(); };

  const handleDownloadReceipt = () => {
    if (!receiptData) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 450;
    canvas.height = 650;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, 110);
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(45, 55, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 15px sans-serif';
    ctx.fillText('MWB', 32, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('MALAWI WATER BOARD', 80, 50);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('OFFICIAL PAYMENT RECEIPT', 80, 70);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 110, canvas.width, 60);
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('RECEIPT NO.', 30, 132);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(receiptData.txId, 30, 152);
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('DATE & TIME', 270, 132);
    ctx.fillStyle = '#0f172a';
    ctx.font = '11px sans-serif';
    ctx.fillText(receiptData.date.split(',')[0], 270, 152);
    ctx.fillStyle = '#f0fdf4';
    ctx.fillRect(30, 190, canvas.width - 60, 95);
    ctx.strokeStyle = '#bbf7d0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(30, 190, canvas.width - 60, 95);
    ctx.fillStyle = '#166534';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AMOUNT', canvas.width / 2, 215);
    ctx.fillStyle = '#15803d';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(`MK ${receiptData.amount?.toLocaleString()}`, canvas.width / 2, 250);
    ctx.fillStyle = '#166534';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText(receiptData.network?.includes('Settled') ? '✓ SETTLED' : '⚠ PENDING PAYMENT', canvas.width / 2, 272);
    ctx.textAlign = 'left';
    const startY = 320;
    const rowHeight = 35;
    const rows = [
      { label: 'CUSTOMER NAME', value: receiptData.customerName },
      { label: 'METER NUMBER', value: receiptData.meterNumber || 'N/A' },
      { label: 'SERVICE', value: receiptData.product },
      { label: 'NETWORK', value: receiptData.network },
      { label: 'STATUS', value: receiptData.network?.includes('Settled') ? 'Paid' : 'Pending' }
    ];
    rows.forEach((row, index) => {
      const y = startY + index * rowHeight;
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(row.label, 30, y);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(String(row.value), 190, y);
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, y + 10);
      ctx.lineTo(canvas.width - 30, y + 10);
      ctx.stroke();
    });
    const barcodeY = 515;
    ctx.fillStyle = '#0f172a';
    for (let i = 0; i < 55; i++) {
      const w = Math.random() > 0.55 ? 3.5 : 1.5;
      ctx.fillRect(85 + i * 5, barcodeY, w, 40);
    }
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${receiptData.txId} • MWB-SYSTEM-AUDIT`, canvas.width / 2, barcodeY + 58);
    const url = canvas.toDataURL('image/jpeg', 0.95);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receiptData.txId}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "Receipt Downloaded", description: `Receipt image receipt-${receiptData.txId}.jpg has been saved.` });
  };

  const handleViewReceipt = (bill: Bill) => {
    let customerName = user?.name || 'Customer';
    let meterNumber = user?.meterNumber || 'N/A';
    if (user?.role !== 'CUSTOMER') {
      const usersStr = localStorage.getItem('mywater_all_users') || '[]';
      const users: User[] = JSON.parse(usersStr);
      const found = users.find(u => u.id === bill.customerId);
      if (found) { customerName = found.name; meterNumber = found.meterNumber || 'N/A'; }
    }
    setReceiptData({
      txId: `INV-${bill.id.slice(-6).toUpperCase()}`,
      amount: bill.totalAmount,
      phone: 'N/A',
      network: bill.status === 'PAID' ? 'Utility Ledger (Settled)' : 'Utility Ledger (Pending)',
      product: `Water Bill Invoice`,
      date: bill.date,
      customerName,
      meterNumber,
      lastMeterReading: bill.lastMeterReading !== undefined ? bill.lastMeterReading : 0,
      currentMeterReading: bill.currentMeterReading !== undefined ? bill.currentMeterReading : bill.meterReadingLiters,
      consumption: bill.consumption !== undefined ? bill.consumption : bill.meterReadingLiters,
      vatAmount: bill.vatAmount || 0,
      vatRate: bill.vatRate !== undefined ? bill.vatRate : settings?.vatRate ?? 16.5,
      status: bill.status
    });
    setReceiptDialogOpen(true);
  };

  // Delete handlers
  const handleSingleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const stored = localStorage.getItem('mywater_all_bills') || '[]';
    const all: Bill[] = JSON.parse(stored);
    const updated = all.filter(b => b.id !== id);
    localStorage.setItem('mywater_all_bills', JSON.stringify(updated));
    setBills(prev => prev.filter(b => b.id !== id));
    setSelectedIds(prev => prev.filter(i => i !== id));
    toast({ title: "Deleted", description: "Invoice removed from ledger." });
    window.dispatchEvent(new Event('storage'));
  };

  const handleBulkDelete = () => {
    const stored = localStorage.getItem('mywater_all_bills') || '[]';
    const all: Bill[] = JSON.parse(stored);
    const updated = all.filter(b => !selectedIds.includes(b.id));
    localStorage.setItem('mywater_all_bills', JSON.stringify(updated));
    setBills(prev => prev.filter(b => !selectedIds.includes(b.id)));
    toast({ title: "Deleted", description: `${selectedIds.length} invoice(s) removed from ledger.` });
    setSelectedIds([]);
    window.dispatchEvent(new Event('storage'));
  };

  const filteredBills = bills.filter(b => b.id.toLowerCase().includes(searchTerm.toLowerCase()));

  // Pagination math
  const totalItems = filteredBills.length;
  const totalPages = Math.ceil(totalItems / perPage) || 1;
  const startIndex = (page - 1) * perPage;
  const paginatedBills = filteredBills.slice(startIndex, startIndex + perPage);

  const totalInvoiced = bills.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalPaid = bills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);
  const totalOutstanding = bills.filter(b => b.status !== 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);

  const ranges = settings?.waterRateRanges;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Utility Ledger</h2>
          <p className="text-slate-400 font-medium">Historical audit of consumption and settlements.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Invoiced</CardDescription>
            <CardTitle className="text-xl text-white">MK {fmt(totalInvoiced)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Settled Amount</CardDescription>
            <CardTitle className="text-xl text-green-500">MK {fmt(totalPaid)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Outstanding</CardDescription>
            <CardTitle className="text-xl text-red-500">MK {fmt(totalOutstanding)}</CardTitle>
          </CardHeader>
        </Card>

        {/* Pricing Brackets card with view button */}
        <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
          <CardHeader className="pb-1">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Pricing Brackets</CardDescription>
            <CardTitle className="text-lg text-primary font-black">
              {ranges && ranges.length > 0 ? (
                <span>{ranges.length} Range{ranges.length > 1 ? 's' : ''}</span>
              ) : (
                <span>MK {waterRate} / m³</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 pt-0 px-6">
            <div className="text-[9px] text-slate-400 font-mono space-y-0.5 mb-2">
              {ranges?.slice(0, 2).map((r, i) => (
                <div key={i} className="flex justify-between">
                  <span>{r.from}–{r.to === null ? '∞' : r.to} m³:</span>
                  <span className="font-bold text-green-400">MK {r.price}</span>
                </div>
              ))}
              {ranges && ranges.length > 2 && (
                <div className="text-[8px] text-slate-500 italic">+ {ranges.length - 2} more</div>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPricingModalOpen(true)}
              className="w-full h-6 text-[9px] font-bold uppercase border-white/10 text-primary hover:bg-primary/10 hover:border-primary/30 rounded-[5px] gap-1"
            >
              <Layers className="h-3 w-3" /> View Full Pricing
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Invoice History Table */}
      <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
        <CardHeader className="pb-3 pt-6 px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-primary" /> Invoice History
            </CardTitle>
            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              {/* Bulk delete */}
              {selectedIds.length > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDelete}
                  className="h-8 text-[10px] font-bold uppercase rounded-[5px] gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete {selectedIds.length} Selected
                </Button>
              )}
              {/* Per-page selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Show</span>
                <select
                  value={perPage}
                  onChange={e => { setPerPage(Number(e.target.value)); setPage(1); setSelectedIds([]); }}
                  className="bg-slate-800 border border-white/10 text-white text-[11px] font-bold rounded-[5px] px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {[5, 10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-[10px] text-slate-500 font-bold uppercase">per page</span>
              </div>
              {/* Search */}
              <div className="relative flex-1 md:w-52">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <Input 
                  placeholder="Search INV-ID..." 
                  className="pl-9 h-8 bg-slate-950 border-white/5 text-xs text-white rounded-[5px]"
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                />
              </div>
              <Button variant="outline" size="sm" className="h-8 border-white/5 text-[10px] font-bold uppercase tracking-widest gap-2">
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-2">
          {/* Select-all bar */}
          {filteredBills.length > 0 && (
            <div className="flex items-center gap-3 px-2 py-2 mb-2 border-b border-white/5">
              <input
                type="checkbox"
                id="select-all-bills"
                checked={paginatedBills.length > 0 && paginatedBills.every(b => selectedIds.includes(b.id))}
                onChange={e => {
                  if (e.target.checked) {
                    setSelectedIds(prev => Array.from(new Set([...prev, ...paginatedBills.map(b => b.id)])));
                  } else {
                    setSelectedIds(prev => prev.filter(id => !paginatedBills.map(b => b.id).includes(id)));
                  }
                }}
                className="w-3.5 h-3.5 accent-primary cursor-pointer"
              />
              <label htmlFor="select-all-bills" className="text-[10px] font-bold uppercase text-slate-500 cursor-pointer select-none">
                Select all on page
              </label>
              <span className="ml-auto text-[10px] text-slate-600 font-bold">
                {totalItems} record{totalItems !== 1 ? 's' : ''} total
              </span>
            </div>
          )}

          <div className="rounded-[5px] border border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-950/50">
                <TableRow className="border-b border-white/5 hover:bg-transparent">
                  <TableHead className="w-[40px] h-10" />
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Invoice ID</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Billing Date</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Consumption</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Total Amount</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Status</TableHead>
                  <TableHead className="w-[80px] h-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBills.length > 0 ? paginatedBills.map((bill) => {
                  const isSelected = selectedIds.includes(bill.id);
                  return (
                    <TableRow 
                      key={bill.id} 
                      onClick={() => handleViewReceipt(bill)}
                      className={cn(
                        "border-b border-white/5 transition-colors cursor-pointer",
                        isSelected ? "bg-primary/10" : "hover:bg-white/5"
                      )}
                      title="Click to view invoice details"
                    >
                      <TableCell onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => {
                            if (e.target.checked) setSelectedIds(prev => [...prev, bill.id]);
                            else setSelectedIds(prev => prev.filter(i => i !== bill.id));
                          }}
                          className="w-3.5 h-3.5 accent-primary cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="font-mono font-bold text-[10px] text-primary uppercase">
                        INV-{bill.id.slice(-6)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">{bill.date}</TableCell>
                      <TableCell className="text-xs font-bold text-white">
                        {bill.lastMeterReading !== undefined && bill.currentMeterReading !== undefined ? (
                          <span>{bill.lastMeterReading} → {bill.currentMeterReading} ({bill.consumption} m³)</span>
                        ) : (
                          <span>{bill.meterReadingLiters.toLocaleString()} L</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-black text-white">MK {fmt(bill.totalAmount)}</TableCell>
                      <TableCell>{getStatusBadge(bill.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-slate-600 hover:text-white"
                            onClick={(e) => { e.stopPropagation(); handleViewReceipt(bill); }}
                            title="View Receipt"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-slate-600 hover:text-red-400"
                            onClick={(e) => handleSingleDelete(bill.id, e)}
                            title="Delete Invoice"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-slate-600 italic text-xs">
                      No matching records found in utility ledger.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
              <span className="text-[10px] text-slate-500 font-bold">
                Showing {startIndex + 1}–{Math.min(startIndex + perPage, totalItems)} of {totalItems}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm" variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="h-7 w-7 p-0 border-white/10 text-white hover:bg-white/10 disabled:opacity-30 rounded-[5px]"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | string)[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === '…' ? (
                      <span key={`e-${idx}`} className="text-slate-600 text-xs px-1">…</span>
                    ) : (
                      <Button
                        key={p} size="sm"
                        onClick={() => setPage(p as number)}
                        className={cn(
                          "h-7 w-7 p-0 text-[11px] font-bold rounded-[5px] transition-all",
                          page === p
                            ? "bg-primary text-white"
                            : "border border-white/10 bg-transparent text-slate-400 hover:bg-white/10"
                        )}
                      >
                        {p}
                      </Button>
                    )
                  )}
                <Button
                  size="sm" variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="h-7 w-7 p-0 border-white/10 text-white hover:bg-white/10 disabled:opacity-30 rounded-[5px]"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="bg-white text-slate-900 max-w-sm rounded-[5px] p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <div className="bg-slate-900 px-6 py-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-[3px]">
                {settings?.logo ? (
                  <img src={settings.logo} className="h-5 w-5 object-contain" />
                ) : (
                  <Droplets className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xs font-black text-white uppercase tracking-widest">
                  {settings?.companyName || 'Malawi Water Board'}
                </DialogTitle>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Utility Bill Invoice</p>
              </div>
            </div>
            <Receipt className="h-5 w-5 text-primary opacity-70" />
          </div>

          {receiptData && (
            <div className="flex-1 overflow-y-auto">
              <div className="bg-primary/10 border-b border-primary/20 px-6 py-3 flex justify-between items-center">
                <div>
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Invoice ID</p>
                  <p className="text-xs font-black text-slate-800 font-mono">{receiptData.txId}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Billing Date</p>
                  <p className="text-[10px] font-bold text-slate-700">{receiptData.date}</p>
                </div>
              </div>

              <div className="px-6 py-6 text-center border-b border-dashed border-slate-200">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-1">Amount Due</p>
                <p className="text-4xl font-black text-slate-900">
                  <span className="text-primary text-xl">MK</span>{' '}
                  {fmt(receiptData.amount)}
                </p>
                <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${
                  receiptData.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {receiptData.status === 'PAID' ? (
                    <><CheckCircle2 className="h-3 w-3" /><span className="text-[9px] font-black uppercase tracking-wider">Paid / Settled</span></>
                  ) : (
                    <><span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" /><span className="text-[9px] font-black uppercase tracking-wider">Pending Payment</span></>
                  )}
                </div>
              </div>

              <div className="px-6 py-5 space-y-3">
                {[
                  { label: 'Customer Name', value: receiptData.customerName },
                  { label: 'Meter Number', value: receiptData.meterNumber },
                  { label: 'Previous Reading', value: `${receiptData.lastMeterReading} m³` },
                  { label: 'Current Reading', value: `${receiptData.currentMeterReading} m³` },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-400 uppercase tracking-wider">{row.label}</span>
                    <span className="font-black text-slate-800 font-mono">{row.value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-[10px] border-t border-slate-100 pt-2">
                  <span className="font-bold text-primary uppercase tracking-wider font-black">Consumption</span>
                  <span className="font-black text-primary">{receiptData.consumption} m³</span>
                </div>
                <div className="flex justify-between items-center text-[10px] border-t border-slate-100 pt-2">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">Subtotal</span>
                  <span className="font-black text-slate-800">MK {fmt(receiptData.amount - receiptData.vatAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">VAT ({receiptData.vatRate}%)</span>
                  <span className="font-black text-slate-800">MK {fmt(receiptData.vatAmount)}</span>
                </div>
              </div>

              <div className="px-6 pb-4 border-t border-dashed border-slate-200 pt-4">
                <div className="flex justify-center mb-3">
                  <div className="flex gap-px">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div key={i} className="bg-slate-800" style={{ width: `${(i % 3 === 0) ? 3 : 2}px`, height: `${24 + (i % 5) * 4}px` }} />
                    ))}
                  </div>
                </div>
                <p className="text-[8px] text-center text-slate-400 font-mono tracking-widest">
                  {receiptData.txId} • {settings?.companyName?.toUpperCase() || 'MWB-SYSTEM'}
                </p>
              </div>
            </div>
          )}

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2 shrink-0">
            <Button variant="outline" className="flex-1 h-9 text-[10px] font-bold uppercase border-slate-200 text-slate-600 gap-2 rounded-[5px]" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" /> Print Bill
            </Button>
            <Button variant="default" className="flex-1 h-9 bg-slate-900 hover:bg-slate-800 text-[10px] font-bold uppercase text-white rounded-[5px]" onClick={() => setReceiptDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pricing Brackets Modal */}
      <Dialog open={pricingModalOpen} onOpenChange={setPricingModalOpen}>
        <DialogContent className="bg-slate-900 border-white/5 text-white max-w-md rounded-[5px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2 uppercase">
              <Layers className="h-5 w-5 text-primary" /> Water Pricing Structure
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Tiered pricing brackets applied to billing calculations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* VAT info */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-[5px]">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">VAT Rate</span>
              <span className="text-sm font-black text-primary">{settings?.vatRate ?? 16.5}%</span>
            </div>

            {/* Ranges */}
            {ranges && ranges.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[9px] font-bold uppercase text-slate-500 tracking-widest px-1">Tiered Price Brackets (per m³)</p>
                {ranges.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-950/60 border border-white/5 rounded-[5px]">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 bg-primary/20 rounded-[3px] flex items-center justify-center">
                        <span className="text-[9px] font-black text-primary">{i + 1}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white uppercase tracking-wide">Tier {i + 1}</p>
                        <p className="text-[9px] text-slate-500 font-mono">
                          {r.from} – {r.to === null ? '∞ (unlimited)' : `${r.to}`} m³
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-green-400">MK {r.price.toFixed(2)}</p>
                      <p className="text-[8px] text-slate-500 uppercase">per m³</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-950/60 border border-white/5 rounded-[5px] text-center">
                <p className="text-sm font-bold text-white">Flat Rate</p>
                <p className="text-2xl font-black text-primary mt-1">MK {(waterRate ?? 2.5).toFixed(2)}</p>
                <p className="text-[9px] text-slate-500 uppercase font-bold mt-0.5">per cubic metre</p>
              </div>
            )}

            {/* Note */}
            <p className="text-[9px] text-slate-600 text-center font-bold italic pt-1">
              Pricing set by administrator · VAT inclusive in final invoice
            </p>
          </div>

          <DialogFooter>
            <Button onClick={() => setPricingModalOpen(false)} className="w-full h-9 text-xs font-bold uppercase rounded-[5px]">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
