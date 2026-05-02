'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, X, Send, Heart, Wrench,
  GraduationCap, Truck, Palette, Home as HomeIcon, Sparkles,
  Handshake, Phone, MapPin, Clock, Filter, Loader2, Tag,
  ImagePlus, User, Briefcase, ChevronRight, Megaphone, XCircle,
} from 'lucide-react';

// ===== TYPES =====
interface ServiceItem {
  id: number; tipo: string; titulo: string; descripcion: string | null;
  categoria: string; ciudad: string | null; precio: string | null;
  contacto: string | null; imagenUrl: string | null; imagenUrls: string | null;
  activo: boolean; createdAt: string;
  user: { id: number; nombre: string; direccion: string | null };
}
interface Announcement {
  id: number; message: string; active: boolean; createdAt: string;
}

// ===== CONSTANTS =====
const CATEGORIAS = [
  { value: 'hogar', label: 'Hogar', icon: HomeIcon, color: 'bg-rose-50 text-rose-600 border-rose-200' },
  { value: 'tecnologia', label: 'Tech', icon: Sparkles, color: 'bg-violet-50 text-violet-600 border-violet-200' },
  { value: 'belleza', label: 'Belleza', icon: Heart, color: 'bg-pink-50 text-pink-600 border-pink-200' },
  { value: 'educacion', label: 'Clases', icon: GraduationCap, color: 'bg-sky-50 text-sky-600 border-sky-200' },
  { value: 'transporte', label: 'Transporte', icon: Truck, color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { value: 'alimentos', label: 'Comida', icon: Heart, color: 'bg-lime-50 text-lime-600 border-lime-200' },
  { value: 'construccion', label: 'Construccion', icon: Wrench, color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { value: 'arte', label: 'Arte', icon: Palette, color: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200' },
  { value: 'salud', label: 'Salud', icon: Heart, color: 'bg-teal-50 text-teal-600 border-teal-200' },
  { value: 'legal', label: 'Legal', icon: Briefcase, color: 'bg-slate-50 text-slate-600 border-slate-200' },
  { value: 'otros', label: 'Mas', icon: Filter, color: 'bg-stone-50 text-stone-600 border-stone-200' },
];
const CAT_LABELS: Record<string, string> = {};
CATEGORIAS.forEach(c => { CAT_LABELS[c.value] = c.label; });
CAT_LABELS['general'] = 'General';

// ===== TOAST =====
function toast(msg: string, type: 'ok' | 'err' = 'ok') {
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;bottom:40px;left:50%;transform:translateX(-50%);z-index:9999;padding:14px 28px;border-radius:16px;font-size:16px;font-weight:600;color:#fff;transition:opacity .3s;box-shadow:0 8px 30px rgba(0,0,0,.2);`;
  el.style.background = type === 'ok' ? '#059669' : '#dc2626';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 2500);
}

// ===== MAIN APP =====
export default function MarketplaceApp() {
  const [embed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.location.search.includes('embed=true');
  });
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [showAnn, setShowAnn] = useState(false);

  useEffect(() => {
    fetch('/api/announcements').then(r => r.json()).then(json => {
      if (json.ok && json.data) { setAnnouncement(json.data); setShowAnn(true); }
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col">
      {!embed && <Header />}
      <main className="flex-1">
        {showAnn && announcement && !embed && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-orange-600 to-amber-500 text-white px-5 py-3 flex items-center gap-3">
            <Megaphone className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium flex-1">{announcement.message}</p>
            <button onClick={() => setShowAnn(false)} className="shrink-0 p-1 hover:bg-white/20 rounded-full">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
        <Marketplace />
      </main>
    </div>
  );
}

// ===== HEADER =====
function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#faf9f7]/80 backdrop-blur-xl border-b border-stone-200/60">
      <div className="max-w-2xl mx-auto px-5 h-14 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-md shadow-orange-200/50">
          <Handshake className="h-4.5 w-4.5 text-white" />
        </div>
        <div className="flex-1">
          <span className="font-extrabold text-[17px] text-stone-800 tracking-tight leading-none">Marketplace</span>
        </div>
      </div>
    </header>
  );
}

// ===== MARKETPLACE VIEW =====
function Marketplace() {
  const [listings, setListings] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const LIMIT = 20;

  const loadListings = useCallback(async (p: number = 1, append: boolean = false) => {
    setLoading(true);
    try {
      let url = `/api/servicios?page=${p}&limit=${LIMIT}`;
      if (filterTipo) url += `&tipo=${filterTipo}`;
      if (filterCat) url += `&categoria=${filterCat}`;
      if (searchTerm) url += `&q=${encodeURIComponent(searchTerm)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.ok) {
        setListings(append ? prev => [...prev, ...json.data] : json.data);
        setTotal(json.pagination.total);
        setPage(p);
      }
    } catch { toast('Error de conexion', 'err'); }
    setLoading(false);
  }, [filterTipo, filterCat, searchTerm]);

  useEffect(() => { loadListings(1); }, [filterTipo, filterCat, loadListings]);
  useEffect(() => { const t = setTimeout(() => loadListings(1), 400); return () => clearTimeout(t); }, [searchTerm]);

  return (
    <div className="max-w-2xl mx-auto px-5 pt-5 pb-28">
      {/* Hero + CTA */}
      <div className="mb-6">
        <h1 className="text-[28px] font-extrabold text-stone-800 tracking-tight leading-tight mb-1">
          Servicios cerca de ti
        </h1>
        <p className="text-[15px] text-stone-500 mb-5">
          Publica gratis. Encuentra lo que necesitas.
        </p>
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[17px] font-bold shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 active:scale-[0.98] transition-all">
          <Plus className="h-5 w-5" /> Publicar gratis
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-stone-400" />
        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar servicios..."
          className="w-full pl-11 pr-11 h-12 bg-white border border-stone-200 rounded-2xl text-[15px] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-300 transition-all" />
        {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"><X className="h-4 w-4" /></button>}
      </div>

      {/* Tipo Filters */}
      <div className="flex gap-2 mb-4">
        {[
          { value: '', label: 'Todos' },
          { value: 'oferta', label: 'Ofrezco' },
          { value: 'necesidad', label: 'Necesito' },
        ].map(f => (
          <button key={f.value} onClick={() => { setFilterTipo(f.value); setFilterCat(''); }}
            className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all ${filterTipo === f.value && !filterCat ? 'bg-stone-800 text-white shadow-sm' : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-300'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Categories */}
      {!searchTerm && (
        <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIAS.map(cat => (
            <button key={cat.value} onClick={() => setFilterCat(filterCat === cat.value ? '' : cat.value)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-[7px] rounded-full text-[13px] font-medium border transition-all ${filterCat === cat.value ? cat.color : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'}`}>
              <cat.icon className="h-3.5 w-3.5" /> {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      <p className="text-[13px] text-stone-400 font-medium mb-3">{total} resultado{total !== 1 ? 's' : ''}</p>

      {/* Listings */}
      {loading && listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-orange-500 animate-spin mb-3" />
          <p className="text-stone-400 text-[15px]">Cargando...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="h-8 w-8 text-stone-300" />
          </div>
          <h3 className="text-lg font-bold text-stone-700 mb-1">Nada por aqui</h3>
          <p className="text-stone-400 text-[15px] mb-5">Sé el primero en publicar</p>
          <button onClick={() => setShowForm(true)} className="px-6 py-2.5 rounded-xl bg-stone-800 text-white text-[15px] font-semibold">
            Crear publicacion
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {listings.map((item, i) => (
              <Card key={item.id} item={item} expanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)} index={i} />
            ))}
          </AnimatePresence>
          {total > LIMIT && page < Math.ceil(total / LIMIT) && (
            <div className="flex justify-center pt-5">
              <button onClick={() => loadListings(page + 1, true)} disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-white border border-stone-200 text-[14px] font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50 flex items-center gap-2 transition-all">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Cargar mas
              </button>
            </div>
          )}
        </div>
      )}

      {/* Publish Form */}
      <AnimatePresence>
        {showForm && <PublishForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); loadListings(1); }} />}
      </AnimatePresence>
    </div>
  );
}

