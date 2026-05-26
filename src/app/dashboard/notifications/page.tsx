
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Broadcast, SupportTicket, SupportMessage } from '@/app/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, MessageSquare, Send, Clock, Pin, Trash2, LifeBuoy, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function BroadcastsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  
  const [bcDialogOpen, setBcDialogOpen] = useState(false);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);

  const [newBroadcast, setNewBroadcast] = useState({
    title: '',
    message: '',
    target: 'ALL' as any,
    type: 'INFO' as any,
    isPinned: false,
    expiryDate: ''
  });

  const [newTicket, setNewTicket] = useState({ subject: '', message: '' });
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');

  const loadData = () => {
    const storedB = localStorage.getItem('mywater_broadcasts') || '[]';
    setBroadcasts(JSON.parse(storedB));

    const storedT = localStorage.getItem('mywater_support_tickets') || '[]';
    const allTickets: SupportTicket[] = JSON.parse(storedT);
    setTickets(allTickets);

    // Check for deep link to ticket
    const ticketId = searchParams.get('ticketId');
    if (ticketId) {
      const target = allTickets.find(t => t.id === ticketId);
      if (target) setSelectedTicket(target);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [searchParams]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`mywater_last_read_${user.id}`, Date.now().toString());
      // Trigger a sync for the header counter
      window.dispatchEvent(new Event('storage'));
    }
  }, [user?.id]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [selectedTicket?.messages]);

  const activeBroadcasts = useMemo(() => {
    const now = new Date();
    return broadcasts.filter(b => {
      const isTarget = b.target === 'ALL' || 
                      (user?.role === 'CUSTOMER' && b.target === 'CUSTOMERS') ||
                      (user?.role !== 'CUSTOMER' && b.target === 'STAFF');
      const isNotExpired = !b.expiresAt || new Date(b.expiresAt) > now;
      return isTarget && isNotExpired;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [broadcasts, user]);

  const filteredTickets = useMemo(() => {
    if (!user) return [];
    const tics = tickets.filter(t => {
      if (user.role === 'CUSTOMER') return t.customerId === user.id;
      if (user.role === 'SUPER_ADMIN') return true;
      if (t.escalatedTo === 'SUPER_ADMIN') return user.role === 'SUPER_ADMIN'; 
      return t.area === user.area && t.district === user.district;
    });
    return tics.sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime());
  }, [tickets, user]);

  const handleSendBroadcast = () => {
    if (!newBroadcast.title || !newBroadcast.message) return;
    const broadcast: Broadcast = {
      id: `bc-${Date.now()}`,
      title: newBroadcast.title,
      message: newBroadcast.message,
      target: newBroadcast.target,
      type: newBroadcast.type,
      isPinned: newBroadcast.isPinned,
      expiresAt: newBroadcast.expiryDate ? new Date(newBroadcast.expiryDate).toISOString() : undefined,
      createdAt: new Date().toISOString(),
      authorName: user?.name || 'Administrator'
    };
    let updated = [...broadcasts];
    if (broadcast.isPinned) updated = updated.map(b => ({ ...b, isPinned: false }));
    updated.push(broadcast);
    localStorage.setItem('mywater_broadcasts', JSON.stringify(updated));
    setBroadcasts(updated);
    setBcDialogOpen(false);
    window.dispatchEvent(new Event('storage'));
    setNewBroadcast({ title: '', message: '', target: 'ALL', type: 'INFO', isPinned: false, expiryDate: '' });
    toast({ title: "Broadcast Sent" });
  };

  const handleCreateTicket = () => {
    if (!newTicket.subject || !newTicket.message) return;
    const ticket: SupportTicket = {
      id: `tic-${Date.now()}`,
      customerId: user!.id,
      customerName: user!.name,
      subject: newTicket.subject,
      area: user!.area || 'Unknown',
      district: user!.district || 'Unknown',
      status: 'OPEN',
      messages: [{ senderId: user!.id, senderName: user!.name, text: newTicket.message, timestamp: new Date().toISOString() }],
      lastUpdate: new Date().toISOString()
    };
    const updated = [ticket, ...tickets];
    localStorage.setItem('mywater_support_tickets', JSON.stringify(updated));
    setTickets(updated);
    setTicketDialogOpen(false);
    window.dispatchEvent(new Event('storage'));
    setNewTicket({ subject: '', message: '' });
    toast({ title: "Ticket Opened" });
  };

  const handleReply = (ticket: SupportTicket) => {
    if (!replyText || !user) return;
    const isStaff = user.role !== 'CUSTOMER';
    const newMessage: SupportMessage = {
      senderId: user.id,
      senderName: user.name,
      text: replyText,
      timestamp: new Date().toISOString()
    };
    const updatedTickets = tickets.map(t => {
      if (t.id === ticket.id) {
        return {
          ...t,
          status: isStaff ? 'REPLIED' : 'OPEN',
          assignedStaffId: isStaff ? user.id : undefined,
          assignedStaffName: isStaff ? user.name : undefined,
          messages: [...t.messages, newMessage],
          lastUpdate: new Date().toISOString()
        };
      }
      return t;
    });
    localStorage.setItem('mywater_support_tickets', JSON.stringify(updatedTickets));
    setTickets(updatedTickets);
    window.dispatchEvent(new Event('storage'));
    setReplyText('');
    setSelectedTicket(updatedTickets.find(t => t.id === ticket.id) || null);
  };

  const handleDeleteBroadcast = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = broadcasts.filter(b => b.id !== id);
    localStorage.setItem('mywater_broadcasts', JSON.stringify(updated));
    setBroadcasts(updated);
    window.dispatchEvent(new Event('storage'));
    toast({ title: "Announcement deleted" });
  };

  const handleDeleteTicket = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = tickets.filter(t => t.id !== id);
    localStorage.setItem('mywater_support_tickets', JSON.stringify(updated));
    setTickets(updated);
    if (selectedTicket?.id === id) setSelectedTicket(null);
    window.dispatchEvent(new Event('storage'));
    toast({ title: "Support thread removed" });
  };

  const handleDeleteMessage = (ticketId: string, messageIndex: number) => {
    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        const newMessages = [...t.messages];
        newMessages.splice(messageIndex, 1);
        return { ...t, messages: newMessages };
      }
      return t;
    });
    localStorage.setItem('mywater_support_tickets', JSON.stringify(updatedTickets));
    setTickets(updatedTickets);
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(updatedTickets.find(t => t.id === ticketId) || null);
    }
    window.dispatchEvent(new Event('storage'));
    toast({ title: "Message deleted" });
  };

  const handleEscalate = (ticket: SupportTicket, level: 'ACCOUNTS' | 'SUPER_ADMIN') => {
    const updatedTickets = tickets.map(t => {
      if (t.id === ticket.id) return { ...t, status: 'ESCALATED', escalatedTo: level, lastUpdate: new Date().toISOString() };
      return t;
    });
    localStorage.setItem('mywater_support_tickets', JSON.stringify(updatedTickets));
    setTickets(updatedTickets);
    window.dispatchEvent(new Event('storage'));
    setSelectedTicket(updatedTickets.find(t => t.id === ticket.id) || null);
    toast({ title: "Thread Escalated" });
  };

  if (!user) return null;

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Container grid locked to 500px height */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        {/* Left Column: Broadcasts */}
        <Card className="lg:col-span-1 shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px] flex flex-col overflow-hidden">
          <CardHeader className="bg-slate-950/40 border-b border-white/5 px-6 py-4 shrink-0 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Megaphone className="h-4 w-4" /> Announcements
            </CardTitle>
            {user.role === 'SUPER_ADMIN' && (
              <Dialog open={bcDialogOpen} onOpenChange={setBcDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 rounded-[3px] h-7 text-[9px] font-black uppercase gap-1">
                    <Plus className="h-3 w-3" /> Create
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-white/10 text-white max-w-4xl rounded-[5px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 uppercase tracking-tighter">
                      <Megaphone className="h-5 w-5 text-primary" /> Distribute Notice
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-slate-500">Subject</Label>
                        <Input value={newBroadcast.title} onChange={e => setNewBroadcast({...newBroadcast, title: e.target.value})} className="bg-slate-950 border-white/5" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-slate-500">Notice Type</Label>
                        <Select value={newBroadcast.type} onValueChange={v => setNewBroadcast({...newBroadcast, type: v})}>
                          <SelectTrigger className="bg-slate-950 border-white/5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10 text-white">
                            <SelectItem value="INFO">Information</SelectItem>
                            <SelectItem value="UPDATE">Update</SelectItem>
                            <SelectItem value="ALERT">Alert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-slate-500">Target Audience</Label>
                        <Select value={newBroadcast.target} onValueChange={v => setNewBroadcast({...newBroadcast, target: v})}>
                          <SelectTrigger className="bg-slate-950 border-white/5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10 text-white">
                            <SelectItem value="ALL">All Users</SelectItem>
                            <SelectItem value="STAFF">Staff Only</SelectItem>
                            <SelectItem value="CUSTOMERS">Customers Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-slate-500">Message Content</Label>
                        <Textarea value={newBroadcast.message} onChange={e => setNewBroadcast({...newBroadcast, message: e.target.value})} className="bg-slate-950 border-white/5 min-h-[100px]" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-white/5 rounded-[5px]">
                          <div className="flex items-center gap-2">
                            <Pin className={cn("h-3.5 w-3.5", newBroadcast.isPinned ? "text-primary" : "text-slate-600")} />
                            <span className="text-[10px] font-bold uppercase">Pin to Top</span>
                          </div>
                          <Switch checked={newBroadcast.isPinned} onCheckedChange={v => setNewBroadcast({...newBroadcast, isPinned: v})} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase text-slate-500">Auto-Disappear (Expiry)</Label>
                          <Input 
                            type="datetime-local" 
                            value={newBroadcast.expiryDate} 
                            onChange={e => setNewBroadcast({...newBroadcast, expiryDate: e.target.value})} 
                            className="bg-slate-950 border-white/5 text-[10px]" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSendBroadcast} className="w-full bg-primary h-11 font-black uppercase text-[11px]">Distribute Announcement</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
            {activeBroadcasts.length > 0 ? (
              <div className="divide-y divide-white/5">
                {activeBroadcasts.map(b => (
                  <div key={b.id} className={cn("p-6 space-y-3 transition-all group", b.isPinned ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-white/5")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="text-[8px] font-black uppercase px-2 rounded-[3px] bg-primary/10 text-primary border-primary/20">{b.type}</Badge>
                        {user.role === 'SUPER_ADMIN' && (
                          <button onClick={(e) => handleDeleteBroadcast(b.id, e)} className="p-1 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">{format(new Date(b.createdAt), 'dd MMM, HH:mm')}</span>
                    </div>
                    <h4 className="text-sm font-black text-white uppercase">{b.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">{b.message}</p>
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-[9px] text-slate-600 font-bold uppercase">Author: {b.authorName}</p>
                      {b.expiresAt && <div className="flex items-center gap-1 text-[9px] text-amber-500/60 font-bold"><Clock className="h-2.5 w-2.5" />Exp: {format(new Date(b.expiresAt), 'dd MMM, HH:mm')}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-800 italic uppercase text-[10px] font-bold">No active announcements</div>
            )}
          </CardContent>
        </Card>

        {/* Support Portal (Chat) */}
        <Card className="lg:col-span-2 shadow-2xl border-white/5 bg-slate-900 rounded-[5px] flex flex-col overflow-hidden">
          <CardHeader className="bg-slate-950/40 border-b border-white/5 px-6 py-4 flex flex-row items-center justify-between shrink-0">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" /> Support Portal
            </CardTitle>
            {user.role === 'CUSTOMER' && (
              <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 rounded-[3px] h-7 text-[9px] font-black uppercase gap-1">
                    <Plus className="h-3.5 w-3.5" /> New Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-950 border-white/10 text-white max-w-sm rounded-[5px]">
                  <DialogHeader>
                    <DialogTitle className="uppercase tracking-tighter flex items-center gap-2">
                      <LifeBuoy className="h-5 w-5 text-primary" /> Request Assistance
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-500">Subject</Label>
                      <Input value={newTicket.subject} onChange={e => setNewTicket({...newTicket, subject: e.target.value})} className="bg-slate-900 border-white/5" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-500">Initial Message</Label>
                      <Textarea value={newTicket.message} onChange={e => setNewTicket({...newTicket, message: e.target.value})} className="bg-slate-900 border-white/5 min-h-[120px]" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateTicket} className="w-full bg-primary h-11 font-black uppercase text-[11px]">Submit Request</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent className="p-0 flex-1 flex overflow-hidden">
            {/* Sidebar: Threads (Contact List) */}
            <div className="w-1/3 border-r border-white/5 flex flex-col bg-slate-950/20 overflow-hidden">
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredTickets.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {filteredTickets.map(t => (
                      <div key={t.id} onClick={() => setSelectedTicket(t)} className={cn("p-4 space-y-2 cursor-pointer transition-all group", selectedTicket?.id === t.id ? "bg-primary/10" : "hover:bg-white/5")}>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-black text-slate-600 font-mono uppercase">#{t.id.slice(-6)}</span>
                          <div className="flex items-center gap-2">
                            <Badge className={cn("text-[7px] font-black px-1.5 h-4", t.status === 'OPEN' ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500")}>{t.status}</Badge>
                            <button onClick={(e) => handleDeleteTicket(t.id, e)} className="p-1 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <h5 className="text-[11px] font-black text-white uppercase truncate">{t.subject}</h5>
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] text-slate-500 truncate">{t.customerName}</p>
                          <span className="text-[8px] text-slate-600 font-bold">{format(new Date(t.lastUpdate), 'dd MMM')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-800 uppercase text-[10px] font-bold">No active tickets</div>
                )}
              </div>
            </div>

            {/* Main Thread View (Messages) */}
            <div className="flex-1 flex flex-col bg-slate-950/40 overflow-hidden">
              {selectedTicket ? (
                <>
                  {/* Fixed Inner Header */}
                  <div className="px-6 py-4 border-b border-white/5 bg-slate-950/60 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-black text-primary border border-primary/20">
                        {selectedTicket.customerName[0]}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-tight">{selectedTicket.subject}</h4>
                        <p className="text-[9px] text-slate-500 font-bold uppercase">{selectedTicket.area}, {selectedTicket.district}</p>
                      </div>
                    </div>
                    {user.role !== 'CUSTOMER' && (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEscalate(selectedTicket, 'SUPER_ADMIN')} className="h-7 text-[8px] font-black uppercase text-slate-500 hover:text-white">Escalate</Button>
                      </div>
                    )}
                  </div>

                  {/* Scrollable Messages Area */}
                  <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {selectedTicket.messages.map((m, i) => {
                      const isMe = m.senderId === user.id;
                      return (
                        <div key={i} className={cn("flex group", isMe ? "justify-end" : "justify-start")}>
                          <div className={cn("relative max-w-[85%] rounded-[5px] p-3 space-y-1 shadow-sm", isMe ? "bg-primary text-white" : "bg-slate-900 border border-white/5 text-slate-300")}>
                            <button 
                              onClick={() => handleDeleteMessage(selectedTicket.id, i)}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <X className="h-2 w-2" />
                            </button>
                            {!isMe && <p className="text-[9px] font-black uppercase opacity-60 mb-0.5">{m.senderName}</p>}
                            <p className="text-xs leading-relaxed font-medium break-words">{m.text}</p>
                            <p className={cn("text-[8px] font-bold text-right mt-1", isMe ? "text-white/60" : "text-slate-600")}>{format(new Date(m.timestamp), 'HH:mm')}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Fixed Message Input */}
                  <div className="p-4 border-t border-white/5 bg-slate-950/60 shrink-0">
                    <div className="flex gap-2">
                      <Input 
                        value={replyText} 
                        onChange={e => setReplyText(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && handleReply(selectedTicket)}
                        placeholder="Type your response..." 
                        className="bg-slate-950 border-white/5 h-10 text-xs text-white" 
                      />
                      <Button onClick={() => handleReply(selectedTicket)} disabled={!replyText} className="h-10 w-10 p-0 bg-primary">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-800 space-y-4">
                  <MessageSquare className="h-12 w-12 opacity-10" />
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-30">Select a conversation thread</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
