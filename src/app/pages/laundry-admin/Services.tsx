"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createService,
  deleteService,
  getServiceCatalog,
  type ServiceCatalogDTO,
  updateService,
} from "@/app/lib/laundry-admin-client";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  Edit2,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

type ServiceCard = {
  id: string;
  name: string;
  category: string;
  active: boolean;
  price: number | null;
  isAdded: boolean;
  existingServiceId: string | null;
  recommendedPrice: number | null;
  suggestedMinPrice: number | null;
  suggestedMaxPrice: number | null;
  suggestionReasoning: string | null;
};

const categories = ["All", "Washing", "Dry Cleaning", "Ironing", "Special Care"];

function normalizeCatalogItem(item: ServiceCatalogDTO): ServiceCard {
  return {
    id: `${item.category}-${item.serviceName}`.toLowerCase().replace(/\s+/g, "-"),
    name: item.serviceName,
    category: item.category,
    active: item.isAvailable ?? true,
    price: item.currentPrice ?? null,
    isAdded: item.isAdded,
    existingServiceId:
      item.existingServiceId !== null ? String(item.existingServiceId) : null,
    recommendedPrice: item.recommendedPrice ?? null,
    suggestedMinPrice: item.suggestedMinPrice ?? null,
    suggestedMaxPrice: item.suggestedMaxPrice ?? null,
    suggestionReasoning: item.suggestionReasoning ?? null,
  };
}

interface ServiceModalProps {
  service?: ServiceCard;
  onClose: () => void;
  onSave: (data: { price: number; active: boolean }) => Promise<void>;
}

