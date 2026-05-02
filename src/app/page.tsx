'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, X, ChevronDown, ChevronUp, Send, Heart, Wrench,
  GraduationCap, Truck, Palette, Home as HomeIcon, Sparkles,
  Handshake, Phone, MapPin, Clock, Filter, Loader2, Tag,
  ImagePlus, User, Briefcase, ArrowRight, ChevronRight,
} from 'lucide-react';

// ===== TYPES =====
interface ServiceItem {
  id: number; tipo: string; titulo: string; descripcion: string | null;
  categoria: string; ciudad: string | null; precio: string | null;
  contacto: string | null; imagenUrl: string | null; imagenUrls: string | null;
  activo: boolean; createdAt: string;
  user: { id: number; nombre: string; direccion: string | null };
}

// ===== CONSTANTS =====
const CATEGORIAS = [
  { value: 'hogar', label: 'Hogar', icon: HomeIcon },
  { value: 'tecnologia', label: 'Tecnologia', icon: Sparkles },
  { value: 'belleza', label: 'Belleza', icon: Heart },
  { value: 'educacion', label: 'Educacion', icon: GraduationCap },
  { value: 'transporte', label: 'Transporte', icon: Truck },
  { value: 'alimentos', label: 'Alimentos', icon: Sparkles },
  { value: 'construccion', label: 'Construccion', icon: Wrench },
  { value: 'arte', label: 'Arte', icon: Palette },
  { value: 'salud', label: 'Salud', icon: Heart },
  { value: 'legal', label: 'Legal', icon: Briefcase },
  { value: 'otros', label: 'Otros', icon: Filter },
];
const CAT_LABELS: Record<string, string> = {};
CATEGORIAS.forEach(c => { CAT_LABELS[c.value] = c.label; });
CAT_LABELS['general'] = 'General';

// ===== TOAST =====
function toast(msg: string, type: 'ok' | 'err' = 'ok') {
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;bottom:40px;left:50%;transform:translateX(-50%);z-index:9999;padding:14px 28px;border-radius:16px;font-size:16px;font-weight:600;color:#fff;transition:opacity .3s;box-shadow:0 8px 30px rgba(0,0,0,.15);`;
  el.style.background = type === 'ok' ? '#10b981' : '#ef4444';
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {!embed && <Header />}
      <main className="flex-1">
        <Marketplace />
      </main>
    </div>
  );
}

