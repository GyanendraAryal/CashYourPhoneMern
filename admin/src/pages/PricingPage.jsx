import React, { useState, useEffect } from "react";
import Shell from "../components/Shell";
import api from "../lib/api";
import { Save, RefreshCw, Cpu, Sliders, Info, Percent, Calculator } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { formatNPR } from "../lib/utils/currency";

export default function PricingPage() {
  const [config, setConfig] = useState({
    weights: {
      brand_new: 1.0,
      like_new: 0.9,
      good: 0.8,
      fair: 0.7,
      broken: 0.4,
    },
    useML: true,
    margin: 0.1,
  });
  const [mlStatus, setMlStatus] = useState("checking");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
    checkMLStatus();
  }, []);

  async function loadConfig() {
    try {
      const { data } = await api.get("/api/admin/pricing/config");
      if (data?.data) {
        setConfig(data.data);
      }
    } catch (e) {
      toast.error("Failed to load pricing config");
    } finally {
      setLoading(false);
    }
  }

  async function checkMLStatus() {
    try {
      const { data } = await api.get("/api/health");
      setMlStatus(data.ml_service === "ok" ? "online" : "offline");
    } catch (e) {
      setMlStatus("offline");
    }
  }

  const handleWeightChange = (key, val) => {
    setConfig(prev => ({
      ...prev,
      weights: { ...prev.weights, [key]: parseFloat(val) }
    }));
  };

  const handleMarginChange = (val) => {
    setConfig(prev => ({ ...prev, margin: parseFloat(val) }));
  };

  async function handleSave() {
    setSaving(true);
    try {
      await api.patch("/api/admin/pricing/config", config);
      toast.success("Pricing configuration updated successfully");
    } catch (e) {
      toast.error("Failed to update config");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-12 text-center text-text-muted">Loading Engine Config...</div>;

  return (
    <Shell>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Pricing Engine</h1>
          <p className="text-text-muted mt-1">Configure global depreciation weights and business margins (NPR).</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-primary-blue-active text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-black transition-all disabled:opacity-50"
        >
          {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
          Save Configuration
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Logic Explanation */}
        <div className="lg:col-span-12">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6"
          >
            <div className="p-4 bg-white rounded-2xl text-blue-600 shadow-sm">
              <Calculator size={32} />
            </div>
            <div>
              <h3 className="font-bold text-blue-900">How the math works</h3>
              <p className="text-sm text-blue-800/80 mt-1">
                Final Buy Price = (Device MSRP × Condition Weight) × (1 - Business Margin)
              </p>
              <div className="flex flex-wrap gap-4 mt-3">
                 <div className="text-[10px] bg-blue-100 px-2 py-1 rounded-full font-bold uppercase tracking-wider text-blue-700">Example</div>
                 <p className="text-[11px] text-blue-700 italic">Example: (100,000 MSRP × 0.8 Good) × (1 - 0.1 Margin) = NPR 72,000</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Global Weights Panel */}
        <div className="lg:col-span-8">
          <div className="bg-white border border-border-muted rounded-3xl p-8 shadow-sm h-full">
            <h3 className="font-bold text-xl mb-8 flex items-center gap-3 text-text-primary">
              <Sliders size={24} className="text-blue-500" /> Depreciation Weights
            </h3>
            
            <div className="grid grid-cols-1 gap-6">
              {Object.entries(config.weights).map(([key, val]) => (
                <div key={key} className="group relative bg-surface-white-subtle/40 border border-border-muted rounded-2xl p-6 hover:border-blue-300 hover:bg-white transition-all duration-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="capitalize font-black text-text-primary text-lg">{key.replace("_", " ")}</span>
                        {key === 'brand_new' && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-black uppercase">Max Value</span>}
                      </div>
                      <p className="text-xs text-text-muted">Multiplier for base MSRP when device is in {key.replace("_", " ")} condition.</p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <input 
                        type="range"
                        min="0.1"
                        max="1.1"
                        step="0.01"
                        value={val}
                        onChange={(e) => handleWeightChange(key, e.target.value)}
                        className="w-48 accent-blue-600 cursor-pointer"
                      />
                      <div className="w-20 px-4 py-2 bg-text-primary text-white rounded-xl text-center font-black text-base shadow-sm">
                        {val.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Intelligence & Margin */}
        <div className="lg:col-span-4 space-y-8">
          {/* Business Margin */}
          <div className="bg-white border border-border-muted rounded-3xl p-8 shadow-sm border-t-4 border-t-orange-400">
            <h3 className="font-bold text-xl mb-6 flex items-center gap-3 text-text-primary">
              <Percent size={24} className="text-orange-500" /> Business Margin
            </h3>
            <div className="space-y-6">
              <p className="text-xs text-text-muted italic">The percentage deducted from calculated value for logistics, refurbishing, and profit.</p>
              <div className="flex flex-col gap-4">
                <input 
                  type="range"
                  min="0.0"
                  max="0.4"
                  step="0.01"
                  value={config.margin}
                  onChange={(e) => handleMarginChange(e.target.value)}
                  className="w-full accent-orange-500"
                />
                <div className="flex items-center justify-between">
                   <span className="text-sm font-bold text-text-muted">Current Margin:</span>
                   <span className="text-3xl font-black text-orange-600">{(config.margin * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* ML Intelligence Card */}
          <div className="bg-white border border-border-muted rounded-3xl p-8 shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Cpu size={120} />
            </div>
            <h3 className="font-bold text-xl mb-6 flex items-center gap-3 text-text-primary">
              <Cpu size={24} className="text-purple-500" /> ML Intelligence
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface-white-subtle/50 rounded-2xl border border-border-muted shadow-sm">
                <span className="text-sm font-bold">Service Status</span>
                <span className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${mlStatus === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${mlStatus === 'online' ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                  {mlStatus}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-surface-white-subtle/50 rounded-2xl border border-border-muted shadow-sm">
                <div className="space-y-1">
                  <span className="text-sm font-bold block">Auto-Estimate</span>
                  <span className="text-[10px] text-text-muted uppercase font-black">AI Powered Prediction</span>
                </div>
                <button 
                  onClick={() => setConfig(p => ({ ...p, useML: !p.useML }))}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none ${config.useML ? 'bg-purple-500 shadow-md' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${config.useML ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex gap-3">
                 <Info size={16} className="text-purple-500 shrink-0 mt-0.5" />
                 <p className="text-[11px] text-purple-900/70 leading-relaxed font-medium">
                   When enabled, the system uses custom Regression models to predict prices based on historical data. Rule-based weights are used as a fallback if the service is offline or low-confidence.
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
