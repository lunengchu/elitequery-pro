
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Search, Plus, X, Filter, ChevronRight, Database, Calendar, Globe, Box, LayoutGrid, Sparkles, Send, Trash2, Check, RotateCcw, Ship, Anchor, MapPin, ArrowRight, ListFilter, SlidersHorizontal, Layers, Fingerprint } from 'lucide-react';
import { FIELD_GROUPS, ALL_FIELDS, MOCK_SHIPMENTS } from './constants';
import { FilterType, StringOperator, DateOperator, ActiveFilter, FieldDefinition, Shipment } from './types';
import { parseNaturalLanguageQuery } from './services/geminiService';

// --- Sub-components ---

const FieldLibraryItem: React.FC<{ field: FieldDefinition; onAdd: (f: FieldDefinition) => void }> = ({ field, onAdd }) => (
  <button
    onClick={() => onAdd(field)}
    className="group flex items-center justify-between w-full px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
  >
    <div className="flex items-center gap-2.5">
      <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
        {field.type === FilterType.DATE && <Calendar size={14} />}
        {field.type === FilterType.ENTITY && <Globe size={14} />}
        {field.type === FilterType.STRING && <Box size={14} />}
        {field.type === FilterType.NUMBER && <LayoutGrid size={14} />}
      </div>
      <span className="font-semibold">{field.label}</span>
    </div>
    <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
  </button>
);

