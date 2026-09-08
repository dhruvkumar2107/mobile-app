'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { variantsAPI, productsAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { ArrowLeft, Plus, Trash2, Save, Grid3X3, Package, DollarSign, Edit2, Check, X, ChevronDown, ChevronUp, Eye, Bell, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import type { Product, VariantAttribute, Variant, PriceRule } from '@/types';

type Tab = 'attributes' | 'grid' | 'bulk' | 'rules' | 'preview';

interface AttributeDraft {
  id: string;
  name: string;
  type: 'text' | 'color' | 'size';
  values: { name: string; hex?: string }[];
  newValue: string;
  newHex: string;
}

interface PriceRuleDraft {
  type: 'percentage' | 'fixed' | 'flash';
  value: number;
  name: string;
  startDate: string;
  endDate: string;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function VariantManagerPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('attributes');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [attributes, setAttributes] = useState<AttributeDraft[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [priceRules, setPriceRules] = useState<PriceRule[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [bulkEditValue, setBulkEditValue] = useState({ stock: '', priceDelta: '', availability: '' });
  const [newRuleDraft, setNewRuleDraft] = useState<PriceRuleDraft>({
    type: 'percentage',
    value: 0,
    name: '',
    startDate: '',
    endDate: '',
  });
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [previewSelectedAttr, setPreviewSelectedAttr] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [prodRes, gridRes] = await Promise.allSettled([
          productsAPI.getById(productId),
          variantsAPI.getGrid(productId).catch(() => ({ data: null })),
        ]);

        const prod = prodRes.status === 'fulfilled' ? prodRes.value.data : null;
        setProduct(prod);

        const gridData = gridRes.status === 'fulfilled' ? gridRes.value.data : null;
        if (gridData) {
          if (gridData.attributes) {
            setAttributes(
              gridData.attributes.map((a: any) => ({
                id: a.id || generateId(),
                name: a.name,
                type: a.type || 'text',
                values: a.values || [],
                newValue: '',
                newHex: '',
              }))
            );
          }
          if (gridData.variants) {
            setVariants(gridData.variants);
          }
          if (gridData.priceRules) {
            setPriceRules(gridData.priceRules);
          }
        }
      } catch {
        setError('Failed to load product data.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [productId]);

  const addAttribute = useCallback(() => {
    setAttributes((prev) => [
      ...prev,
      { id: generateId(), name: '', type: 'text', values: [], newValue: '', newHex: '' },
    ]);
  }, []);

  const removeAttribute = useCallback((attrId: string) => {
    setAttributes((prev) => prev.filter((a) => a.id !== attrId));
  }, []);

  const updateAttribute = useCallback((attrId: string, field: string, value: any) => {
    setAttributes((prev) =>
      prev.map((a) => (a.id === attrId ? { ...a, [field]: value } : a))
    );
  }, []);

  const addValue = useCallback((attrId: string) => {
    setAttributes((prev) =>
      prev.map((a) => {
        if (a.id !== attrId || !a.newValue.trim()) return a;
        return {
          ...a,
          values: [...a.values, { name: a.newValue.trim(), hex: a.newHex || undefined }],
          newValue: '',
          newHex: '',
        };
      })
    );
  }, []);

  const removeValue = useCallback((attrId: string, valueIndex: number) => {
    setAttributes((prev) =>
      prev.map((a) =>
        a.id === attrId
          ? { ...a, values: a.values.filter((_, i) => i !== valueIndex) }
          : a
      )
    );
  }, []);

  const generateAllVariants = useCallback(async () => {
    try {
      setSaving(true);
      await variantsAPI.setAttributes(productId, attributes.map(({ id, ...rest }) => rest));
      const res = await variantsAPI.generateVariants(productId);
      setVariants(res.data?.variants || []);
      setSelectedVariants(new Set());
    } catch {
      setError('Failed to generate variants.');
    } finally {
      setSaving(false);
    }
  }, [productId, attributes]);

  const updateVariant = useCallback(
    async (id: string, field: string, value: any) => {
      setVariants((prev) =>
        prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
      );
      try {
        await variantsAPI.update(id, { [field]: value });
      } catch {
        setError('Failed to update variant.');
      }
    },
    []
  );

  const handleBulkUpdate = useCallback(async () => {
    const updates: Record<string, any> = {};
    if (bulkEditValue.stock !== '') updates.stock = parseInt(bulkEditValue.stock, 10);
    if (bulkEditValue.priceDelta !== '') updates.priceDelta = parseFloat(bulkEditValue.priceDelta);
    if (bulkEditValue.availability) updates.availability = bulkEditValue.availability;

    if (Object.keys(updates).length === 0) return;

    try {
      setSaving(true);
      await variantsAPI.bulkUpdate(Array.from(selectedVariants), updates);
      setVariants((prev) =>
        prev.map((v) =>
          selectedVariants.has(v.id) ? { ...v, ...updates } : v
        )
      );
      setSelectedVariants(new Set());
      setBulkEditValue({ stock: '', priceDelta: '', availability: '' });
    } catch {
      setError('Failed to bulk update variants.');
    } finally {
      setSaving(false);
    }
  }, [selectedVariants, bulkEditValue]);

  const toggleVariantSelect = useCallback((id: string) => {
    setSelectedVariants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAllVariants = useCallback(() => {
    if (selectedVariants.size === variants.length) {
      setSelectedVariants(new Set());
    } else {
      setSelectedVariants(new Set(variants.map((v) => v.id)));
    }
  }, [variants, selectedVariants.size]);

  const addPriceRule = useCallback(async () => {
    if (!newRuleDraft.name) return;
    try {
      setSaving(true);
      const res = await variantsAPI.getByProduct(productId);
      const newRule: PriceRule = {
        id: generateId(),
        productId,
        type: newRuleDraft.type,
        value: newRuleDraft.value,
        name: newRuleDraft.name,
        startDate: newRuleDraft.startDate || undefined,
        endDate: newRuleDraft.endDate || undefined,
        isActive: true,
      };
      setPriceRules((prev) => [...prev, newRule]);
      setNewRuleDraft({ type: 'percentage', value: 0, name: '', startDate: '', endDate: '' });
      setShowRuleModal(false);
    } catch {
      setError('Failed to add price rule.');
    } finally {
      setSaving(false);
    }
  }, [newRuleDraft, productId]);

  const togglePriceRule = useCallback((id: string) => {
    setPriceRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  }, []);

  const deletePriceRule = useCallback((id: string) => {
    setPriceRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const getEffectivePrice = useCallback(
    (variant: Variant) => {
      const base = product?.price || 0;
      const delta = variant.priceDelta || 0;
      return base + delta;
    },
    [product]
  );

  const availabilityColors: Record<string, string> = {
    in_stock: 'success',
    out_of_stock: 'error',
    coming_soon: 'warning',
    discontinued: 'default',
  };

  const availabilityLabels: Record<string, string> = {
    in_stock: 'In Stock',
    out_of_stock: 'Out of Stock',
    coming_soon: 'Coming Soon',
    discontinued: 'Discontinued',
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </AdminLayout>
    );
  }

  if (error && !product) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertTriangle size={48} className="text-warning mb-4" />
          <p className="text-navy font-semibold">{error}</p>
          <Link href="/products">
            <Button variant="secondary" className="mt-4" icon={<ArrowLeft size={16} />}>Back to Products</Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/products/${productId}`}
              className="p-2 text-text-secondary hover:text-navy hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-navy">
                Variant Manager
              </h1>
              <p className="text-sm text-text-secondary mt-0.5">
                {product?.name} &middot; {variants.length} variants &middot;{' '}
                {attributes.length} attributes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <span className="text-xs text-error bg-error-bg px-3 py-1 rounded-full">{error}</span>
            )}
            <Button
              variant="gold"
              size="sm"
              icon={<Grid3X3 size={15} />}
              onClick={generateAllVariants}
              loading={saving}
            >
              Generate Variants
            </Button>
          </div>
        </div>

        <div className="border-b border-border" role="tablist">
          <div className="flex gap-0 overflow-x-auto">
            {([
              { id: 'attributes' as Tab, label: 'Attributes' },
              { id: 'grid' as Tab, label: 'Variant Grid', count: variants.length },
              { id: 'bulk' as Tab, label: 'Bulk Edit', count: selectedVariants.size },
              { id: 'rules' as Tab, label: 'Price Rules', count: priceRules.length },
              { id: 'preview' as Tab, label: 'Preview' },
            ]).map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-gold text-navy'
                    : 'border-transparent text-text-secondary hover:text-navy hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                      activeTab === tab.id
                        ? 'bg-gold/10 text-gold-dark'
                        : 'bg-gray-100 text-text-muted'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'attributes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">
                Define the attribute types (e.g., Color, Size, Storage) and their possible values.
                Variants will be auto-generated from every combination.
              </p>
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus size={15} />}
                onClick={addAttribute}
              >
                Add Attribute
              </Button>
            </div>

            {attributes.length === 0 && (
              <div className="bg-white rounded-xl border border-border p-12 text-center">
                <Package size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-navy font-medium">No attributes yet</p>
                <p className="text-sm text-text-muted mt-1">Click &quot;Add Attribute&quot; to start building variants.</p>
              </div>
            )}

            {attributes.map((attr, attrIdx) => (
              <div key={attr.id} className="bg-white rounded-xl border border-border p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Attribute Name"
                      placeholder="e.g., Color, Size, Storage"
                      value={attr.name}
                      onChange={(e) => updateAttribute(attr.id, 'name', e.target.value)}
                    />
                    <Select
                      label="Type"
                      value={attr.type}
                      onChange={(e) => updateAttribute(attr.id, 'type', e.target.value)}
                      options={[
                        { value: 'text', label: 'Text' },
                        { value: 'color', label: 'Color (with hex)' },
                        { value: 'size', label: 'Size' },
                      ]}
                    />
                  </div>
                  <button
                    onClick={() => removeAttribute(attr.id)}
                    className="mt-6 p-2 text-text-muted hover:text-error hover:bg-error-bg rounded-lg transition-colors"
                    title="Remove attribute"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Values</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {attr.values.map((val, vi) => (
                      <span
                        key={vi}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-navy text-sm rounded-full font-medium"
                      >
                        {attr.type === 'color' && val.hex && (
                          <span
                            className="w-3 h-3 rounded-full border border-gray-300"
                            style={{ backgroundColor: val.hex }}
                          />
                        )}
                        {val.name}
                        <button
                          onClick={() => removeValue(attr.id, vi)}
                          className="ml-0.5 text-text-muted hover:text-error"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    {attr.values.length === 0 && (
                      <span className="text-xs text-text-muted italic">No values added</span>
                    )}
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Add value"
                        value={attr.newValue}
                        onChange={(e) => updateAttribute(attr.id, 'newValue', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addValue(attr.id);
                          }
                        }}
                      />
                    </div>
                    {attr.type === 'color' && (
                      <div className="w-20">
                        <Input
                          type="color"
                          placeholder="Hex"
                          value={attr.newHex}
                          onChange={(e) => updateAttribute(attr.id, 'newHex', e.target.value)}
                          className="h-10 px-1 cursor-pointer"
                        />
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Plus size={14} />}
                      onClick={() => addValue(attr.id)}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'grid' && (
          <div className="space-y-4">
            {variants.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-12 text-center">
                <Grid3X3 size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-navy font-medium">No variants generated</p>
                <p className="text-sm text-text-muted mt-1">Add attributes and click &quot;Generate Variants&quot;.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-gray-50">
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedVariants.size === variants.length && variants.length > 0}
                            onChange={toggleAllVariants}
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                          Variant
                        </th>
                        {attributes.map((a) => (
                          <th
                            key={a.id}
                            className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider"
                          >
                            {a.name || 'Attribute'}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                          Price Delta
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">
                          Availability
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">
                          Active
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {variants.map((variant) => {
                        const isSelected = selectedVariants.has(variant.id);
                        return (
                          <tr
                            key={variant.id}
                            className={`transition-colors ${
                              isSelected ? 'bg-gold/5' : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleVariantSelect(variant.id)}
                                className="rounded border-gray-300"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-navy truncate max-w-[160px] block">
                                {Object.values(variant.attributes).join(' / ')}
                              </span>
                            </td>
                            {attributes.map((a) => (
                              <td key={a.id} className="px-4 py-3 text-text-secondary">
                                {a.type === 'color' && variant.attributes[a.name] ? (
                                  <span className="inline-flex items-center gap-1.5">
                                    <span
                                      className="w-4 h-4 rounded-full border border-gray-300"
                                      style={{
                                        backgroundColor:
                                          a.values.find((v) => v.name === variant.attributes[a.name])?.hex || '#ccc',
                                      }}
                                    />
                                    {variant.attributes[a.name]}
                                  </span>
                                ) : (
                                  variant.attributes[a.name] || '-'
                                )}
                              </td>
                            ))}
                            <td className="px-4 py-3 text-right text-navy font-mono text-xs">
                              {variant.sku}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-navy">
                              {formatCurrency(getEffectivePrice(variant))}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {editingCell?.id === variant.id && editingCell.field === 'priceDelta' ? (
                                <input
                                  type="number"
                                  className="w-20 text-right border border-gold rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                                  defaultValue={variant.priceDelta}
                                  autoFocus
                                  onBlur={(e) => {
                                    updateVariant(variant.id, 'priceDelta', parseFloat(e.target.value) || 0);
                                    setEditingCell(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      updateVariant(variant.id, 'priceDelta', parseFloat((e.target as HTMLInputElement).value) || 0);
                                      setEditingCell(null);
                                    }
                                  }}
                                />
                              ) : (
                                <button
                                  className="text-text-secondary hover:text-navy font-mono text-xs"
                                  onClick={() => setEditingCell({ id: variant.id, field: 'priceDelta' })}
                                >
                                  {variant.priceDelta > 0 ? '+' : ''}{variant.priceDelta}
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {editingCell?.id === variant.id && editingCell.field === 'stock' ? (
                                <input
                                  type="number"
                                  className="w-16 text-right border border-gold rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                                  defaultValue={variant.stock}
                                  autoFocus
                                  onBlur={(e) => {
                                    updateVariant(variant.id, 'stock', parseInt(e.target.value, 10) || 0);
                                    setEditingCell(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      updateVariant(variant.id, 'stock', parseInt((e.target as HTMLInputElement).value, 10) || 0);
                                      setEditingCell(null);
                                    }
                                  }}
                                />
                              ) : (
                                <button
                                  className={`font-mono text-xs ${
                                    variant.stock <= 5 ? 'text-error font-semibold' : 'text-navy'
                                  }`}
                                  onClick={() => setEditingCell({ id: variant.id, field: 'stock' })}
                                >
                                  {variant.stock}
                                  {variant.stock <= 5 && (
                                    <span className="ml-1 text-warning text-[10px]">LOW</span>
                                  )}
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <select
                                value={variant.availability}
                                onChange={(e) =>
                                  updateVariant(variant.id, 'availability', e.target.value)
                                }
                                className="text-xs border border-border rounded px-2 py-1 bg-white text-navy focus:outline-none focus:ring-1 focus:ring-gold"
                              >
                                <option value="in_stock">In Stock</option>
                                <option value="out_of_stock">Out of Stock</option>
                                <option value="coming_soon">Coming Soon</option>
                                <option value="discontinued">Discontinued</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => updateVariant(variant.id, 'isActive', !variant.isActive)}
                                className={`w-10 h-5 rounded-full transition-colors relative ${
                                  variant.isActive ? 'bg-success' : 'bg-gray-300'
                                }`}
                              >
                                <span
                                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                    variant.isActive ? 'left-5' : 'left-0.5'
                                  }`}
                                />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bulk' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy mb-4">
                Bulk Edit ({selectedVariants.size} variants selected)
              </h3>
              {selectedVariants.size === 0 ? (
                <div className="text-center py-8">
                  <Edit2 size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-text-muted">
                    Go to the Variant Grid tab and select variants to bulk edit.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Stock (leave empty to skip)"
                    type="number"
                    placeholder="New stock value"
                    value={bulkEditValue.stock}
                    onChange={(e) =>
                      setBulkEditValue((p) => ({ ...p, stock: e.target.value }))
                    }
                  />
                  <Input
                    label="Price Delta (leave empty to skip)"
                    type="number"
                    placeholder="Price adjustment"
                    value={bulkEditValue.priceDelta}
                    onChange={(e) =>
                      setBulkEditValue((p) => ({ ...p, priceDelta: e.target.value }))
                    }
                  />
                  <Select
                    label="Availability"
                    value={bulkEditValue.availability}
                    onChange={(e) =>
                      setBulkEditValue((p) => ({ ...p, availability: e.target.value }))
                    }
                    options={[
                      { value: '', label: 'Do not change' },
                      { value: 'in_stock', label: 'In Stock' },
                      { value: 'out_of_stock', label: 'Out of Stock' },
                      { value: 'coming_soon', label: 'Coming Soon' },
                      { value: 'discontinued', label: 'Discontinued' },
                    ]}
                  />
                </div>
              )}
              {selectedVariants.size > 0 && (
                <div className="flex justify-end mt-4">
                  <Button
                    variant="gold"
                    size="sm"
                    icon={<Save size={15} />}
                    onClick={handleBulkUpdate}
                    loading={saving}
                  >
                    Apply Changes
                  </Button>
                </div>
              )}
            </div>

            {selectedVariants.size > 0 && (
              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-navy mb-3">Selected Variants</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {variants
                    .filter((v) => selectedVariants.has(v.id))
                    .map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <span className="text-sm font-medium text-navy">
                            {Object.values(v.attributes).join(' / ')}
                          </span>
                          <span className="text-xs text-text-muted ml-2">{v.sku}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <Badge variant={availabilityColors[v.availability] as any}>
                            {availabilityLabels[v.availability]}
                          </Badge>
                          <span className="text-text-secondary">Qty: {v.stock}</span>
                          <span className="font-medium text-navy">{formatCurrency(getEffectivePrice(v))}</span>
                          <button
                            onClick={() => toggleVariantSelect(v.id)}
                            className="text-text-muted hover:text-error"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">
                Create pricing rules to apply discounts, markups, or flash sales.
              </p>
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus size={15} />}
                onClick={() => setShowRuleModal(true)}
              >
                Add Rule
              </Button>
            </div>

            {priceRules.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-12 text-center">
                <DollarSign size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-navy font-medium">No price rules</p>
                <p className="text-sm text-text-muted mt-1">Click &quot;Add Rule&quot; to create a pricing rule.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {priceRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`bg-white rounded-xl border p-5 flex items-center justify-between ${
                      rule.isActive ? 'border-border' : 'border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => togglePriceRule(rule.id)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${
                          rule.isActive ? 'bg-success' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            rule.isActive ? 'left-5' : 'left-0.5'
                          }`}
                        />
                      </button>
                      <div>
                        <p className="text-sm font-semibold text-navy">{rule.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant={rule.type === 'flash' ? 'warning' : 'info'}>
                            {rule.type}
                          </Badge>
                          <span className="text-xs text-text-secondary">
                            {rule.type === 'percentage'
                              ? `${rule.value}% off`
                              : rule.type === 'fixed'
                              ? `${formatCurrency(rule.value)} off`
                              : `Flash: ${formatCurrency(rule.value)}`}
                          </span>
                          {rule.startDate && (
                            <span className="text-xs text-text-muted">
                              {new Date(rule.startDate).toLocaleDateString()} -{' '}
                              {rule.endDate
                                ? new Date(rule.endDate).toLocaleDateString()
                                : 'Ongoing'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => deletePriceRule(rule.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Modal
              isOpen={showRuleModal}
              onClose={() => setShowRuleModal(false)}
              title="Add Price Rule"
            >
              <div className="space-y-4">
                <Input
                  label="Rule Name"
                  placeholder="e.g., Summer Sale"
                  value={newRuleDraft.name}
                  onChange={(e) =>
                    setNewRuleDraft((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                />
                <Select
                  label="Rule Type"
                  value={newRuleDraft.type}
                  onChange={(e) =>
                    setNewRuleDraft((p) => ({
                      ...p,
                      type: e.target.value as PriceRuleDraft['type'],
                    }))
                  }
                  options={[
                    { value: 'percentage', label: 'Percentage Off' },
                    { value: 'fixed', label: 'Fixed Amount Off' },
                    { value: 'flash', label: 'Flash Sale Price' },
                  ]}
                />
                <Input
                  label={
                    newRuleDraft.type === 'percentage'
                      ? 'Percentage Value'
                      : 'Amount Value'
                  }
                  type="number"
                  placeholder="0"
                  value={newRuleDraft.value || ''}
                  onChange={(e) =>
                    setNewRuleDraft((p) => ({
                      ...p,
                      value: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Start Date"
                    type="date"
                    value={newRuleDraft.startDate}
                    onChange={(e) =>
                      setNewRuleDraft((p) => ({ ...p, startDate: e.target.value }))
                    }
                  />
                  <Input
                    label="End Date"
                    type="date"
                    value={newRuleDraft.endDate}
                    onChange={(e) =>
                      setNewRuleDraft((p) => ({ ...p, endDate: e.target.value }))
                    }
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowRuleModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="gold"
                    size="sm"
                    icon={<Save size={15} />}
                    onClick={addPriceRule}
                    loading={saving}
                  >
                    Save Rule
                  </Button>
                </div>
              </div>
            </Modal>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-border p-8">
              <div className="max-w-lg mx-auto">
                <h3 className="text-lg font-bold text-navy mb-1">{product?.name}</h3>
                <p className="text-sm text-text-secondary mb-4 line-clamp-2">{product?.description}</p>

                <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                  <Package size={64} className="text-gray-300" />
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl font-bold text-navy">
                    {product ? formatCurrency(product.price) : ''}
                  </span>
                  {product?.compareAtPrice && (
                    <span className="text-sm text-text-muted line-through">
                      {formatCurrency(product.compareAtPrice)}
                    </span>
                  )}
                </div>

                {attributes.length > 0 && (
                  <div className="space-y-4">
                    {attributes.map((attr) => (
                      <div key={attr.id}>
                        <p className="text-sm font-medium text-navy mb-2">
                          {attr.name}: <span className="text-text-secondary font-normal">{previewSelectedAttr[attr.name] || 'Select'}</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {attr.values.map((val) => {
                            const isSelected = previewSelectedAttr[attr.name] === val.name;
                            return (
                              <button
                                key={val.name}
                                onClick={() =>
                                  setPreviewSelectedAttr((prev) => ({
                                    ...prev,
                                    [attr.name]: val.name,
                                  }))
                                }
                                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                                  isSelected
                                    ? 'border-gold bg-gold/10 text-navy'
                                    : 'border-border text-text-secondary hover:border-gray-400'
                                }`}
                              >
                                {attr.type === 'color' && val.hex && (
                                  <span
                                    className="inline-block w-4 h-4 rounded-full border border-gray-300 mr-1.5 -mt-0.5"
                                    style={{ backgroundColor: val.hex }}
                                  />
                                )}
                                {val.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <Button variant="gold" className="flex-1" icon={<Package size={16} />}>
                    Add to Cart
                  </Button>
                  <Button variant="secondary" icon={<Bell size={16} />}>
                    Notify
                  </Button>
                </div>

                {attributes.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-text-muted">
                      SKU: {variants.length > 0 ? variants[0].sku : product?.sku || 'N/A'} &middot;{' '}
                      {variants.length > 0 && variants[0].availability === 'in_stock'
                        ? 'In Stock'
                        : 'Out of Stock'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy mb-3">Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-navy">{attributes.length}</p>
                  <p className="text-xs text-text-secondary">Attributes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy">
                    {attributes.reduce((acc, a) => acc * Math.max(a.values.length, 1), 1)}
                  </p>
                  <p className="text-xs text-text-secondary">Combinations</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy">{variants.length}</p>
                  <p className="text-xs text-text-secondary">Generated</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy">
                    {variants.filter((v) => v.stock > 0).length}
                  </p>
                  <p className="text-xs text-text-secondary">In Stock</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
