"use client";
import { Plus, Save, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { RequirementSection, SectionField } from '../types';

const SectionEditorModal = ({
  isOpen,
  onClose,
  section,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  section: RequirementSection;
  onSubmit: (updatedSection: RequirementSection) => void;
}) => {
  const [fields, setFields] = useState<SectionField[]>(section.fields);

  useEffect(() => {
    setFields(section.fields);
  }, [section]);

  const handleFieldChange = (id: string, value: string | string[]) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, value } : f)));
  };

  const handleListChange = (id: string, idx: number, val: string) => {
    const field = fields.find((f) => f.id === id);
    if (field && Array.isArray(field.value)) {
      const newList = [...field.value];
      newList[idx] = val;
      handleFieldChange(id, newList);
    }
  };

  const addListItem = (id: string) => {
    const field = fields.find((f) => f.id === id);
    if (field && Array.isArray(field.value)) {
      handleFieldChange(id, [...field.value, '']);
    }
  };

  const removeListItem = (id: string, idx: number) => {
    const field = fields.find((f) => f.id === id);
    if (field && Array.isArray(field.value)) {
      const newList = [...field.value];
      newList.splice(idx, 1);
      handleFieldChange(id, newList);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-100 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 relative flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <h3 className="text-xl font-bold text-slate-800">
            Edit Section: <span className="text-blue-600">{section.title}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="grow overflow-y-auto space-y-5 px-1">
          {fields.map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {field.label}
              </label>

              {field.inputType === 'text' && (
                <input
                  type="text"
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={field.value as string}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                />
              )}

              {field.inputType === 'textarea' && (
                <textarea
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32"
                  value={field.value as string}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                />
              )}

              {field.inputType === 'list' && Array.isArray(field.value) && (
                <div className="space-y-2">
                  {field.value.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-slate-400 text-xs">{idx + 1}.</span>
                      <input
                        type="text"
                        className="grow p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={item}
                        onChange={(e) =>
                          handleListChange(field.id, idx, e.target.value)
                        }
                      />
                      <button
                        onClick={() => removeListItem(field.id, idx)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addListItem(field.id)}
                    className="text-sm text-blue-600 font-medium hover:underline flex items-center mt-2"
                  >
                    <Plus size={14} className="mr-1" /> Add Item
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit({ ...section, fields })}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center"
          >
            <Save size={16} className="mr-2" /> Save Section
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectionEditorModal;
