'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, X, Send, Heart, Wrench,
  GraduationCap, Truck, Palette, Home as HomeIcon, Sparkles,
  Handshake, Phone, MapPin, Clock, Filter, Loader2, Tag,
  ImagePlus, User, Briefcase, ChevronRight, Megaphone, XCircle,
  Zap, Globe, Star,
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
  { value: 'hogar', label: 'Hogar', icon: HomeIcon, color: 'bg-rose-50 text-rose-600 border-rose-100' },
  { value: 'tecnologia', label: 'Tech', icon: Sparkles, color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { value: 'belleza', label: 'Belleza', icon: Heart, color: 'bg-pink-50 text-pink-600 border-pink-100' },
  { value: 'educacion', label: 'Clases', icon: GraduationCap, color: 'bg-sky-50 text-sky-600 border-sky-100' },
  { value: 'transporte', label: 'Transporte', icon: Truck, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { value: 'alimentos', label: 'Comida', icon: Heart, color: 'bg-lime-50 text-lime-600 border-lime-100' },
  { value: 'construccion', label: 'Construccion', icon: Wrench, color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { value: 'arte', label: 'Arte', icon: Palette, color: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100' },
  { value: 'salud', label: 'Salud', icon: Heart, color: 'bg-teal-50 text-teal-600 border-teal-100' },
  { value: 'legal', label: 'Legal', icon: Briefcase, color: 'bg-slate-50 text-slate-600 border-slate-100' },
  { value: 'otros', label: 'Mas', icon: Filter, color: 'bg-stone-50 text-stone-500 border-stone-100' },
];
const CAT_LABELS: Record<string, string> = {};
CATEGORIAS.forEach(c => { CAT_LABELS[c.value] = c.label; });
CAT_LABELS['general'] = 'General';

// ===== TOAST =====
function toast(msg: string, type: 'ok' | 'err' = 'ok') {
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;bottom:40px;left:50%;transform:translateX(-50%);z-index:9999;padding:14px 28px;border-radius:16px;font-size:16px;font-weight:600;color:#fff;transition:opacity .3s;box-shadow:0 8px 30px rgba(0,0,0,.15);`;
  el.style.background = type === 'ok' ? '#d97706' : '#dc2626';
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
    <div className="min-h-screen bg-white flex flex-col">
      {!embed && <Header />}
      <main className="flex-1">
        {showAnn && announcement && !embed && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500 text-white px-5 py-3 flex items-center gap-3">
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
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-2xl mx-auto px-5 h-16 flex items-center gap-3">
        <img src="/logo.png" alt="Chambatina" className="h-9 w-9 object-contain" />
        <div className="flex-1">
          <h1 className="text-[20px] font-extrabold text-gray-900 tracking-tight leading-none">
            CHAMBATINA
          </h1>
          <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-[0.15em]">Marketplace</p>
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
    <div className="max-w-2xl mx-auto px-5 pt-6 pb-28">
      {/* Hero */}
      <div className="relative mb-8 rounded-3xl overflow-hidden bg-gradient-to-br from-amber-50/80 via-white to-orange-50/60">
        <div className="absolute inset-0 opacity-30">
          <img src="/hero-bg.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-white/40" />
        </div>
        <div className="relative p-7 pt-9 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-amber-500" />
            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-[0.15em]">Tu comunidad</span>
          </div>
          <h2 className="text-[34px] sm:text-[40px] font-extrabold text-gray-900 tracking-tight leading-[1.05] mb-2">
            Encuentra y<br />
            <span className="text-amber-600">ofrece servicios</span>
          </h2>
          <p className="text-[15px] text-gray-400 mb-6">Gratis. Rapido. Sin registro.</p>
          <button onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-amber-500 text-white text-[16px] font-bold shadow-lg shadow-amber-500/20 hover:bg-amber-400 active:scale-[0.97] transition-all">
            <Plus className="h-5 w-5" /> Publicar gratis
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-300" />
        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar servicios..."
          className="w-full pl-11 pr-11 h-12 bg-gray-50 border border-gray-100 rounded-2xl text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-200 transition-all" />
        {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X className="h-4 w-4" /></button>}
      </div>

      {/* Tipo Filters */}
      <div className="flex gap-2 mb-4">
        {[
          { value: '', label: 'Todos' },
          { value: 'oferta', label: 'Ofrezco' },
          { value: 'necesidad', label: 'Necesito' },
        ].map(f => (
          <button key={f.value} onClick={() => { setFilterTipo(f.value); setFilterCat(''); }}
            className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all ${filterTipo === f.value && !filterCat ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-50 text-gray-500 border border-gray-100 hover:border-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Categories */}
      {!searchTerm && (
        <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIAS.map(cat => (
            <button key={cat.value} onClick={() => setFilterCat(filterCat === cat.value ? '' : cat.value)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-[7px] rounded-full text-[13px] font-medium border transition-all ${filterCat === cat.value ? cat.color : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}>
              <cat.icon className="h-3.5 w-3.5" /> {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      <p className="text-[13px] text-gray-300 font-medium mb-3">{total} resultado{total !== 1 ? 's' : ''}</p>

      {/* Listings */}
      {loading && listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-amber-400 animate-spin mb-3" />
          <p className="text-gray-300 text-[15px]">Cargando...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="h-8 w-8 text-gray-200" />
          </div>
          <h3 className="text-lg font-bold text-gray-600 mb-1">Sin resultados</h3>
          <p className="text-gray-300 text-[15px] mb-5">Sé el primero en publicar</p>
          <button onClick={() => setShowForm(true)} className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-[15px] font-semibold">
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
                className="px-5 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-[14px] font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-50 flex items-center gap-2 transition-all">
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
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-[0.995] cursor-pointer" onClick={onToggle}>
        {img ? (
          <div className="relative">
            <img src={img} alt={item.titulo} className="w-full h-44 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <span className={`absolute bottom-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-lg ${isOferta ? 'bg-emerald-500 text-white' : 'bg-sky-500 text-white'}`}>
              {isOferta ? 'OFREZCO' : 'NECESITO'}
            </span>
            {item.precio && (
              <span className="absolute bottom-3 right-3 text-[13px] font-bold px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-sm text-gray-900 shadow">
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
              {item.precio && <span className="text-[13px] font-bold text-amber-600">{item.precio}</span>}
              {catInfo && (
                <span className={`text-[11px] font-medium px-2 py-[3px] rounded-lg ${catInfo.color.split(' ').slice(0, 2).join(' ')}`}>
                  {catInfo.label}
                </span>
              )}
            </div>
          )}

          <h3 className="text-[16px] font-bold text-gray-900 mb-1.5 leading-snug">{item.titulo}</h3>

          <div className="flex items-center gap-2.5 text-[13px]">
            <span className="font-semibold text-gray-600">{item.user.nombre}</span>
            {item.ciudad && (
              <span className="text-gray-300 flex items-center gap-1"><MapPin className="h-3 w-3" />{item.ciudad}</span>
            )}
            <span className="text-gray-300">{timeAgo(item.createdAt)}</span>
          </div>

          {/* Expanded */}
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-3.5 pt-3.5 border-t border-gray-50">
                  {(() => {
                    const imgs = (() => { try { if (item.imagenUrls) return JSON.parse(item.imagenUrls).filter(Boolean); } catch {} return item.imagenUrl ? [item.imagenUrl] : []; })();
                    if (imgs.length > 1) return (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {imgs.slice(0, 3).map((url: string, idx: number) => <img key={idx} src={url} alt="" className="w-full rounded-xl h-24 object-cover" />)}
                      </div>
                    );
                    return null;
                  })()}
                  {item.descripcion && <p className="text-[14px] text-gray-500 leading-relaxed mb-3">{item.descripcion}</p>}
                  <div className="flex flex-wrap gap-2.5">
                    {item.contacto && (
                      <a href={`tel:${item.contacto.replace(/\s/g, '')}`} onClick={e => e.stopPropagation()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-semibold text-[14px] hover:bg-gray-800 transition-colors">
                        <Phone className="h-4 w-4" /> Llamar
                      </a>
                    )}
                    {item.precio && !img && (
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-600 rounded-xl font-semibold text-[14px] border border-amber-100">
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
      if (json.ok) { toast('Publicado!'); onSaved(); }
      else toast(json.error || 'Error', 'err');
    } catch { toast('Error de conexion', 'err'); }
    setSubmitting(false);
  };

  const inputCls = "w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-200 transition-all";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={() => !submitting && onClose()}>
      <motion.div initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-xl px-5 pt-5 pb-3 z-10 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Publicar</h2>
            <button onClick={() => !submitting && onClose()} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex-1 h-[3px] rounded-full transition-all duration-300"
                style={{ background: step >= s ? '#d97706' : '#f3f4f6' }} />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className={`text-[11px] font-semibold ${step === 1 ? 'text-amber-600' : 'text-gray-300'}`}>Datos</span>
            <span className={`text-[11px] font-semibold ${step === 2 ? 'text-amber-600' : 'text-gray-300'}`}>Publicacion</span>
            <span className={`text-[11px] font-semibold ${step === 3 ? 'text-amber-600' : 'text-gray-300'}`}>Final</span>
          </div>
        </div>

        <div className="px-5 pb-6">
          {/* STEP 1 */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pt-5 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-0.5">Tus datos</h3>
                <p className="text-[14px] text-gray-400">Para que te encuentren</p>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-gray-500 mb-1.5 block">Nombre *</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Maria Garcia" className={inputCls} />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-gray-500 mb-1.5 block">Telefono *</label>
                <input value={contacto} onChange={e => setContacto(e.target.value)} placeholder="+53 5555 0000" className={inputCls} />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-gray-500 mb-2 block">Tipo</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {([['oferta', 'Ofrezco', Send, 'emerald'], ['necesidad', 'Necesito', Search, 'sky']] as const).map(([v, l, I, c]) => (
                    <button key={String(v)} type="button" onClick={() => setTipo(v as any)}
                      className={`p-3.5 rounded-xl border-2 text-center transition-all ${tipo === v ? `border-${c}-500 bg-${c}-50` : 'border-gray-100 hover:border-gray-200'}`}>
                      <I className={`h-6 w-6 mx-auto mb-1.5 ${tipo === v ? `text-${c}-600` : 'text-gray-300'}`} />
                      <p className={`text-[14px] font-semibold ${tipo === v ? `text-${c}-700` : 'text-gray-400'}`}>{l}</p>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={goNext} disabled={!canNext1}
                className="w-full h-12 rounded-xl bg-amber-500 text-white text-[15px] font-bold flex items-center justify-center gap-2 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                Continuar <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pt-5 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-0.5">Tu servicio</h3>
                <p className="text-[14px] text-gray-400">Breve y claro</p>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-gray-500 mb-1.5 block">Titulo *</label>
                <input value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={120}
                  placeholder={tipo === 'oferta' ? 'Pintura de interiores' : 'Necesito electricista'}
                  className={inputCls} />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-gray-500 mb-1.5 block">Descripcion</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} maxLength={500}
                  placeholder="Que incluye, experiencia..."
                  className="w-full h-28 px-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] resize-none text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-200 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[13px] font-semibold text-gray-500 mb-1.5 block">Categoria</label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)}
                    className="w-full h-12 px-3 rounded-xl border border-gray-200 bg-white text-[15px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-200 transition-all">
                    {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-gray-500 mb-1.5 block">Ciudad</label>
                  <input value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="La Habana" className={inputCls} />
                </div>
              </div>
              <div className="flex gap-2.5">
                <button onClick={goBack} className="flex-1 h-12 rounded-xl border border-gray-200 text-[15px] font-semibold text-gray-500 flex items-center justify-center hover:bg-gray-50 transition-all">
                  Atras
                </button>
                <button onClick={goNext} disabled={!canNext2}
                  className="flex-1 h-12 rounded-xl bg-amber-500 text-white text-[15px] font-bold flex items-center justify-center gap-2 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  Continuar <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pt-5 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-0.5">Extras</h3>
                <p className="text-[14px] text-gray-400">Opcional</p>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-gray-500 mb-1.5 block">Precio</label>
                <input value={precio} onChange={e => setPrecio(e.target.value)} placeholder="$20, Negociable..." className={inputCls} />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-gray-500 mb-2 block">Fotos</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[0, 1, 2].map(idx => (
                    <div key={idx}>
                      {imagenes[idx] ? (
                        <div className="relative rounded-xl overflow-hidden border border-gray-100 aspect-square">
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
                          className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-300 hover:bg-amber-50/50 transition-all">
                          {uploading ? <Loader2 className="h-5 w-5 animate-spin text-amber-400" /> : <ImagePlus className="h-5 w-5 text-gray-200" />}
                        </div>
                      )}
                      <input ref={fileRefs[idx]} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, idx); e.target.value = ''; }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 space-y-1.5">
                <p className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">Resumen</p>
                <p className="text-[14px] text-gray-600"><span className="font-bold text-gray-900">{nombre}</span> <span className="text-gray-300">·</span> {contacto}</p>
                <p className="text-[14px] font-bold text-gray-900">{titulo}</p>
                {precio && <p className="text-[14px] font-bold text-amber-600">{precio}</p>}
              </div>
              <div className="flex gap-2.5">
                <button onClick={goBack} disabled={submitting}
                  className="flex-1 h-12 rounded-xl border border-gray-200 text-[15px] font-semibold text-gray-500 flex items-center justify-center hover:bg-gray-50 transition-all">
                  Atras
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-[2] h-12 rounded-xl bg-amber-500 text-white text-[15px] font-bold flex items-center justify-center gap-2 hover:bg-amber-400 disabled:opacity-50 transition-all">
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
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(dateStr).toLocaleDateString('es-CU', { day: 'numeric', month: 'short' });
}
