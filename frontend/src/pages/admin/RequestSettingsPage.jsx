import React, { useState } from 'react';
import { 
  Settings, Plus, Edit2, Trash2, Save, X, AlertCircle,
  Briefcase, BookOpen, Library, CreditCard, Bus, Home, Laptop, Wrench, FileText
} from 'lucide-react';
import { useRequestCategories } from '../../hooks/useRequestCategories';

const ICONS = ['BookOpen', 'Briefcase', 'Library', 'CreditCard', 'Bus', 'Home', 'Laptop', 'Wrench', 'FileText'];

const getIconComponent = (iconName) => {
  const icons = { BookOpen, Briefcase, Library, CreditCard, Bus, Home, Laptop, Wrench, FileText };
  const Icon = icons[iconName] || FileText;
  return <Icon className="w-5 h-5" />;
};

const RequestSettingsPage = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useRequestCategories();
  
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    subcategories: '',
    defaultWorkflow: 'Faculty, HOD',
    slaDays: 3,
    icon: 'FileText'
  });

  const handleEditClick = (cat) => {
    setEditingId(cat.id);
    setEditForm({
      ...cat,
      subcategories: cat.subcategories.join(', '),
      defaultWorkflow: cat.defaultWorkflow.join(', ')
    });
  };

  const handleSaveEdit = () => {
    if (!editForm.name.trim()) return;
    updateCategory(editingId, {
      name: editForm.name,
      subcategories: editForm.subcategories.split(',').map(s => s.trim()).filter(Boolean),
      defaultWorkflow: editForm.defaultWorkflow.split(',').map(s => s.trim()).filter(Boolean),
      slaDays: parseInt(editForm.slaDays, 10) || 1,
      icon: editForm.icon
    });
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveNew = () => {
    if (!addForm.name.trim()) return;
    addCategory({
      name: addForm.name,
      subcategories: addForm.subcategories.split(',').map(s => s.trim()).filter(Boolean),
      defaultWorkflow: addForm.defaultWorkflow.split(',').map(s => s.trim()).filter(Boolean),
      slaDays: parseInt(addForm.slaDays, 10) || 1,
      icon: addForm.icon
    });
    setIsAdding(false);
    setAddForm({ name: '', subcategories: '', defaultWorkflow: 'Faculty, HOD', slaDays: 3, icon: 'FileText' });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            Request Module Settings
          </h1>
          <p className="text-neutral-500">Configure request categories, SLA days, and approval workflows.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-5 h-5" /> Add Category
        </button>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-neutral-900 border border-blue-200 dark:border-blue-900/50 p-6 rounded-2xl shadow-sm mb-6">
          <h3 className="text-lg font-bold mb-4">Create New Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category Name</label>
              <input type="text" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950" placeholder="e.g. IT Support" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Icon</label>
              <select value={addForm.icon} onChange={e => setAddForm({...addForm, icon: e.target.value})} className="w-full p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950">
                {ICONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Subcategories (comma separated)</label>
              <input type="text" value={addForm.subcategories} onChange={e => setAddForm({...addForm, subcategories: e.target.value})} className="w-full p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950" placeholder="e.g. Wi-Fi Issue, Portal Login Problem" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Workflow Steps (comma separated)</label>
              <input type="text" value={addForm.defaultWorkflow} onChange={e => setAddForm({...addForm, defaultWorkflow: e.target.value})} className="w-full p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950" placeholder="e.g. IT Admin, HOD" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SLA Limit (Days)</label>
              <input type="number" min="1" value={addForm.slaDays} onChange={e => setAddForm({...addForm, slaDays: e.target.value})} className="w-full p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">Cancel</button>
            <button onClick={handleSaveNew} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"><Save className="w-4 h-4"/> Save Category</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm">
            {editingId === cat.id ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                  <h3 className="font-bold text-lg">Edit Category: {cat.id}</h3>
                  <button onClick={() => setEditingId(null)} className="text-neutral-400 hover:text-red-500"><X className="w-5 h-5"/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category Name</label>
                    <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Icon</label>
                    <select value={editForm.icon} onChange={e => setEditForm({...editForm, icon: e.target.value})} className="w-full p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950">
                      {ICONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Subcategories (comma separated)</label>
                    <input type="text" value={editForm.subcategories} onChange={e => setEditForm({...editForm, subcategories: e.target.value})} className="w-full p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Workflow Steps (comma separated)</label>
                    <input type="text" value={editForm.defaultWorkflow} onChange={e => setEditForm({...editForm, defaultWorkflow: e.target.value})} className="w-full p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">SLA Limit (Days)</label>
                    <input type="number" min="1" value={editForm.slaDays} onChange={e => setEditForm({...editForm, slaDays: e.target.value})} className="w-full p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button onClick={handleSaveEdit} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"><Save className="w-4 h-4"/> Save Changes</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                    {getIconComponent(cat.icon)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
                      {cat.name}
                      <span className="text-xs px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-md font-mono">{cat.id}</span>
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1 line-clamp-1">{cat.subcategories.join(' • ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col text-sm">
                    <span className="text-neutral-500">Workflow</span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-200">{cat.defaultWorkflow.join(' → ')}</span>
                  </div>
                  <div className="flex flex-col text-sm">
                    <span className="text-neutral-500">SLA</span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-200">{cat.slaDays} Days</span>
                  </div>
                  <div className="flex items-center gap-2 border-l border-neutral-200 dark:border-neutral-800 pl-6 ml-2">
                    <button onClick={() => handleEditClick(cat)} className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit2 className="w-4 h-4"/></button>
                    <button onClick={() => { if(window.confirm('Are you sure you want to delete this category?')) deleteCategory(cat.id); }} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequestSettingsPage;