function ServiceModal({ service, onClose, onSave }: ServiceModalProps) {
  const [price, setPrice] = useState(service?.price ?? service?.recommendedPrice ?? 0);
  const [active, setActive] = useState(service?.active ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!service) return null;

  const handleSubmit = async () => {
    if (!Number.isFinite(price) || price <= 0) {
      setError("Price must be greater than 0.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await onSave({ price, active });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save service.");
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 16 }}
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="font-semibold text-gray-900">
              {service.isAdded ? "Edit Service" : "Add Service"}
            </h3>
            <p className="mt-0.5 text-xs text-gray-400">
              {service.name} - {service.category}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Service Name
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">{service.name}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Price (EGP)
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(Number(event.target.value))}
                className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-[#1D5B70] focus:outline-none focus:ring-2 focus:ring-[#1D5B70]/20"
              />
            </label>

            <div>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Availability
              </span>
              <button
                type="button"
                onClick={() => setActive((value) => !value)}
                className={`relative h-11 w-full rounded-xl border text-sm font-medium transition-all ${
                  active
                    ? "border-[#1D5B70]/20 bg-[#1D5B70]/5 text-[#1D5B70]"
                    : "border-gray-200 bg-gray-50 text-gray-500"
                }`}
              >
                {active ? "Available to customers" : "Hidden from customers"}
              </button>
            </div>
          </div>

          {(service.recommendedPrice !== null ||
            service.suggestedMinPrice !== null ||
            service.suggestedMaxPrice !== null) && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
                <Sparkles className="h-4 w-4" />
                Suggested Pricing
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-amber-900">
                {service.recommendedPrice !== null && (
                  <span>Recommended: {service.recommendedPrice.toFixed(2)} EGP</span>
                )}
                {service.suggestedMinPrice !== null && (
                  <span>Min: {service.suggestedMinPrice.toFixed(2)} EGP</span>
                )}
                {service.suggestedMaxPrice !== null && (
                  <span>Max: {service.suggestedMaxPrice.toFixed(2)} EGP</span>
                )}
              </div>
              {service.suggestionReasoning && (
                <p className="mt-2 text-xs leading-relaxed text-amber-800">
                  {service.suggestionReasoning}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: "#1D5B70" }}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {service.isAdded ? "Save Changes" : "Add Service"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Services() {
  const [services, setServices] = useState<ServiceCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCard | undefined>();
  const [deletingService, setDeletingService] = useState<ServiceCard | undefined>();

  const filtered = useMemo(() => {
    return services.filter((service) => {
      const matchCategory =
        activeCategory === "All" || service.category === activeCategory;
      const term = search.trim().toLowerCase();
      const matchSearch =
        term.length === 0 ||
        service.name.toLowerCase().includes(term) ||
        service.category.toLowerCase().includes(term);
      return matchCategory && matchSearch;
    });
  }, [activeCategory, search, services]);

  const configuredCount = useMemo(
    () => services.filter((service) => service.isAdded).length,
    [services],
  );

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getServiceCatalog(true);
      setServices(data.map(normalizeCatalogItem));
    } catch (loadError) {
      console.error(loadError);
      setError("Could not load services from backend.");
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadServices();
  }, []);

  const openServiceModal = (service: ServiceCard) => {
    setEditingService(service);
    setModalOpen(true);
  };

  const handleSave = async (data: { price: number; active: boolean }) => {
    if (!editingService) return;

    try {
      setError(null);
      if (editingService.isAdded && editingService.existingServiceId) {
        await updateService(editingService.existingServiceId, {
          name: editingService.name,
          category: editingService.category,
          price: data.price,
          active: data.active,
        });
      } else {
        await createService({
          name: editingService.name,
          category: editingService.category,
          price: data.price,
          active: data.active,
        });
      }

      await loadServices();
      setModalOpen(false);
      setEditingService(undefined);
    } catch (saveError) {
      console.error(saveError);
      throw saveError instanceof Error
        ? saveError
        : new Error("Could not save service.");
    }
  };

  const confirmDelete = async () => {
    if (!deletingService?.existingServiceId) return;

    try {
      await deleteService(deletingService.existingServiceId);
      await loadServices();
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete service.");
    } finally {
      setDeletingService(undefined);
    }
  };

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-semibold text-gray-900">Service Catalog</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            {configuredCount} of {services.length} catalog services configured
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                activeCategory === category
                  ? "text-white"
                  : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
              }`}
              style={activeCategory === category ? { backgroundColor: "#1D5B70" } : {}}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="relative sm:ml-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search catalog..."
            className="h-9 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 text-sm focus:border-[#1D5B70] focus:outline-none focus:ring-2 focus:ring-[#1D5B70]/20 sm:w-56"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {filtered.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.18, delay: index * 0.02 }}
              className={`rounded-2xl border bg-white p-5 transition-all ${
                service.isAdded
                  ? "border-[#1D5B70]/15 shadow-sm"
                  : "border-gray-100"
              }`}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{service.name}</p>
                    {service.isAdded ? (
                      <span className="rounded-full bg-[#1D5B70]/10 px-2 py-0.5 text-[10px] font-bold text-[#1D5B70]">
                        ADDED
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                        CATALOG
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">{service.category}</p>
                </div>
                {service.isAdded ? (
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                      service.active
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {service.active ? "Available" : "Hidden"}
                  </span>
                ) : null}
              </div>

              <div className="space-y-2 rounded-2xl bg-gray-50 px-4 py-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Current price</span>
                  <span className="font-semibold text-gray-800">
                    {service.price !== null ? `${service.price.toFixed(2)} EGP` : "Not set"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Recommended</span>
                  <span className="font-semibold text-[#1D5B70]">
                    {service.recommendedPrice !== null
                      ? `${service.recommendedPrice.toFixed(2)} EGP`
                      : "Unavailable"}
                  </span>
                </div>
                {(service.suggestedMinPrice !== null || service.suggestedMaxPrice !== null) && (
                  <div className="text-[11px] text-gray-500">
                    Suggested range:
                    {" "}
                    {service.suggestedMinPrice !== null
                      ? `${service.suggestedMinPrice.toFixed(2)}`
                      : "-"}
                    {" - "}
                    {service.suggestedMaxPrice !== null
                      ? `${service.suggestedMaxPrice.toFixed(2)}`
                      : "-"}{" "}
                    EGP
                  </div>
                )}
              </div>

              {service.suggestionReasoning && (
                <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-gray-500">
                  {service.suggestionReasoning}
                </p>
              )}

              <div className="mt-4 flex items-center gap-2 border-t border-gray-50 pt-3">
                <button
                  onClick={() => openServiceModal(service)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs font-medium text-gray-700 transition-all hover:bg-gray-50"
                >
                  {service.isAdded ? (
                    <>
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" /> Add
                    </>
                  )}
                </button>

                {service.isAdded && service.existingServiceId ? (
                  <button
                    onClick={() => setDeletingService(service)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="mb-3 h-10 w-10 animate-spin opacity-40" />
          <p className="text-sm font-medium">Loading services...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Sparkles className="mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm font-medium">No catalog services found</p>
          <p className="mt-1 text-xs">Try a different search or category</p>
        </div>
      ) : null}

      <AnimatePresence>
        {modalOpen && editingService && (
          <ServiceModal
            service={editingService}
            onClose={() => {
              setModalOpen(false);
              setEditingService(undefined);
            }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setDeletingService(undefined)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 14 }}
              className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                onClick={() => setDeletingService(undefined)}
                className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="font-semibold text-gray-900">Delete Service</h3>
              <p className="mt-2 text-sm text-gray-600">
                Remove <span className="font-medium">{deletingService.name}</span> from your laundry catalog?
              </p>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setDeletingService(undefined)}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void confirmDelete()}
                  className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-600"
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