const FilterRow: React.FC<{
  filter: ActiveFilter;
  field: FieldDefinition;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ActiveFilter>) => void;
}> = ({ filter, field, onRemove, onUpdate }) => {
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onUpdate(filter.id, { value: e.target.value });
  };

  const handleEntityToggle = (option: string) => {
    const currentValues = Array.isArray(filter.value) ? filter.value : [];
    const newValues = currentValues.includes(option)
      ? currentValues.filter(v => v !== option)
      : [...currentValues, option];
    onUpdate(filter.id, { value: newValues });
  };

  const selectedEntities = Array.isArray(filter.value) ? filter.value : [];

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-blue-300 transition-all">
      <div className="flex-1 min-w-[120px]">
        <div className="flex items-center gap-2 text-slate-800 font-bold">
           <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 border border-slate-100">
            {field.type === FilterType.DATE && <Calendar size={14} />}
            {field.type === FilterType.ENTITY && <Globe size={14} />}
            {field.type === FilterType.STRING && <Box size={14} />}
          </div>
          <span className="text-xs">{field.label}</span>
        </div>
      </div>

      <div className="w-full md:w-36">
        <select
          value={filter.operator}
          onChange={(e) => onUpdate(filter.id, { operator: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
        >
          {field.type === FilterType.STRING && (
            <>
              <option value={StringOperator.EQUALS}>Equal To</option>
              <option value={StringOperator.CONTAINS}>Contains</option>
              <option value={StringOperator.STARTS_WITH}>Starts With</option>
            </>
          )}
          {field.type === FilterType.DATE && (
            <>
              <option value={DateOperator.LAST_7_DAYS}>Last 7 Days</option>
              <option value={DateOperator.LAST_30_DAYS}>Last 30 Days</option>
              <option value={DateOperator.LAST_90_DAYS}>Last 90 Days</option>
              <option value={DateOperator.CUSTOM_RANGE}>Custom Range</option>
            </>
          )}
          {field.type === FilterType.ENTITY && <option value="IN">In List</option>}
          {field.type === FilterType.NUMBER && <option value="EQ">Equals</option>}
        </select>
      </div>

      <div className="flex-[2] w-full">
        {field.type === FilterType.STRING && (
          <input
            type="text"
            value={filter.value || ''}
            onChange={handleValueChange}
            placeholder="Search keywords..."
            className="w-full bg-white border border-slate-200 text-xs rounded-xl p-2 outline-none"
          />
        )}

        {field.type === FilterType.DATE && filter.operator === DateOperator.CUSTOM_RANGE && (
          <div className="flex gap-1">
            <input type="date" className="w-full bg-white border border-slate-200 text-[10px] rounded-lg p-1.5" onChange={(e) => onUpdate(filter.id, { value: { ...filter.value, start: e.target.value } })} />
            <input type="date" className="w-full bg-white border border-slate-200 text-[10px] rounded-lg p-1.5" onChange={(e) => onUpdate(filter.id, { value: { ...filter.value, end: e.target.value } })} />
          </div>
        )}

        {field.type === FilterType.ENTITY && (
          <div className="flex flex-wrap gap-1 p-1.5 bg-slate-50 rounded-xl border border-slate-200 max-h-20 overflow-y-auto">
            {field.options?.map(opt => (
              <button
                key={opt}
                onClick={() => handleEntityToggle(opt)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                  selectedEntities.includes(opt)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => onRemove(filter.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
        <X size={16} />
      </button>
    </div>
  );
};

// --- Main Application ---

const App: React.FC = () => {
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [shipments, setShipments] = useState<Shipment[]>(MOCK_SHIPMENTS);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const defaultFilters: ActiveFilter[] = [
      { id: 'def-1', fieldId: 'origin_port', operator: 'IN', value: ['Ningbo-Zhoushan'] },
      { id: 'def-2', fieldId: 'etd', operator: DateOperator.LAST_7_DAYS, value: '' }
    ];
    setActiveFilters(defaultFilters);
    applyFilters(defaultFilters);
  }, []);

  const addFilter = (field: FieldDefinition) => {
    const newFilter: ActiveFilter = {
      id: Math.random().toString(36).substr(2, 9),
      fieldId: field.id,
      operator: field.type === FilterType.DATE ? DateOperator.LAST_30_DAYS : 
                field.type === FilterType.STRING ? StringOperator.CONTAINS : 'IN',
      value: field.type === FilterType.ENTITY ? [] : ''
    };
    setActiveFilters(prev => [...prev, newFilter]);
  };

  const removeFilter = (id: string) => {
    const nextFilters = activeFilters.filter(f => f.id !== id);
    setActiveFilters(nextFilters);
    applyFilters(nextFilters);
  };
  
  const updateFilter = (id: string, updates: Partial<ActiveFilter>) => setActiveFilters(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));

  const applyFilters = (filtersToApply: ActiveFilter[]) => {
    let filtered = [...MOCK_SHIPMENTS];
    filtersToApply.forEach(f => {
      const field = ALL_FIELDS.find(af => af.id === f.fieldId);
      if (!field) return;
      if (field.id === 'origin_port' && Array.isArray(f.value) && f.value.length > 0) {
        filtered = filtered.filter(s => f.value.includes(s.origin));
      }
      if (field.id === 'etd') {
        const getDaysAgo = (days: number) => {
          const d = new Date();
          d.setDate(d.getDate() - days);
          return d;
        };
        if (f.operator === DateOperator.LAST_7_DAYS) filtered = filtered.filter(s => new Date(s.etd) >= getDaysAgo(7));
        else if (f.operator === DateOperator.LAST_30_DAYS) filtered = filtered.filter(s => new Date(s.etd) >= getDaysAgo(30));
      }
      if (field.type === FilterType.STRING && f.value) {
        const val = f.value.toLowerCase();
        if (f.fieldId === 'vessel_name') filtered = filtered.filter(s => s.vessel.toLowerCase().includes(val));
        if (f.fieldId === 'shipper') filtered = filtered.filter(s => s.shipper.toLowerCase().includes(val));
      }
    });
    setShipments(filtered);
    setShowQueryBuilder(false);
  };

  const handleAiSearch = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    const parsed = await parseNaturalLanguageQuery(aiPrompt);
    if (parsed && Array.isArray(parsed)) {
      const newFilters = parsed.map((p: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        fieldId: p.fieldId,
        operator: p.operator,
        value: p.value
      }));
      setActiveFilters(newFilters);
      applyFilters(newFilters);
    }
    setIsAiLoading(false);
    setAiPrompt('');
  };

  const filteredGroups = useMemo(() => {
    if (!sidebarSearch) return FIELD_GROUPS;
    return FIELD_GROUPS.map(group => ({
      ...group,
      fields: group.fields.filter(f => f.label.toLowerCase().includes(sidebarSearch.toLowerCase()))
    })).filter(g => g.fields.length > 0);
  }, [sidebarSearch]);

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">
      
      {/* Main Dashboard Layout */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
        
        {/* Top Navigation */}
        <header className="bg-white h-24 border-b border-slate-200 flex items-center px-10 gap-6 shadow-sm z-20">
          <div className="flex items-center gap-3 pr-8 border-r border-slate-100">
            <div className="bg-blue-600 p-2 rounded-2xl shadow-lg">
              <Ship className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800">ShipTrack Pro</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Console</p>
            </div>
          </div>

          <div className="flex-1 relative group max-w-2xl">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Sparkles size={16} className="text-purple-600" />
              <span className="text-[10px] font-black text-slate-400 border-r border-slate-200 pr-3 mr-1 uppercase tracking-widest">AI Search</span>
            </div>
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
              placeholder="e.g. 'Last 7 days from Ningbo'"
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-full py-3.5 pl-32 pr-12 text-sm font-medium focus:bg-white focus:border-purple-500 transition-all outline-none"
            />
            <button onClick={handleAiSearch} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-slate-400 hover:text-purple-600">
               {isAiLoading ? <RotateCcw className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </div>

          <div className="flex-1" />

          <button 
            onClick={() => setShowQueryBuilder(true)}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:translate-y-0"
          >
            <SlidersHorizontal size={18} />
            Query Options
          </button>
        </header>

        {/* ACTIVE FILTER SUMMARY (TOP POSITION) */}
        <section className="bg-white border-b border-slate-200/60 px-10 py-4 flex items-center gap-4 shadow-sm z-10 overflow-x-auto scrollbar-hide">
          <div className="flex-shrink-0 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">
            <Filter size={14} className="text-blue-500" />
            Active Filters:
          </div>
          
          <div className="flex items-center gap-2 flex-nowrap overflow-x-auto scrollbar-hide">
             {activeFilters.length === 0 ? (
               <span className="text-xs font-bold text-slate-300 italic px-2">No criteria selected</span>
             ) : (
               activeFilters.map(f => (
                <div key={f.id} className="flex-shrink-0 flex items-center gap-2 bg-blue-50/50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-100 group transition-all hover:bg-blue-50 animate-in fade-in slide-in-from-left-2 duration-300">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">
                    {ALL_FIELDS.find(af => af.id === f.fieldId)?.label}:
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {Array.isArray(f.value) 
                      ? (f.value.length > 2 ? `${f.value.slice(0, 2).join(', ')} +${f.value.length - 2}` : f.value.join(', ')) 
                      : f.value || f.operator.replace(/_/g, ' ').toLowerCase()}
                  </span>
                  <button onClick={() => removeFilter(f.id)} className="text-blue-300 hover:text-red-500 transition-colors ml-1">
                    <X size={12} />
                  </button>
                </div>
              ))
             )}
          </div>
          
          {activeFilters.length > 0 && (
             <button 
               onClick={() => { setActiveFilters([]); setShipments(MOCK_SHIPMENTS); }} 
               className="ml-auto text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest whitespace-nowrap transition-colors"
             >
               Clear Workspace
             </button>
          )}
        </section>

        {/* Dashboard Content */}
        <div className="flex-1 p-10 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Active Shipments</h2>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest border border-slate-200 rounded-xl px-3 py-1.5 bg-white">
              <Anchor size={12} /> Live Tracking
            </div>
          </div>

          {/* Shipment Table */}
          <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-2xl shadow-slate-200/50 mb-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID / Shipper</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vessel</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Route</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timelines</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shipments.map((s) => (
                  <tr key={s.id} className="group hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-slate-800">{s.id}</span>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{s.shipper}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-xl text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                          <Ship size={18} />
                        </div>
                        <p className="text-sm font-bold text-slate-700">{s.vessel}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3 text-slate-600">
                        <span className="text-xs font-bold text-slate-700">{s.origin}</span>
                        <ArrowRight size={14} className="text-slate-300" />
                        <span className="text-xs font-bold text-slate-700">{s.destination}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1 text-[11px] font-bold">
                        <span className="text-blue-500">ETD: {s.etd}</span>
                        <span className="text-slate-400 opacity-60">ETA: {s.eta}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        s.status === 'In Transit' ? 'bg-blue-100 text-blue-700' :
                        s.status === 'Arrived' ? 'bg-green-100 text-green-700' :
                        s.status === 'Delayed' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 hover:bg-white hover:shadow-lg rounded-xl transition-all">
                        <ChevronRight size={18} className="text-slate-300" />
                      </button>
                    </td>
                  </tr>
                ))}
                {shipments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                       <div className="flex flex-col items-center">
                         <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200">
                           <Database size={32} />
                         </div>
                         <h3 className="text-lg font-bold text-slate-700">No matching shipments</h3>
                         <p className="text-slate-400 text-sm mt-1">Adjust your filters above or use the query editor.</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM STATUS & RESULTS COUNTER */}
        <section className="bg-white border-t border-slate-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-20">
           {/* Results Bar */}
           <div className="px-10 py-4 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-100 flex items-center justify-center">
                    <ListFilter size={16} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Search Result</h4>
                    <p className="text-lg font-black text-slate-800 leading-none">
                      {shipments.length} <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase tracking-tight">Units Matched</span>
                    </p>
                  </div>
                </div>
                
                <div className="h-8 w-[1px] bg-slate-100" />
                
                <div className="flex items-center gap-4 text-green-600 font-black text-[10px] uppercase tracking-widest">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                   System Status: Optimal
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                  <Fingerprint size={12} /> Access Level: Admin
                </div>
                <div className="text-[10px] text-slate-300 font-bold">
                  PRO v2.5.1
                </div>
              </div>
           </div>
        </section>
      </main>

      {/* ADVANCED QUERY BUILDER MODAL */}
      {showQueryBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xl" onClick={() => setShowQueryBuilder(false)} />
          
          <div className="relative w-full max-w-6xl h-[85vh] bg-white rounded-[40px] shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Modal Left Sidebar: Field Library */}
            <div className="w-80 border-r border-slate-100 bg-slate-50/50 flex flex-col">
              <div className="p-8 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-600 p-2 rounded-xl">
                    <Layers className="text-white" size={20} />
                  </div>
                  <h3 className="text-lg font-black tracking-tight text-slate-800">Field Catalog</h3>
                </div>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Find field..."
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    value={sidebarSearch}
                    onChange={(e) => setSidebarSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                {filteredGroups.map(group => (
                  <div key={group.name}>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2 flex justify-between">
                      {group.name}
                      <span className="bg-slate-200 text-slate-500 rounded-md px-1.5 py-0.5">{group.fields.length}</span>
                    </h4>
                    <div className="space-y-0.5">
                      {group.fields.map(field => (
                        <FieldLibraryItem key={field.id} field={field} onAdd={addFilter} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Main Area: Condition Builder */}
            <div className="flex-1 flex flex-col bg-white">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-800">Condition Workspace</h2>
                  <p className="text-slate-400 text-[10px] font-black mt-1 uppercase tracking-widest">Active Layers: {activeFilters.length}</p>
                </div>
                <button onClick={() => setShowQueryBuilder(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all group">
                  <X size={20} className="text-slate-400 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-slate-50/20">
                {activeFilters.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-10">
                    <div className="w-24 h-24 bg-slate-100 rounded-[32px] flex items-center justify-center mb-6">
                      <SlidersHorizontal size={40} className="text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700">Empty Logic Chain</h3>
                    <p className="text-sm font-bold text-slate-400 mt-2">Select parameters from the sidebar to define your search boundary.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 animate-in slide-in-from-bottom-2 duration-300">
                    {activeFilters.map(filter => (
                      <FilterRow
                        key={filter.id}
                        filter={filter}
                        field={ALL_FIELDS.find(f => f.id === filter.fieldId)!}
                        onRemove={removeFilter}
                        onUpdate={updateFilter}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-slate-100 flex justify-between items-center bg-white">
                <button 
                  onClick={() => setActiveFilters([])} 
                  className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                  <Trash2 size={14} /> Purge Conditions
                </button>
                <div className="flex gap-4">
                  <button onClick={() => setShowQueryBuilder(false)} className="px-8 py-3.5 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Discard</button>
                  <button 
                    onClick={() => applyFilters(activeFilters)}
                    className="px-12 py-3.5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:translate-y-0"
                  >
                    Commit Query
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default App;
