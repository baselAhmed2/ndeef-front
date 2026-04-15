"use client";

import { useState, useEffect, useRef } from "react";
import { getServices, createService, updateService, deleteService, uploadServiceImage, suggestPrice } from "@/app/lib/laundry-admin-client";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Sparkles,
  WashingMachine,
  Wind,
  Droplets,
  Shirt,
  Star,
  X,
  Check,
  AlertTriangle,
  Camera,
  Loader2,
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  active: boolean;
  popular: boolean;
  icon: React.ElementType;
  orders: number;
  rating: number;
}

const initialServices: Service[] = [
  {
    id: "svc-1",
    name: "Wash & Fold",
    description: "Professional washing and neatly folded delivery",
    price: 15.0,
    unit: "per bag",
    category: "Washing",
    active: true,
    popular: true,
    icon: WashingMachine,
    orders: 138,
    rating: 4.9,
  },
  {
    id: "svc-2",
    name: "Dry Cleaning",
    description: "Expert dry cleaning for delicate and premium garments",
    price: 35.0,
    unit: "per piece",
    category: "Dry Cleaning",
    active: true,
    popular: true,
    icon: Sparkles,
    orders: 94,
    rating: 4.8,
  },
  {
    id: "svc-3",
    name: "Ironing",
    description: "Crisp and professional ironing for all garment types",
    price: 4.0,
    unit: "per piece",
    category: "Ironing",
    active: true,
    popular: false,
    icon: Shirt,
    orders: 72,
    rating: 4.7,
  },
  {
    id: "svc-4",
    name: "Stain Removal",
    description: "Specialized treatment for tough and stubborn stains",
    price: 20.0,
    unit: "per item",
    category: "Special Care",
    active: true,
    popular: false,
    icon: Droplets,
    orders: 41,
    rating: 4.6,
  },
  {
    id: "svc-5",
    name: "Curtain & Linen Wash",
    description: "Large-item laundering for curtains, bed sheets, and linens",
    price: 25.0,
    unit: "per set",
    category: "Washing",
    active: true,
    popular: false,
    icon: Wind,
    orders: 29,
    rating: 4.5,
  },
  {
    id: "svc-6",
    name: "Wash & Iron",
    description: "Complete washing and ironing package for your clothes",
    price: 18.0,
    unit: "per bag",
    category: "Combo",
    active: false,
    popular: false,
    icon: WashingMachine,
    orders: 17,
    rating: 4.4,
  },
];

const categories = ["All", "Washing", "Dry Cleaning", "Ironing", "Special Care", "Combo"];

interface ServiceModalProps {
  service?: Partial<Service>;
  onClose: () => void;
  onSave: (data: Partial<Service>) => void;
}

