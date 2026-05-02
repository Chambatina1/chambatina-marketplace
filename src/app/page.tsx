'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, X, ChevronDown, ChevronUp, Send, Heart, Wrench,
  GraduationCap, Truck, Palette, Home as HomeIcon, Sparkles,
  Handshake, Phone, MapPin, Clock, Filter, Loader2, Tag,
  ImagePlus, User as UserIcon, Briefcase,
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
  { value: '', label: 'Todas', icon: Search },
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
CAT_LABELS['alimentos'] = 'Alimentos';

// ===== TOAST =====
function toast(msg: string, type: 'ok' | 'err' = 'ok') {
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:9999;padding:10px 20px;border-radius:12px;font-size:14px;font-weight:500;color:#fff;transition:opacity .3s;box-shadow:0 4px 20px rgba(0,0,0,.15);`;
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
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-orange-100">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <Handshake className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm text-zinc-900">Marketplace</span>
        </div>
        <p className="text-[11px] text-zinc-400">Publica y encuentra servicios gratis</p>
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
    <div className="max-w-5xl mx-auto px-4 pt-4 pb-24">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Marketplace</h1>
          <p className="text-xs text-zinc-500">Encuentra y ofrece servicios en tu comunidad</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold shadow-md hover:from-amber-600 hover:to-orange-600 transition-all">
          <Plus className="h-4 w-4" /> Publicar
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar servicios... (pintor, electricista, profesor...)"
          className="w-full pl-10 pr-10 h-11 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-400" />
        {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"><X className="h-4 w-4" /></button>}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex gap-1 bg-zinc-100 rounded-lg p-1">
          {['', 'oferta', 'necesidad'].map(v => (
            <button key={v} onClick={() => setFilterTipo(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterTipo === v ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}>
              {v === '' ? 'Todo' : v === 'oferta' ? 'Ofrezco' : 'Necesito'}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIAS.filter(c => c.value).map(cat => (
            <button key={cat.value} onClick={() => setFilterCat(filterCat === cat.value ? '' : cat.value)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${filterCat === cat.value ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-zinc-200 text-zinc-500'}`}>
              <cat.icon className="h-3 w-3" /> {cat.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-zinc-400 mb-3">{total} publicacion{total !== 1 ? 'es' : ''}</p>

      {/* Listings */}
      {loading && listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16"><Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-3" /><p className="text-sm text-zinc-400">Cargando...</p></div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4"><Briefcase className="h-8 w-8 text-amber-400" /></div>
          <h3 className="font-semibold text-zinc-700 mb-1">Aun no hay publicaciones</h3>
          <p className="text-sm text-zinc-400 mb-4">Se el primero en publicar</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600">Crear primera publicacion</button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {listings.map((item, i) => {
              const isExp = expandedId === item.id;
              const isOferta = item.tipo === 'oferta';
              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}>
                  <div className="border border-zinc-100 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white overflow-hidden"
                    onClick={() => setExpandedId(isExp ? null : item.id)}>
                    <div className="p-4">
                      <div className="flex gap-3">
                        {/* Thumbnail */}
                        {(() => {
                          const img = (() => { try { if (item.imagenUrls) return JSON.parse(item.imagenUrls).filter(Boolean)[0]; } catch {} return item.imagenUrl || null; })();
                          return img ? (
                            <img src={img} alt={item.titulo} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-zinc-100" />
                          ) : (
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isOferta ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                              {isOferta ? <Send className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                            </div>
                          );
                        })()}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isOferta ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                              {isOferta ? 'OFREZCO' : 'NECESITO'}
                            </span>
                            {item.precio && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><Tag className="h-2 w-2 inline mr-0.5" />{item.precio}</span>}
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">{CAT_LABELS[item.categoria] || item.categoria}</span>
                          </div>
                          <h3 className="font-semibold text-sm text-zinc-900 leading-snug">{item.titulo}</h3>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="text-[11px] text-zinc-500 font-medium">{item.user.nombre}</span>
                            {item.ciudad && <span className="text-[11px] text-zinc-400 flex items-center gap-1"><MapPin className="h-3 w-3" />{item.ciudad}</span>}
                            <span className="text-[11px] text-zinc-400 flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(item.createdAt)}</span>
                          </div>
                          {/* Expanded */}
                          <AnimatePresence>
                            {isExp && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="mt-3 pt-3 border-t border-zinc-100">
                                  {(() => {
                                    const imgs = (() => { try { if (item.imagenUrls) return JSON.parse(item.imagenUrls).filter(Boolean); } catch {} return item.imagenUrl ? [item.imagenUrl] : []; })();
                                    if (imgs.length > 0) return (
                                      <div className={`grid gap-2 mb-3 ${imgs.length === 1 ? 'grid-cols-1' : imgs.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                        {imgs.map((url: string, idx: number) => <img key={idx} src={url} alt="" className="w-full rounded-xl max-h-48 object-cover" />)}
                                      </div>
                                    );
                                    return null;
                                  })()}
                                  {item.descripcion && <p className="text-sm text-zinc-600 leading-relaxed mb-3">{item.descripcion}</p>}
                                  <div className="flex flex-wrap gap-3 text-xs">
                                    {item.contacto && <div className="flex items-center gap-1.5 text-zinc-500 bg-zinc-50 rounded-lg px-3 py-1.5"><Phone className="h-3 w-3" />{item.contacto}</div>}
                                    {item.precio && <div className="flex items-center gap-1.5 text-zinc-500 bg-zinc-50 rounded-lg px-3 py-1.5"><Tag className="h-3 w-3" />{item.precio}</div>}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="text-zinc-300 shrink-0 mt-1">{isExp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {total > LIMIT && page < Math.ceil(total / LIMIT) && (
            <div className="flex justify-center pt-4">
              <button onClick={() => loadListings(page + 1, true)} disabled={loading}
                className="px-4 py-2 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 flex items-center gap-1.5">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Ver mas ({total - page * LIMIT} restantes)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Publish Form Modal */}
      <AnimatePresence>
        {showForm && <PublishForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); loadListings(1); }} />}
      </AnimatePresence>
    </div>
  );
}

// ===== PUBLISH FORM (No auth needed) =====
function PublishForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void; }) {
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
        toast('Imagen cargada');
      } else toast('Error al subir', 'err');
    } catch { toast('Error de conexion', 'err'); }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!nombre.trim()) { toast('Ingresa tu nombre', 'err'); return; }
    if (!titulo.trim() || titulo.trim().length < 3) { toast('Titulo minimo 3 caracteres', 'err'); return; }
    if (!contacto.trim()) { toast('Ingresa un telefono de contacto', 'err'); return; }
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
      if (json.ok) { toast('Publicado con exito'); onSaved(); }
      else toast(json.error || 'Error', 'err');
    } catch { toast('Error de conexion', 'err'); }
    setSubmitting(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={() => !submitting && onClose()}>
      <motion.div initial={{ y: 300, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 300, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-100 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="font-bold text-lg text-zinc-900">Publicar servicio</h2>
          <button onClick={() => !submitting && onClose()} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Nombre + Contacto */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Tu nombre *</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre"
                  className="w-full pl-10 h-11 px-3 rounded-lg border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Telefono *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input value={contacto} onChange={e => setContacto(e.target.value)} placeholder="+53 5555 0000"
                  className="w-full pl-10 h-11 px-3 rounded-lg border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label className="text-xs font-medium text-zinc-600 mb-2 block">Que quieres publicar?</label>
            <div className="grid grid-cols-2 gap-2">
              {([['oferta', 'Ofrezco', 'Publico un servicio', Send, 'emerald'], ['necesidad', 'Necesito', 'Busco un servicio', Search, 'blue']] as const).map(([v, l, d, I, c]) => (
                <button key={String(v)} type="button" onClick={() => setTipo(v as any)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${tipo === v ? `border-${c}-400 bg-${c}-50` : 'border-zinc-200 hover:border-zinc-300'}`}>
                  <I className={`h-5 w-5 mx-auto mb-1 ${tipo === v ? `text-${c}-600` : 'text-zinc-400'}`} />
                  <p className={`text-sm font-medium ${tipo === v ? `text-${c}-700` : 'text-zinc-500'}`}>{l}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{d}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Titulo */}
          <div>
            <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Titulo *</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={120}
              placeholder={tipo === 'oferta' ? 'Ej: Pintura de interiores' : 'Ej: Necesito un electricista'}
              className="w-full h-11 px-3 rounded-lg border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <p className="text-[10px] text-zinc-400 mt-1 text-right">{titulo.length}/120</p>
          </div>

          {/* Descripcion */}
          <div>
            <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Descripcion</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} maxLength={1000}
              placeholder="Describe tu servicio, experiencia, que incluye..."
              className="w-full h-28 px-3 py-2.5 rounded-lg border border-zinc-200 text-sm resize-none text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <p className="text-[10px] text-zinc-400 mt-1 text-right">{desc.length}/1000</p>
          </div>

          {/* Categoria + Ciudad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Categoria</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-zinc-200 text-sm bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-400">
                {CATEGORIAS.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Ciudad</label>
              <input value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="Ej: La Habana"
                className="w-full h-11 px-3 rounded-lg border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>

          {/* Precio */}
          <div>
            <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Precio</label>
            <input value={precio} onChange={e => setPrecio(e.target.value)} placeholder="$20, Negociable..."
              className="w-full h-11 px-3 rounded-lg border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>

          {/* 3 Photos */}
          <div>
            <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Fotos del servicio o producto (hasta 3)</label>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map(idx => (
                <div key={idx}>
                  {imagenes[idx] ? (
                    <div className="relative rounded-xl overflow-hidden border border-zinc-200 aspect-square">
                      <img src={imagenes[idx]} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => { const n = [...imagenes]; n[idx] = ''; setImagenes(n); }}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70">
                        <X className="h-3 w-3" />
                      </button>
                      <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-full">{idx + 1}</span>
                    </div>
                  ) : (
                    <div onClick={() => fileRefs[idx].current?.click()}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) uploadImage(f, idx); }}
                      className="aspect-square border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-colors">
                      {uploading ? <Loader2 className="h-5 w-5 animate-spin text-orange-400" /> : <ImagePlus className="h-5 w-5 text-zinc-300" />}
                      <p className="text-[9px] text-zinc-400 mt-1">Foto {idx + 1}</p>
                    </div>
                  )}
                  <input ref={fileRefs[idx]} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, idx); e.target.value = ''; }} />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">JPG, PNG, GIF, WebP (max 4MB cada una)</p>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={submitting || !titulo.trim() || !nombre.trim()}
            className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Publicar
          </button>
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
