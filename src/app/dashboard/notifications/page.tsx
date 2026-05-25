
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Broadcast, SupportTicket, User, SupportMessage } from '@/app/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Megaphone, MessageSquare, Send, Clock, CheckCircle2, AlertTriangle, ShieldAlert, Pin, Users, Trash2, ArrowUpRight, LifeBuoy, MoreVertical, ShieldCheck, Mail, History, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function BroadcastsPage() {
  const { user, settings } = useAuth();
  const { toast } = useToast();
  
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  // Admin Creation State
  const [newBroadcast, setNewBroadcast] = useState({
    title: '',
    message: '',
    target: 'ALL' as any,
    type: 'INFO' as any,
    isPinned: false,
    expiryDate: ''
  });

  // Support State
  const [newTicket, setNewTicket] = useState({ subject: '', message: '' });
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');

  // Initial data load and storage listener
  useEffect(() => {
    const loadData = () => {
      const storedB = localStorage.getItem('mywater_broadcasts') || '[]';
      setBroadcasts(JSON.parse(storedB));

      const storedT = localStorage.getItem('mywater_support_tickets') || '[]';
      setTickets(JSON.parse(storedT));

      const storedU = localStorage.getItem('mywater_all_users') || '[]';
      setAllUsers(JSON.parse(storedU));
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  // Mark as read only when component mounts or user identity changes
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`mywater_last_read_${user.id}`, Date.now().toString());
      window.dispatchEvent(new Event('storage'));
    }
  }, [user?.id]);

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
    if (user.role === 'CUSTOMER') {
      return tickets.filter(t => t.customerId === user.id);
    }
    
    // Staff/Admin filtering: only see tickets in their area, unless escalated to them
    return tickets.filter(t => {
      if (user.role === 'SUPER_ADMIN') return true;
      if (t.escalatedTo === 'SUPER_ADMIN') return false; // Handled by Super Admin only
      if (t.escalatedTo === 'ACCOUNTS') return false; // Handled by accounts department specifically (stretch)
      
      // Territory match for District Staff
      return t.area === user.area && t.district === user.district;
    }).sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime());
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

    // If pinning, unpin others
    let updated = [...broadcasts];
    if (broadcast.isPinned) {
      updated = updated.map(b => ({ ...b, isPinned: false }));
    }
    updated.push(broadcast);
    
    localStorage.setItem('mywater_broadcasts', JSON.stringify(updated));
    setBroadcasts(updated);
    window.dispatchEvent(new Event('storage'));
    
    setNewBroadcast({ title: '', message: '', target: 'ALL', type: 'INFO', isPinned: false, expiryDate: '' });
    toast({ title: "Broadcast Sent", description: "Your message has been distributed to the target audience." });
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
      messages: [{
        senderId: user!.id,
        senderName: user!.name,
        text: newTicket.message,
        timestamp: new Date().toISOString()
      }],
      lastUpdate: new Date().toISOString()
    };

    const updated = [ticket, ...tickets];
    localStorage.setItem('mywater_support_tickets', JSON.stringify(updated));
    setTickets(updated);
    window.dispatchEvent(new Event('storage'));
    
    setNewTicket({ subject: '', message: '' });
    toast({ title: "Support Ticket Opened", description: "Your request has been routed to your area field staff." });
  };

  const handleReply = (ticket: SupportTicket) => {
    if (!replyText || !user) return;

    // Logic: if customer replies, anyone can take it. If staff replies, lock to them.
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
          assignedStaffId: isStaff ? user.id : undefined, // Reset lock if customer replies
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
    toast({ title: "Message Sent" });
  };

  const handleEscalate = (ticket: SupportTicket, level: 'ACCOUNTS' | 'SUPER_ADMIN') => {
    const updatedTickets = tickets.map(t => {
      if (t.id === ticket.id) {
        return {
          ...t,
          status: 'ESCALATED',
          escalatedTo: level,
          lastUpdate: new Date().toISOString()
        };
      }
      return t;
    });
    localStorage.setItem('mywater_support_tickets', JSON.stringify(updatedTickets));
    setTickets(updatedTickets);
    window.dispatchEvent(new Event('storage'));
    setSelectedTicket(null);
    toast({ title: "Escalated", description: `Issue forwarded to ${level.replace('_', ' ')} for resolution.` });
  };

  const deleteBroadcast = (id: string) => {
    const updated = broadcasts.filter(b => b.id !== id);
    localStorage.setItem('mywater_broadcasts', JSON.stringify(updated));
    setBroadcasts(updated);
    window.dispatchEvent(new Event('storage'));
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white uppercase flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-primary" /> Broadcast Hub
          </h2>
          <p className="text-slate-400 font-medium">Global announcements and decentralized consumer support.</p>
        </div>
        
        {user.role === 'SUPER_ADMIN' && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-[5px] h-9 gap-2 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" /> Create Broadcast
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md rounded-[5px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 uppercase tracking-tighter">
                  <Megaphone className="h-5 w-5 text-primary" /> Distribute Announcement
                </DialogTitle>
                <DialogDescription className="text-slate-500 text-xs">Send a verified notice to specific user groups.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Subject</Label>
                    <Input value={newBroadcast.title} onChange={e => setNewBroadcast({...newBroadcast, title: e.target.value})} placeholder="e.g. System Maintenance" className="bg-slate-950 border-white/5 h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Notice Type</Label>
                    <Select value={newBroadcast.type} onValueChange={v => setNewBroadcast({...newBroadcast, type: v})}>
                      <SelectTrigger className="bg-slate-950 border-white/5 h-10"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        <SelectItem value="INFO">Information</SelectItem>
                        <SelectItem value="UPDATE">Utility Update</SelectItem>
                        <SelectItem value="ALERT">Critical Alert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Distribution Channel</Label>
                  <Select value={newBroadcast.target} onValueChange={v => setNewBroadcast({...newBroadcast, target: v})}>
                    <SelectTrigger className="bg-slate-950 border-white/5 h-10"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="ALL">Entire Population (All)</SelectItem>
                      <SelectItem value="STAFF">Staff & Agents Only</SelectItem>
                      <SelectItem value="CUSTOMERS">Customers Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Message Payload</Label>
                  <Textarea value={newBroadcast.message} onChange={e => setNewBroadcast({...newBroadcast, message: e.target.value})} className="bg-slate-950 border-white/5 min-h-[100px] text-xs" placeholder="Type your announcement content here..." />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-white/5 rounded-[5px]">
                    <div className="flex items-center gap-2">
                      <Pin className={cn("h-3.5 w-3.5", newBroadcast.isPinned ? "text-primary" : "text-slate-600")} />
                      <span className="text-[10px] font-bold uppercase">Pin to Top</span>
                    </div>
                    <Switch checked={newBroadcast.isPinned} onCheckedChange={v => setNewBroadcast({...newBroadcast, isPinned: v})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Auto-Disappear</Label>
                    <Input type="date" value={newBroadcast.expiryDate} onChange={e => setNewBroadcast({...newBroadcast, expiryDate: e.target.value})} className="bg-slate-950 border-white/5 h-10 text-[10px]" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSendBroadcast} className="w-full bg-primary hover:bg-primary/90 text-white h-11 font-black uppercase tracking-widest text-[11px] rounded-[5px]">
                  <Send className="h-4 w-4 mr-2" /> Distribute Now
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Broadcasts */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px] h-full overflow-hidden">
            <CardHeader className="bg-slate-950/40 border-b border-white/5 px-6 py-4">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Megaphone className="h-4 w-4" /> Active Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[600px] overflow-y-auto">
              {activeBroadcasts.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {activeBroadcasts.map(b => (
                    <div key={b.id} className={cn("p-6 space-y-3 group relative transition-all", b.isPinned ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-white/5")}>
                      <div className="flex items-center justify-between">
                        <Badge className={cn("text-[8px] font-black uppercase px-2 rounded-[3px]", 
                          b.type === 'ALERT' ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                          b.type === 'UPDATE' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-primary/10 text-primary border-primary/20"
                        )}>
                          {b.type}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-500 font-mono">{format(new Date(b.createdAt), 'dd MMM, HH:mm')}</span>
                          {user.role === 'SUPER_ADMIN' && (
                            <button onClick={() => deleteBroadcast(b.id)} className="text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">{b.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">{b.message}</p>
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-[9px] text-slate-600 font-bold uppercase">By: {b.authorName}</p>
                        {b.expiresAt && (
                          <div className="flex items-center gap-1 text-[9px] text-amber-500/60 font-bold">
                            <Clock className="h-2.5 w-2.5" />
                            Exp: {format(new Date(b.expiresAt), 'dd MMM')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-600 space-y-3">
                  <Megaphone className="h-8 w-8 mx-auto opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No active broadcasts in ledger.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Support Tickets */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-2xl border-white/5 bg-slate-900 rounded-[5px] h-full flex flex-col overflow-hidden">
            <CardHeader className="bg-slate-950/40 border-b border-white/5 px-6 py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" /> Territory Support Portal
                </CardTitle>
              </div>
              
              {user.role === 'CUSTOMER' && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-slate-800 text-white border border-white/5 rounded-[3px] h-7 text-[9px] font-black uppercase tracking-tighter">
                      Open New Ticket
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-950 border-white/10 text-white max-w-sm rounded-[5px]">
                    <DialogHeader>
                      <DialogTitle className="uppercase tracking-tighter flex items-center gap-2">
                        <LifeBuoy className="h-5 w-5 text-primary" /> Request Assistance
                      </DialogTitle>
                      <DialogDescription className="text-slate-500 text-xs">Describe your issue for the area field staff.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-slate-500">Issue Category / Subject</Label>
                        <Input value={newTicket.subject} onChange={e => setNewTicket({...newTicket, subject: e.target.value})} placeholder="e.g. Meter Faulty / Billing Error" className="bg-slate-900 border-white/5" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-slate-500">Detailed Message</Label>
                        <Textarea value={newTicket.message} onChange={e => setNewTicket({...newTicket, message: e.target.value})} className="bg-slate-900 border-white/5 min-h-[120px] text-xs" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateTicket} className="w-full bg-primary h-11 font-black uppercase tracking-widest text-[11px] rounded-[5px]">Submit Request</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            
            <CardContent className="p-0 flex-1 flex overflow-hidden">
              {/* Ticket List */}
              <div className="w-1/3 border-r border-white/5 overflow-y-auto">
                {filteredTickets.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {filteredTickets.map(t => {
                      const isLocked = t.assignedStaffId && t.assignedStaffId !== user.id && user.role !== 'CUSTOMER' && user.role !== 'SUPER_ADMIN';
                      return (
                        <div 
                          key={t.id} 
                          onClick={() => setSelectedTicket(t)}
                          className={cn("p-4 space-y-2 cursor-pointer transition-all relative group", 
                            selectedTicket?.id === t.id ? "bg-primary/10" : "hover:bg-white/5"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black text-slate-600 font-mono uppercase tracking-tighter">#{t.id.slice(-6)}</span>
                            <Badge className={cn("text-[7px] font-black px-1.5 h-4", 
                              t.status === 'OPEN' ? "bg-green-500/10 text-green-500" :
                              t.status === 'REPLIED' ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500"
                            )}>
                              {t.status}
                            </Badge>
                          </div>
                          <h5 className="text-[11px] font-black text-white uppercase truncate">{t.subject}</h5>
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] text-slate-500 truncate">{t.customerName}</p>
                            <span className="text-[8px] text-slate-600 font-bold">{format(new Date(t.lastUpdate), 'dd MMM')}</span>
                          </div>
                          {isLocked && (
                            <div className="flex items-center gap-1.5 text-[8px] text-amber-500 font-black uppercase mt-1">
                              <ShieldAlert className="h-2.5 w-2.5" /> Handled by {t.assignedStaffName?.split(' ')[0]}
                            </div>
                          )}
                          {!t.assignedStaffId && t.status === 'OPEN' && user.role !== 'CUSTOMER' && (
                            <div className="absolute top-4 right-4 h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-700 italic text-[10px] uppercase font-bold">No tickets found.</div>
                )}
              </div>

              {/* Chat View */}
              <div className="flex-1 flex flex-col bg-slate-950/20 relative">
                {selectedTicket ? (
                  <>
                    {/* Chat Header */}
                    <div className="px-6 py-4 border-b border-white/5 bg-slate-950/40 flex items-center justify-between">
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
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEscalate(selectedTicket, 'SUPER_ADMIN')}
                            className="h-7 text-[8px] font-black uppercase text-slate-500 hover:text-white rounded-[3px]"
                          >
                            Escalate
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-[8px] font-black uppercase border-white/5 rounded-[3px] text-red-400 hover:bg-red-400/10"
                            onClick={() => {
                              const updated = tickets.map(t => t.id === selectedTicket.id ? { ...t, status: 'CLOSED' as any } : t);
                              localStorage.setItem('mywater_support_tickets', JSON.stringify(updated));
                              setTickets(updated);
                              setSelectedTicket(null);
                            }}
                          >
                            Close
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {selectedTicket.messages.map((m, i) => {
                        const isMe = m.senderId === user.id;
                        return (
                          <div key={i} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                            <div className={cn("max-w-[80%] rounded-[5px] p-3 space-y-1 relative", 
                              isMe ? "bg-primary text-white shadow-lg shadow-primary/10" : "bg-slate-900 border border-white/5 text-slate-300"
                            )}>
                              {!isMe && <p className="text-[9px] font-black uppercase opacity-60 mb-0.5">{m.senderName}</p>}
                              <p className="text-xs leading-relaxed font-medium">{m.text}</p>
                              <p className={cn("text-[8px] font-bold text-right", isMe ? "text-white/60" : "text-slate-600")}>
                                {format(new Date(m.timestamp), 'HH:mm')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Reply Input */}
                    <div className="p-4 border-t border-white/5 bg-slate-950/40">
                      {(() => {
                        const isLocked = selectedTicket.assignedStaffId && 
                                       selectedTicket.assignedStaffId !== user.id && 
                                       user.role !== 'CUSTOMER' && 
                                       user.role !== 'SUPER_ADMIN';
                        
                        if (isLocked) {
                          return (
                            <div className="text-center py-2 bg-amber-500/5 border border-amber-500/20 rounded-[5px]">
                              <p className="text-[9px] font-black uppercase text-amber-500">Conversation Managed by {selectedTicket.assignedStaffName}</p>
                            </div>
                          );
                        }

                        return (
                          <div className="flex gap-2">
                            <Input 
                              value={replyText} 
                              onChange={e => setReplyText(e.target.value)} 
                              onKeyDown={e => e.key === 'Enter' && handleReply(selectedTicket)}
                              placeholder="Type your message..." 
                              className="bg-slate-950 border-white/5 h-10 text-xs text-white" 
                            />
                            <Button onClick={() => handleReply(selectedTicket)} disabled={!replyText} className="h-10 w-10 p-0 bg-primary rounded-[5px]">
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })()}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-800 space-y-4">
                    <MessageSquare className="h-12 w-12 opacity-10" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">Select a conversation to view details</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