function ServiceModal({ service, onClose, onSave }: ServiceModalProps) {
  const [form, setForm] = useState({
    name: service?.name ?? "",
    description: service?.description ?? "",
    price: service?.price ?? 0,
    unit: service?.unit ?? "per piece",
    category: service?.category ?? "Washing",
    active: service?.active ?? true,
    popular: service?.popular ?? false,
    image: null as string | null,
  });

  const isEdit = !!service?.id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadServiceImage(formData);
      if (res?.url) setForm({ ...form, image: res.url });
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSuggestPrice = async () => {
    if (!form.name || !form.category) return;
    try {
      setSuggesting(true);
      const res = await suggestPrice({ serviceName: form.name, category: form.category });
      if (res?.suggestedPrice) setForm({ ...form, price: res.suggestedPrice });
    } catch (err) {
      console.error(err);
    } finally {
      setSuggesting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-gray-900 font-semibold">{isEdit ? "Edit Service" : "Add New Service"}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden shrink-0">
                {uploading ? (
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                ) : form.image ? (
                  <img src={form.image} alt="Service" className="w-full h-full object-cover" />
                ) : (
                  <WashingMachine className="w-6 h-6 text-gray-300" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full border border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-all z-10"
              >
                <Camera className="w-3.5 h-3.5 text-gray-600" />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Service Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full h-10 px-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20"
                placeholder="e.g. Wash & Fold"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20 resize-none"
              placeholder="Brief descriptionâ€¦"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Price ($)</label>
                <button
                  onClick={handleSuggestPrice}
                  disabled={suggesting || !form.name}
                  className="flex items-center gap-1 text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full hover:bg-purple-100 transition-colors disabled:opacity-50"
                  title="Suggest Price using AI"
                >
                  {suggesting ? "..." : <Sparkles className="w-3 h-3" />} Suggest Price
                </button>
              </div>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                className="w-full h-10 px-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Unit</label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full h-10 px-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20 bg-white"
              >
                <option>per piece</option>
                <option>per bag</option>
                <option>per kg</option>
                <option>per set</option>
                <option>per item</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full h-10 px-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20 bg-white"
            >
              {categories.slice(1).map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setForm({ ...form, active: !form.active })}
                className={`w-11 h-6 rounded-full transition-all relative ${form.active ? "" : "bg-gray-200"}`}
                style={form.active ? { backgroundColor: "#1D5B70" } : {}}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.active ? "left-5" : "left-0.5"}`}
                />
              </div>
              <span className="text-sm text-gray-700">{form.active ? "Active" : "Inactive"}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setForm({ ...form, popular: !form.popular })}
                className={`w-11 h-6 rounded-full transition-all relative ${form.popular ? "" : "bg-gray-200"}`}
                style={form.popular ? { backgroundColor: "#EBA050" } : {}}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.popular ? "left-5" : "left-0.5"}`}
                />
              </div>
              <span className="text-sm text-gray-700">Popular</span>
            </label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "#1D5B70" }}
          >
            <Check className="w-4 h-4" />
            {isEdit ? "Save Changes" : "Add Service"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = services.filter((s) => {
    const matchCat = activeCategory === "All" || s.category === activeCategory;
    const matchSearch =
      search === "" ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  useEffect(() => {
    getServices().then((data) => {
      if (data && Array.isArray(data)) setServices(data as Service[]);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleToggle = async (id: string) => {
    const svc = services.find((s) => s.id === id);
    if (!svc) return;
    try {
      await updateService(id, { active: !svc.active });
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDelete = async () => {
    if (deletingId) {
      try {
        await deleteService(deletingId);
        setServices((prev) => prev.filter((s) => s.id !== deletingId));
      } catch (e) {
        console.error(e);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleSave = async (data: Partial<Service>) => {
    try {
      if (editingService) {
        await updateService(editingService.id, data);
        setServices((prev) =>
          prev.map((s) => (s.id === editingService.id ? { ...s, ...data } : s))
        );
      } else {
        const created = await createService(data);
        const newSvc: Service = {
          id: created?.id || `svc-${Date.now()}`,
          icon: WashingMachine,
          orders: created?.orders || 0,
          rating: created?.rating || 5.0,
          name: data.name ?? "New Service",
          description: data.description ?? "",
          price: data.price ?? 0,
          unit: data.unit ?? "per piece",
          category: data.category ?? "Washing",
          active: data.active ?? true,
          popular: data.popular ?? false,
        };
        setServices((prev) => [...prev, newSvc]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setModalOpen(false);
      setEditingService(undefined);
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-gray-900 font-semibold">Service Catalog</h2>
          <p className="text-gray-400 text-xs mt-0.5">{services.length} services configured</p>
        </div>
        <button
          onClick={() => { setEditingService(undefined); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white transition-all hover:opacity-90"
          style={{ backgroundColor: "#1D5B70" }}
        >
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all ${
                activeCategory === cat ? "text-white" : "text-gray-500 bg-white border border-gray-200 hover:bg-gray-50"
              }`}
              style={activeCategory === cat ? { backgroundColor: "#1D5B70" } : {}}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search servicesâ€¦"
            className="pl-9 pr-4 h-9 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20 w-full sm:w-56 bg-white"
          />
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {filtered.map((svc, i) => {
            const Icon = svc.icon;
            return (
              <motion.div
                key={svc.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                className={`bg-white rounded-2xl border p-5 transition-all ${
                  svc.active ? "border-gray-100" : "border-gray-100 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: svc.active ? "#f0f9ff" : "#f8fafc" }}
                    >
                      <Icon className="w-5 h-5" style={{ color: svc.active ? "#1D5B70" : "#94a3b8" }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-gray-900">{svc.name}</span>
                        {svc.popular && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: "#EBA050" }}
                          >
                            POPULAR
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">{svc.category}</span>
                    </div>
                  </div>
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(svc.id)}
                    className={`w-10 h-5.5 rounded-full transition-all relative shrink-0`}
                    style={{
                      backgroundColor: svc.active ? "#1D5B70" : "#e2e8f0",
                      minWidth: 40,
                      height: 22,
                    }}
                  >
                    <div
                      className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all`}
                      style={{
                        width: 18,
                        height: 18,
                        left: svc.active ? 20 : 2,
                      }}
                    />
                  </button>
                </div>

                <p className="text-xs text-gray-500 mb-4 leading-relaxed">{svc.description}</p>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xl font-bold" style={{ color: "#1D5B70" }}>${svc.price.toFixed(2)}</span>
                    <span className="text-xs text-gray-400 ml-1">{svc.unit}</span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-semibold text-gray-700">{svc.rating}</span>
                    </div>
                    <p className="text-[10px] text-gray-400">{svc.orders} orders</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => { setEditingService(svc); setModalOpen(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => setDeletingId(svc.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-10 h-10 mb-3 opacity-40 animate-spin" />
          <p className="text-sm font-medium">Loading services...</p>
        </div>
      ) : filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Sparkles className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">No services found</p>
          <p className="text-xs mt-1">Try a different search or category</p>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <ServiceModal
            service={editingService}
            onClose={() => { setModalOpen(false); setEditingService(undefined); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setDeletingId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setDeletingId(null)}
                className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Delete Service</h3>
                  <p className="text-xs text-gray-400">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-5">
                Are you sure you want to remove this service? It will no longer be available for customers.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