// ===== HEADER =====
function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-zinc-100">
      <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-200">
            <Handshake className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-zinc-900 leading-none block">Marketplace</span>
            <span className="text-[11px] text-zinc-400 leading-none">Chambatina</span>
          </div>
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-2">
          Encuentra lo que necesitas
        </h1>
        <p className="text-base text-zinc-400 mb-6">
          Publica tu servicio o busca lo que necesitas. Gratis.
        </p>
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-lg font-bold shadow-lg shadow-orange-200 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] transition-all">
          <Plus className="h-6 w-6" /> Publicar ahora
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-300" />
        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar..."
          className="w-full pl-12 pr-12 h-14 bg-zinc-50 border-0 rounded-2xl text-base text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all" />
        {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500"><X className="h-5 w-5" /></button>}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
        <button onClick={() => { setFilterTipo(''); setFilterCat(''); }}
          className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${!filterTipo && !filterCat ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
          Todo
        </button>
        <button onClick={() => setFilterTipo(filterTipo === 'oferta' ? '' : 'oferta')}
          className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${filterTipo === 'oferta' ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
          Ofrezco
        </button>
        <button onClick={() => setFilterTipo(filterTipo === 'necesidad' ? '' : 'necesidad')}
          className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${filterTipo === 'necesidad' ? 'bg-blue-500 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
          Necesito
        </button>
      </div>

      {/* Categories */}
      {!filterTipo && !searchTerm && (
        <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIAS.map(cat => (
            <button key={cat.value} onClick={() => setFilterCat(filterCat === cat.value ? '' : cat.value)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${filterCat === cat.value ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-white border-zinc-200 text-zinc-500'}`}>
              <cat.icon className="h-4 w-4" /> {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      <p className="text-sm text-zinc-400 mb-4">{total} publicacion{total !== 1 ? 'es' : ''}</p>

      {/* Listings */}
      {loading && listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-orange-400 animate-spin mb-4" />
          <p className="text-base text-zinc-400">Cargando...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-3xl bg-zinc-50 flex items-center justify-center mx-auto mb-5">
            <Briefcase className="h-10 w-10 text-zinc-300" />
          </div>
          <h3 className="text-xl font-bold text-zinc-700 mb-2">Sin publicaciones aun</h3>
          <p className="text-base text-zinc-400 mb-6">Sé el primero en publicar</p>
          <button onClick={() => setShowForm(true)} className="px-8 py-3 rounded-2xl bg-zinc-900 text-white text-base font-semibold">
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
            <div className="flex justify-center pt-6">
              <button onClick={() => loadListings(page + 1, true)} disabled={loading}
                className="px-6 py-3 rounded-2xl border border-zinc-200 text-base font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 flex items-center gap-2 transition-all">
                {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                Ver mas
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

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all active:scale-[0.99]">
        {/* Photo */}
        {img && (
          <div className="relative">
            <img src={img} alt={item.titulo} className="w-full h-48 object-cover" />
            <span className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full ${isOferta ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>
              {isOferta ? 'OFREZCO' : 'NECESITO'}
            </span>
            {item.precio && (
              <span className="absolute top-3 right-3 text-sm font-bold px-3 py-1 rounded-full bg-white/90 backdrop-blur text-zinc-900 shadow">
                {item.precio}
              </span>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-5" onClick={onToggle}>
          {!img && (
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${isOferta ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                {isOferta ? 'OFREZCO' : 'NECESITO'}
              </span>
              {item.precio && <span className="text-sm font-bold text-orange-600">{item.precio}</span>}
              <span className="text-xs px-2 py-1 rounded-full bg-zinc-100 text-zinc-500">{CAT_LABELS[item.categoria] || item.categoria}</span>
            </div>
          )}

          <h3 className="text-lg font-bold text-zinc-900 mb-1">{item.titulo}</h3>

          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <span className="font-medium text-zinc-600">{item.user.nombre}</span>
            {item.ciudad && (
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{item.ciudad}</span>
            )}
            <span>{timeAgo(item.createdAt)}</span>
          </div>

          {/* Expanded */}
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-4 pt-4 border-t border-zinc-100">
                  {(() => {
                    const imgs = (() => { try { if (item.imagenUrls) return JSON.parse(item.imagenUrls).filter(Boolean); } catch {} return item.imagenUrl ? [item.imagenUrl] : []; })();
                    if (imgs.length > 1) return (
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {imgs.slice(0, 3).map((url: string, idx: number) => <img key={idx} src={url} alt="" className="w-full rounded-xl h-28 object-cover" />)}
                      </div>
                    );
                    return null;
                  })()}
                  {item.descripcion && <p className="text-base text-zinc-600 leading-relaxed mb-4">{item.descripcion}</p>}
                  <div className="flex flex-wrap gap-3">
                    {item.contacto && (
                      <a href={`tel:${item.contacto.replace(/\s/g, '')}`}
                        className="flex items-center gap-2 px-5 py-3 bg-zinc-900 text-white rounded-xl font-semibold text-base hover:bg-zinc-800 transition-colors">
                        <Phone className="h-5 w-5" /> Llamar
                      </a>
                    )}
                    {item.precio && (
                      <div className="flex items-center gap-2 px-5 py-3 bg-orange-50 text-orange-700 rounded-xl font-semibold text-base">
                        <Tag className="h-5 w-5" /> {item.precio}
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
  const canPublish = true;

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => !submitting && onClose()}>
      <motion.div initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-lg px-6 pt-6 pb-4 z-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-zinc-900">Publicar</h2>
            <button onClick={() => !submitting && onClose()} className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex-1 h-1.5 rounded-full transition-all duration-300"
                style={{ background: step >= s ? '#f97316' : '#e4e4e7' }} />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className={`text-xs font-medium ${step === 1 ? 'text-orange-600' : 'text-zinc-300'}`}>Tus datos</span>
            <span className={`text-xs font-medium ${step === 2 ? 'text-orange-600' : 'text-zinc-300'}`}>Publicacion</span>
            <span className={`text-xs font-medium ${step === 3 ? 'text-orange-600' : 'text-zinc-300'}`}>Detalles</span>
          </div>
        </div>

        <div className="px-6 pb-8">
          {/* STEP 1: Who are you */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pt-4 space-y-5">
              <div>
                <h3 className="text-2xl font-bold text-zinc-900 mb-1">Tus datos</h3>
                <p className="text-base text-zinc-400">Para que te puedan contactar</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-2 block">Tu nombre *</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Maria Garcia"
                  className="w-full h-14 px-4 rounded-2xl border border-zinc-200 text-base text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all" />
              </div>

              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-2 block">Tu telefono *</label>
                <input value={contacto} onChange={e => setContacto(e.target.value)} placeholder="+53 5555 0000"
                  className="w-full h-14 px-4 rounded-2xl border border-zinc-200 text-base text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all" />
              </div>

              {/* Tipo */}
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-3 block">Que quieres hacer?</label>
                <div className="grid grid-cols-2 gap-3">
                  {([['oferta', 'Ofrezco un servicio', Send, 'emerald'], ['necesidad', 'Necesito un servicio', Search, 'blue']] as const).map(([v, l, I, c]) => (
                    <button key={String(v)} type="button" onClick={() => setTipo(v as any)}
                      className={`p-4 rounded-2xl border-2 text-center transition-all ${tipo === v ? `border-${c}-500 bg-${c}-50` : 'border-zinc-200 hover:border-zinc-300'}`}>
                      <I className={`h-7 w-7 mx-auto mb-2 ${tipo === v ? `text-${c}-600` : 'text-zinc-300'}`} />
                      <p className={`text-base font-semibold ${tipo === v ? `text-${c}-700` : 'text-zinc-500'}`}>{l}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={goNext} disabled={!canNext1}
                className="w-full h-14 rounded-2xl bg-zinc-900 text-white text-base font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                Continuar <ChevronRight className="h-5 w-5" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: What */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pt-4 space-y-5">
              <div>
                <h3 className="text-2xl font-bold text-zinc-900 mb-1">Que publicas?</h3>
                <p className="text-base text-zinc-400">Describe tu servicio o necesidad</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-2 block">Titulo *</label>
                <input value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={120}
                  placeholder={tipo === 'oferta' ? 'Ej: Pintura de interiores' : 'Ej: Necesito un electricista'}
                  className="w-full h-14 px-4 rounded-2xl border border-zinc-200 text-base text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all" />
              </div>

              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-2 block">Descripcion</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} maxLength={500}
                  placeholder="Describe tu servicio, experiencia, que incluye..."
                  className="w-full h-32 px-4 py-3 rounded-2xl border border-zinc-200 text-base resize-none text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-2 block">Categoria</label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)}
                    className="w-full h-14 px-4 rounded-2xl border border-zinc-200 text-base bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all">
                    {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-2 block">Ciudad</label>
                  <input value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="La Habana"
                    className="w-full h-14 px-4 rounded-2xl border border-zinc-200 text-base text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all" />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={goBack}
                  className="flex-1 h-14 rounded-2xl border border-zinc-200 text-base font-bold text-zinc-700 flex items-center justify-center hover:bg-zinc-50 transition-all">
                  Atras
                </button>
                <button onClick={goNext} disabled={!canNext2}
                  className="flex-1 h-14 rounded-2xl bg-zinc-900 text-white text-base font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  Continuar <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Extras & Publish */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pt-4 space-y-5">
              <div>
                <h3 className="text-2xl font-bold text-zinc-900 mb-1">Detalles extra</h3>
                <p className="text-base text-zinc-400">Opcional, pero ayuda mucho</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-2 block">Precio</label>
                <input value={precio} onChange={e => setPrecio(e.target.value)} placeholder="$20, Negociable, Gratis..."
                  className="w-full h-14 px-4 rounded-2xl border border-zinc-200 text-base text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all" />
              </div>

              {/* Photos */}
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-3 block">Fotos (opcional)</label>
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map(idx => (
                    <div key={idx}>
                      {imagenes[idx] ? (
                        <div className="relative rounded-2xl overflow-hidden border border-zinc-200 aspect-square">
                          <img src={imagenes[idx]} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => { const n = [...imagenes]; n[idx] = ''; setImagenes(n); }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div onClick={() => fileRefs[idx].current?.click()}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) uploadImage(f, idx); }}
                          className="aspect-square border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-all">
                          {uploading ? <Loader2 className="h-6 w-6 animate-spin text-orange-400" /> : <ImagePlus className="h-6 w-6 text-zinc-300" />}
                        </div>
                      )}
                      <input ref={fileRefs[idx]} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, idx); e.target.value = ''; }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-zinc-50 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Resumen</p>
                <p className="text-base text-zinc-900"><span className="font-semibold">{nombre}</span> · {contacto}</p>
                <p className="text-base text-zinc-900 font-semibold">{titulo}</p>
                {precio && <p className="text-base text-orange-600 font-semibold">{precio}</p>}
              </div>

              <div className="flex gap-3">
                <button onClick={goBack} disabled={submitting}
                  className="flex-1 h-14 rounded-2xl border border-zinc-200 text-base font-bold text-zinc-700 flex items-center justify-center hover:bg-zinc-50 transition-all">
                  Atras
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-base font-bold flex items-center justify-center gap-2 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all shadow-lg shadow-orange-200">
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-5 w-5" /> Publicar</>}
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