// ===== CARD =====
function Card({ item, expanded, onToggle, index }: { item: ServiceItem; expanded: boolean; onToggle: () => void; index: number }) {
  const isOferta = item.tipo === 'oferta';
  const img = (() => { try { if (item.imagenUrls) return JSON.parse(item.imagenUrls).filter(Boolean)[0]; } catch {} return item.imagenUrl || null; })();
  const catInfo = CATEGORIAS.find(c => c.value === item.categoria);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
      <div className="bg-white rounded-2xl overflow-hidden border border-stone-200/80 shadow-sm hover:shadow-md transition-all active:scale-[0.995]" onClick={onToggle}>
        {img ? (
          <div className="relative">
            <img src={img} alt={item.titulo} className="w-full h-44 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <span className={`absolute bottom-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-lg ${isOferta ? 'bg-emerald-500 text-white' : 'bg-sky-500 text-white'}`}>
              {isOferta ? 'OFREZCO' : 'NECESITO'}
            </span>
            {item.precio && (
              <span className="absolute bottom-3 right-3 text-[13px] font-bold px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-sm text-stone-800 shadow">
                {item.precio}
              </span>
            )}
          </div>
        ) : null}

        <div className="p-4">
          {!img && (
            <div className="flex items-center gap-2 mb-2.5">
              <span className={`text-[11px] font-bold px-2.5 py-[3px] rounded-lg ${isOferta ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}>
                {isOferta ? 'OFREZCO' : 'NECESITO'}
              </span>
              {item.precio && <span className="text-[13px] font-bold text-orange-600">{item.precio}</span>}
              {catInfo && (
                <span className={`text-[11px] font-medium px-2 py-[3px] rounded-lg ${catInfo.color.split(' ').slice(0, 2).join(' ')}`}>
                  {catInfo.label}
                </span>
              )}
            </div>
          )}

          <h3 className="text-[16px] font-bold text-stone-800 mb-1.5 leading-snug">{item.titulo}</h3>

          <div className="flex items-center gap-2.5 text-[13px]">
            <span className="font-semibold text-stone-700">{item.user.nombre}</span>
            {item.ciudad && (
              <span className="text-stone-400 flex items-center gap-1"><MapPin className="h-3 w-3" />{item.ciudad}</span>
            )}
            <span className="text-stone-400">{timeAgo(item.createdAt)}</span>
          </div>

          {/* Expanded */}
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-3.5 pt-3.5 border-t border-stone-100">
                  {(() => {
                    const imgs = (() => { try { if (item.imagenUrls) return JSON.parse(item.imagenUrls).filter(Boolean); } catch {} return item.imagenUrl ? [item.imagenUrl] : []; })();
                    if (imgs.length > 1) return (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {imgs.slice(0, 3).map((url: string, idx: number) => <img key={idx} src={url} alt="" className="w-full rounded-xl h-24 object-cover" />)}
                      </div>
                    );
                    return null;
                  })()}
                  {item.descripcion && <p className="text-[14px] text-stone-600 leading-relaxed mb-3">{item.descripcion}</p>}
                  <div className="flex flex-wrap gap-2.5">
                    {item.contacto && (
                      <a href={`tel:${item.contacto.replace(/\s/g, '')}`} onClick={e => e.stopPropagation()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-stone-800 text-white rounded-xl font-semibold text-[14px] hover:bg-stone-700 transition-colors">
                        <Phone className="h-4 w-4" /> Llamar
                      </a>
                    )}
                    {item.precio && !img && (
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 text-orange-600 rounded-xl font-semibold text-[14px] border border-orange-100">
                        <Tag className="h-4 w-4" /> {item.precio}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ===== PUBLISH FORM - 3 STEPS =====
function PublishForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void; }) {
  const [step, setStep] = useState(1);
  const [tipo, setTipo] = useState<'oferta' | 'necesidad'>('oferta');
  const [titulo, setTitulo] = useState('');
  const [desc, setDesc] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('general');
  const [ciudad, setCiudad] = useState('');
  const [precio, setPrecio] = useState('');
  const [contacto, setContacto] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagenes, setImagenes] = useState<string[]>([]);
  const fileRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const canNext1 = nombre.trim().length >= 2 && contacto.trim().length >= 6;
  const canNext2 = titulo.trim().length >= 3;

  const goNext = () => { if (step < 3) setStep(step + 1); };
  const goBack = () => { if (step > 1) setStep(step - 1); };

  const uploadImage = async (file: File, idx: number) => {
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) { toast('Solo JPG, PNG, GIF, WebP', 'err'); return; }
    if (file.size > 4 * 1024 * 1024) { toast('Maximo 4MB', 'err'); return; }
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (json.ok && json.data?.url) {
        const n = [...imagenes]; n[idx] = json.data.url; setImagenes(n);
      } else toast('Error al subir', 'err');
    } catch { toast('Error de conexion', 'err'); }
    setUploading(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        tipo, titulo: titulo.trim(), descripcion: desc.trim() || null,
        categoria, ciudad: ciudad.trim() || null, precio: precio.trim() || null,
        contacto: contacto.trim(),
        imagenUrl: imagenes.filter(Boolean).length > 0 ? imagenes.filter(Boolean)[0] : null,
        imagenUrls: imagenes.filter(Boolean),
        nombre: nombre.trim(),
      };
      const res = await fetch('/api/servicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok) { toast('Publicado con exito!'); onSaved(); }
      else toast(json.error || 'Error', 'err');
    } catch { toast('Error de conexion', 'err'); }
    setSubmitting(false);
  };

  const inputCls = "w-full h-12 px-4 rounded-xl border border-stone-200 bg-white text-[15px] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-300 transition-all";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => !submitting && onClose()}>
      <motion.div initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-[#faf9f7] w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-[#faf9f7]/95 backdrop-blur-lg px-5 pt-5 pb-3 z-10 border-b border-stone-200/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-stone-800">Publicar</h2>
            <button onClick={() => !submitting && onClose()} className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex-1 h-[3px] rounded-full transition-all duration-300"
                style={{ background: step >= s ? '#ea580c' : '#d6d3d1' }} />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className={`text-[11px] font-semibold ${step === 1 ? 'text-orange-600' : 'text-stone-400'}`}>Tus datos</span>
            <span className={`text-[11px] font-semibold ${step === 2 ? 'text-orange-600' : 'text-stone-400'}`}>Que publicas</span>
            <span className={`text-[11px] font-semibold ${step === 3 ? 'text-orange-600' : 'text-stone-400'}`}>Final</span>
          </div>
        </div>

        <div className="px-5 pb-6">
          {/* STEP 1 */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pt-5 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-stone-800 mb-0.5">Datos de contacto</h3>
                <p className="text-[14px] text-stone-500">Para que te puedan encontrar</p>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-stone-600 mb-1.5 block">Tu nombre *</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Maria Garcia" className={inputCls} />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-stone-600 mb-1.5 block">Telefono *</label>
                <input value={contacto} onChange={e => setContacto(e.target.value)} placeholder="+53 5555 0000" className={inputCls} />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-stone-600 mb-2 block">Tipo</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {([['oferta', 'Ofrezco', Send, 'emerald'], ['necesidad', 'Necesito', Search, 'sky']] as const).map(([v, l, I, c]) => (
                    <button key={String(v)} type="button" onClick={() => setTipo(v as any)}
                      className={`p-3.5 rounded-xl border-2 text-center transition-all ${tipo === v ? `border-${c}-500 bg-${c}-50` : 'border-stone-200 hover:border-stone-300'}`}>
                      <I className={`h-6 w-6 mx-auto mb-1.5 ${tipo === v ? `text-${c}-600` : 'text-stone-400'}`} />
                      <p className={`text-[14px] font-semibold ${tipo === v ? `text-${c}-700` : 'text-stone-500'}`}>{l}</p>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={goNext} disabled={!canNext1}
                className="w-full h-12 rounded-xl bg-stone-800 text-white text-[15px] font-bold flex items-center justify-center gap-2 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                Continuar <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pt-5 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-stone-800 mb-0.5">Describe tu publicacion</h3>
                <p className="text-[14px] text-stone-500">Sé claro y especifico</p>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-stone-600 mb-1.5 block">Titulo *</label>
                <input value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={120}
                  placeholder={tipo === 'oferta' ? 'Pintura de interiores' : 'Necesito electricista'}
                  className={inputCls} />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-stone-600 mb-1.5 block">Descripcion</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} maxLength={500}
                  placeholder="Describe tu servicio, que incluye, tu experiencia..."
                  className="w-full h-28 px-4 py-3 rounded-xl border border-stone-200 bg-white text-[15px] resize-none text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-300 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[13px] font-semibold text-stone-600 mb-1.5 block">Categoria</label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)}
                    className="w-full h-12 px-3 rounded-xl border border-stone-200 bg-white text-[15px] text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-300 transition-all">
                    {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-stone-600 mb-1.5 block">Ciudad</label>
                  <input value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="La Habana" className={inputCls} />
                </div>
              </div>
              <div className="flex gap-2.5">
                <button onClick={goBack} className="flex-1 h-12 rounded-xl border border-stone-200 text-[15px] font-semibold text-stone-600 flex items-center justify-center hover:bg-white transition-all">
                  Atras
                </button>
                <button onClick={goNext} disabled={!canNext2}
                  className="flex-1 h-12 rounded-xl bg-stone-800 text-white text-[15px] font-bold flex items-center justify-center gap-2 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  Continuar <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pt-5 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-stone-800 mb-0.5">Detalles extra</h3>
                <p className="text-[14px] text-stone-500">Opcional pero recomendado</p>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-stone-600 mb-1.5 block">Precio</label>
                <input value={precio} onChange={e => setPrecio(e.target.value)} placeholder="$20, Negociable..." className={inputCls} />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-stone-600 mb-2 block">Fotos</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[0, 1, 2].map(idx => (
                    <div key={idx}>
                      {imagenes[idx] ? (
                        <div className="relative rounded-xl overflow-hidden border border-stone-200 aspect-square">
                          <img src={imagenes[idx]} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => { const n = [...imagenes]; n[idx] = ''; setImagenes(n); }}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div onClick={() => fileRefs[idx].current?.click()}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) uploadImage(f, idx); }}
                          className="aspect-square border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/40 transition-all">
                          {uploading ? <Loader2 className="h-5 w-5 animate-spin text-orange-500" /> : <ImagePlus className="h-5 w-5 text-stone-300" />}
                        </div>
                      )}
                      <input ref={fileRefs[idx]} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, idx); e.target.value = ''; }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-3.5 border border-stone-200 space-y-1.5">
                <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Resumen</p>
                <p className="text-[14px] text-stone-800"><span className="font-bold">{nombre}</span> <span className="text-stone-400">·</span> {contacto}</p>
                <p className="text-[14px] font-bold text-stone-800">{titulo}</p>
                {precio && <p className="text-[14px] font-bold text-orange-600">{precio}</p>}
              </div>
              <div className="flex gap-2.5">
                <button onClick={goBack} disabled={submitting}
                  className="flex-1 h-12 rounded-xl border border-stone-200 text-[15px] font-semibold text-stone-600 flex items-center justify-center hover:bg-white transition-all">
                  Atras
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[15px] font-bold flex items-center justify-center gap-2 hover:from-orange-600 hover:to-rose-600 disabled:opacity-50 transition-all shadow-lg shadow-orange-500/25">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Publicar</>}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ===== UTILS =====
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Ahora';
  if (m < 60) return `Hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `Hace ${d}d`;
  return new Date(dateStr).toLocaleDateString('es-CU', { day: 'numeric', month: 'short' });
}
