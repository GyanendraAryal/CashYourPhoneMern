import React, { useState, useEffect } from "react";
import Shell from "../components/Shell";
import api from "../lib/api";
import { Save, RefreshCw, Cpu, Activity, Sliders, CheckCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function PricingPage() {
  const [config, setConfig] = useState({
    weights: {
      new: 1.0,
      like_new: 0.9,
      refurbished: 0.8,
      pre_owned: 0.7,
    },
    useML: true,
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
      const { data } = await api.get("/api/v1/pricing/config");
      if (data?.data) {
        setConfig({
          weights: data.data.weights,
          useML: data.data.useML ?? true,
        });
      }
    } catch (e) {
      toast.error("Failed to load pricing config");
    } finally {
      setLoading(false);
    }
  }

  async function checkMLStatus() {
    try {
      const { data } = await api.get("/api/health"); // backend proxies to ML health
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

  return (
    <Shell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Pricing Engine</h1>
          <p className="text-text-muted mt-1">Configure global depreciation weights and ML intelligence.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary-blue-active text-white px-6 py-2.5 rounded-xl font-bold shadow-soft hover:bg-black transition-all disabled:opacity-50"
        >
          {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
          Save Configuration
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ML Status Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-border-muted rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Cpu size={20} className="text-purple-500" /> ML Intelligence
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-surface-white-subtle rounded-xl border border-border-muted">
                <span className="text-sm font-medium">Service Status</span>
                <span className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest ${mlStatus === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                  <div className={`w-2 h-2 rounded-full ${mlStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  {mlStatus}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-surface-white-subtle rounded-xl border border-border-muted">
                <span className="text-sm font-medium">Auto-Estimate</span>
                <button 
                  onClick={() => setConfig(p => ({ ...p, useML: !p.useML }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.useML ? 'bg-green-500' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.useML ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
            <p className="text-[11px] text-text-muted mt-4 italic">
              When enabled, the system uses the Regression model from the Python microservice. If offline, it falls back to weights above.
            </p>
          </div>
        </div>

        {/* Global Weights Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-border-muted rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Sliders size={20} className="text-blue-500" /> Depreciation Weights
            </h3>
            
            <div className="space-y-6">
              {Object.entries(config.weights).map(([key, val]) => (
                <div key={key} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-white-subtle/50 border border-border-muted hover:border-blue-200 transition-colors">
                  <div className="capitalize font-bold text-text-primary">
                    {key.replace("_", " ")}
                    <p className="text-xs font-normal text-text-muted mt-0.5">Multiplier for base price evaluation</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range"
                      min="0.1"
                      max="1.5"
                      step="0.01"
                      value={val}
                      onChange={(e) => handleWeightChange(key, e.target.value)}
                      className="w-32 md:w-48 accent-primary-blue-active"
                    />
                    <div className="w-16 px-3 py-1.5 bg-white border border-border-muted rounded-lg text-center font-black text-sm">
                      {val.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
