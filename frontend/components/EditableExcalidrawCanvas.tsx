'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface EditableExcalidrawCanvasProps {
  initialData?: Record<string, unknown>;
  onSave?: (data: Record<string, unknown>) => Promise<void>;
  isSaving?: boolean;
}

const ExcalidrawComponent = dynamic(
  () =>
    import('@excalidraw/excalidraw').then((mod) => ({
      default: mod.Excalidraw,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-slate-100">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
          <span className="text-gray-600 text-sm">กำลังโหลด Excalidraw...</span>
        </div>
      </div>
    ),
  }
);

export default function EditableExcalidrawCanvas({
  initialData,
  onSave,
  isSaving = false,
}: EditableExcalidrawCanvasProps) {
  const currentData = (initialData as Record<string, unknown>) || {
    type: 'excalidraw',
    version: 2,
    source: 'editable-canvas',
    elements: [],
    appState: {
      viewBackgroundColor: '#ffffff',
      zoom: { value: 1 },
    },
    files: {},
  };

  const [hasChanges, setHasChanges] = useState(false);
  const excalidrawAPIRef = useRef<Record<string, unknown> | null>(null);
  const isInitialMount = useRef(true);

  // Track if this is initial mount to prevent update loops
  useEffect(() => {
    isInitialMount.current = false;
  }, []);

  const handleSave = async () => {
    if (!onSave) {
      toast.info('ไม่ได้กำหนด callback สำหรับบันทึก');
      return;
    }

    try {
      // Get current scene data from Excalidraw API instead of state
      let sceneData = currentData;
      if (excalidrawAPIRef.current) {
        const api = excalidrawAPIRef.current as Record<string, unknown>;
        const elements = typeof api.getSceneElements === 'function' ? api.getSceneElements() : [];
        const appState = typeof api.getAppState === 'function' ? api.getAppState() : {};
        sceneData = {
          type: 'excalidraw',
          version: 2,
          source: 'editable-canvas',
          elements: Array.isArray(elements) ? elements : [],
          appState: typeof appState === 'object' && appState !== null ? appState : {},
          files: {},
        };
      }

      await onSave(sceneData);
      setHasChanges(false);
      const elementCount = Array.isArray(sceneData.elements) ? sceneData.elements.length : 0;
      toast.success('บันทึกแผนภาพสำเร็จ', {
        description: `บันทึก ${elementCount} องค์ประกอบแล้ว`,
      });
    } catch (error) {
      toast.error('บันทึกแผนภาพล้มเหลว', {
        description: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
      });
    }
  };

  return (
    <div className="mt-6">
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-linear-to-r from-purple-50 to-pink-50 px-4 py-3 border-b border-gray-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">
                🎨 Excalidraw Editor
              </h3>
              <p className="text-gray-600 text-xs mt-1">
                แก้ไข เพิ่ม ลบ องค์ประกอบได้อย่างอิสระ
              </p>
              {hasChanges && (
                <div className="flex items-center gap-2 mt-2 text-amber-600 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  มีการเปลี่ยนแปลงที่ยังไม่บันทึก
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {Array.isArray((currentData as Record<string, unknown>).elements)
                    ? ((currentData as Record<string, unknown>).elements as Array<unknown>).length
                    : 0}{' '}
                  องค์ประกอบ
                </p>
              </div>
              {onSave && (
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className={`px-3 py-2 rounded flex items-center gap-2 text-sm font-medium transition-all ${
                    hasChanges && !isSaving
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'บันทึกไปยัง DB...' : 'บันทึก'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Canvas Container */}
        <div
          className="relative bg-white w-full overflow-hidden"
          style={{ height: '700px' }}
        >
          <ExcalidrawComponent
            initialData={currentData as Record<string, unknown>}
            excalidrawAPI={(api: unknown) => {
              excalidrawAPIRef.current = api as Record<string, unknown>;
            }}
            onChange={() => {
              // Mark as changed but don't update state to prevent infinite loop
              if (!isInitialMount.current && !hasChanges) {
                setHasChanges(true);
              }
            }}
            viewModeEnabled={false}
            zenModeEnabled={false}
            gridModeEnabled={false}
          />
        </div>

        {/* Footer with instructions */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-300">
          <p className="text-gray-600 text-xs">
            💡 Tip: ใช้เครื่องมือด้านเบื้องบนเพื่อวาด แก้ไข หรือเพิ่มข้อความ • Ctrl+Z เพื่อ Undo
          </p>
        </div>
      </div>
    </div>
  );
}
