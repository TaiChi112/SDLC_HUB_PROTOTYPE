"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
    Sparkles, Send, Loader2, FileText, Bot, User,
    Database, Settings, ChevronRight,
    Copy, Check, Code, LayoutTemplate, Trash2, Edit3, Save, X, AlertCircle, Lock, Layers, LogOut
} from 'lucide-react';
import LoginModal from '@/components/LoginModal';
import ProcessDiagramViewer from '@/components/ProcessDiagramViewer';
import EditableExcalidrawCanvas from '@/components/EditableExcalidrawCanvas';
import {
    computeSpecHash,
    getButtonLabel,
    getDiagramModeLabel,
    getQuotaTone,
    type DiagramState,
} from '@/utils/diagramHelpers';
import Image from 'next/image';

// --- โครงสร้างข้อมูล (Types) ---
interface SpecData {
    project_name: string;
    problem_statement: string;
    solution_overview: string;
    functional_requirements: string[];
    non_functional_requirements: string[];
    tech_stack_recommendation: string[];
    status: string;
    processDescription?: string;
    visualizationProcess?: Record<string, unknown>;
}

interface SavedSpec {
    id: string; // ในที่นี้ API ส่ง filename มาเป็น ID
    filename: string;
    project_name: string;
    created_at: string;
    status: string;
    isPublished: boolean;
    content: SpecData;
}

interface ApiErrorPayload {
    error?: string;
    code?: string;
}

const VIRTUALIZE_THRESHOLD = 100;
const VIRTUAL_ITEM_HEIGHT = 128;
const VIRTUAL_OVERSCAN = 4;
const VISUALIZATION_STEPS = [
    '[1/5] Sending to Gemini',
    '[2/5] Connecting to @scofieldfree/excalidraw-mcp...',
    '[3/5] start_session...',
    '[4/5] add_elements',
    '[5/5] get_scene...',
] as const;
const VISUALIZATION_MIN_DURATION_MS = 5200;

function hasVisualizationData(spec: SavedSpec): boolean {
    if (!spec.content.visualizationProcess || typeof spec.content.visualizationProcess !== 'object') {
        return false;
    }
    const rawElements = (spec.content.visualizationProcess as Record<string, unknown>).elements;
    return Array.isArray(rawElements) && rawElements.length > 0;
}

function getVisualizationElementCount(spec: SavedSpec): number {
    if (!spec.content.visualizationProcess || typeof spec.content.visualizationProcess !== 'object') {
        return 0;
    }
    const rawElements = (spec.content.visualizationProcess as Record<string, unknown>).elements;
    return Array.isArray(rawElements) ? rawElements.length : 0;
}

function resolveProgressStepFromMessage(message: string): number | null {
    const normalized = message.toLowerCase();
    if (normalized.includes('sending to gemini') || normalized.includes('gemini')) return 0;
    if (normalized.includes('connecting') || normalized.includes('excalidraw-mcp')) return 1;
    if (normalized.includes('start_session') || normalized.includes('start session')) return 2;
    if (normalized.includes('add_elements') || normalized.includes('add elements')) return 3;
    if (normalized.includes('get_scene') || normalized.includes('get scene')) return 4;
    return null;
}

function formatTimestamp(ms: number): string {
    const date = new Date(ms);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function isRenderableExcalidrawDiagram(diagram: Record<string, unknown> | null): boolean {
    if (!diagram || typeof diagram !== 'object') {
        return false;
    }
    const rawElements = diagram.elements;
    const type = diagram.type;
    return Array.isArray(rawElements) && rawElements.length > 0 && type === 'excalidraw';
}

function buildMockExcalidrawMcp(projectName: string): Record<string, unknown> {
    const now = Date.now();
    return {
        type: 'excalidraw',
        version: 2,
        source: 'mock-mcp-fallback',
        appState: {
            viewBackgroundColor: '#ffffff',
            gridSize: null,
        },
        elements: [
            {
                id: 'step-1',
                type: 'rectangle',
                x: 80,
                y: 120,
                width: 240,
                height: 64,
                angle: 0,
                strokeColor: '#1e293b',
                backgroundColor: '#dbeafe',
                fillStyle: 'solid',
                strokeWidth: 2,
                roughness: 0,
                opacity: 100,
                seed: 1,
                version: 1,
                versionNonce: 1,
                isDeleted: false,
                boundElements: [],
                updated: now,
                link: null,
                locked: false,
                text: `Input Idea\n${projectName}`,
            },
            {
                id: 'step-2',
                type: 'rectangle',
                x: 430,
                y: 120,
                width: 240,
                height: 64,
                angle: 0,
                strokeColor: '#1e293b',
                backgroundColor: '#e0e7ff',
                fillStyle: 'solid',
                strokeWidth: 2,
                roughness: 0,
                opacity: 100,
                seed: 2,
                version: 1,
                versionNonce: 2,
                isDeleted: false,
                boundElements: [],
                updated: now,
                link: null,
                locked: false,
                text: 'MCP Pipeline\nNormalize + Enrich',
            },
            {
                id: 'step-3',
                type: 'rectangle',
                x: 780,
                y: 120,
                width: 260,
                height: 64,
                angle: 0,
                strokeColor: '#1e293b',
                backgroundColor: '#dcfce7',
                fillStyle: 'solid',
                strokeWidth: 2,
                roughness: 0,
                opacity: 100,
                seed: 3,
                version: 1,
                versionNonce: 3,
                isDeleted: false,
                boundElements: [],
                updated: now,
                link: null,
                locked: false,
                text: 'Visualization Output\nProcess System View',
            },
            {
                id: 'arrow-1',
                type: 'arrow',
                x: 330,
                y: 152,
                width: 80,
                height: 0,
                angle: 0,
                strokeColor: '#475569',
                backgroundColor: 'transparent',
                fillStyle: 'solid',
                strokeWidth: 2,
                roughness: 0,
                opacity: 100,
                seed: 4,
                version: 1,
                versionNonce: 4,
                isDeleted: false,
                boundElements: [],
                updated: now,
                link: null,
                locked: false,
                points: [[0, 0], [80, 0]],
            },
            {
                id: 'arrow-2',
                type: 'arrow',
                x: 680,
                y: 152,
                width: 80,
                height: 0,
                angle: 0,
                strokeColor: '#475569',
                backgroundColor: 'transparent',
                fillStyle: 'solid',
                strokeWidth: 2,
                roughness: 0,
                opacity: 100,
                seed: 5,
                version: 1,
                versionNonce: 5,
                isDeleted: false,
                boundElements: [],
                updated: now,
                link: null,
                locked: false,
                points: [[0, 0], [80, 0]],
            },
        ],
    };
}

// ตั้งค่า URL ของ Python FastAPI
const API_BASE_URL = 'http://localhost:8000/api';

// Demo: 3-tier web architecture from gemini_to_excalidraw.py output
const DEMO_3TIER_ELEMENTS: unknown[] = [
    {"id":"presTier","type":"rectangle","x":50,"y":80,"width":700,"height":260,"angle":0,"strokeColor":"#333333","backgroundColor":"#e8f4f8","fillStyle":"solid","strokeWidth":2,"strokeStyle":"solid","roughness":1,"opacity":40},
    {"id":"presText","type":"text","x":70,"y":90,"text":"Presentation Tier","fontSize":16,"fontFamily":5},
    {"id":"appTier","type":"rectangle","x":50,"y":380,"width":700,"height":180,"angle":0,"strokeColor":"#333333","backgroundColor":"#e8f4f8"},
    {"id":"appText","type":"text","x":70,"y":390,"text":"Application Tier","fontSize":16,"fontFamily":5},
    {"id":"dataTier","type":"rectangle","x":50,"y":600,"width":700,"height":140,"angle":0,"strokeColor":"#333333","backgroundColor":"#e8f4f8"},
    {"id":"dataText","type":"text","x":70,"y":610,"text":"Data Tier","fontSize":16,"fontFamily":5},
    {"id":"client","type":"text","x":370,"y":40,"text":"Client","fontSize":16,"fontFamily":5},
    {"id":"lb","type":"rectangle","x":320,"y":140,"width":160,"height":60,"backgroundColor":"#dbe9f9"},
    {"id":"lb-text","type":"text","x":340,"y":160,"text":"Load Balancer","fontSize":14,"fontFamily":5},
    {"id":"ws1","type":"rectangle","x":140,"y":250,"width":160,"height":60,"backgroundColor":"#dbe9f9"},
    {"id":"ws1-text","type":"text","x":160,"y":270,"text":"Web Server 1","fontSize":14,"fontFamily":5},
    {"id":"ws2","type":"rectangle","x":500,"y":250,"width":160,"height":60,"backgroundColor":"#dbe9f9"},
    {"id":"ws2-text","type":"text","x":520,"y":270,"text":"Web Server 2","fontSize":14,"fontFamily":5},
    {"id":"app1","type":"rectangle","x":140,"y":440,"width":160,"height":60,"backgroundColor":"#dbe9f9"},
    {"id":"app1-text","type":"text","x":160,"y":460,"text":"App Server 1","fontSize":14,"fontFamily":5},
    {"id":"app2","type":"rectangle","x":500,"y":440,"width":160,"height":60,"backgroundColor":"#dbe9f9"},
    {"id":"app2-text","type":"text","x":520,"y":460,"text":"App Server 2","fontSize":14,"fontFamily":5},
    {"id":"db","type":"ellipse","x":320,"y":660,"width":160,"height":60,"backgroundColor":"#dbe9f9"},
    {"id":"db-text","type":"text","x":350,"y":680,"text":"Database","fontSize":14,"fontFamily":5},
];

const DEMO_3TIER_ARCHITECTURE: Record<string, unknown> = {
    type: 'excalidraw',
    version: 2,
    source: 'https://excalidraw.com',
    elements: DEMO_3TIER_ELEMENTS,
    appState: {'viewBackgroundColor':'#ffffff','gridSize':20,'theme':'light'},
    files: {},
};

export default function App() {
    // Auth session
    const { data: session, status } = useSession();

    // --- States ---
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedData, setGeneratedData] = useState<SpecData | null>(null);

    // Visualization States (Mermaid - Phase 3)
    const [isGeneratingViz, setIsGeneratingViz] = useState(false);
    const [vizError, setVizError] = useState<string | null>(null);
    const [currentVizJson, setCurrentVizJson] = useState<string | null>(null);

    // Spec Metadata
    const [specFilename, setSpecFilename] = useState<string | null>(null); // Store filename for API calls

    // Excalidraw Diagram States (Phase 4)
    const [excalidrawDiagram, setExcalidrawDiagram] = useState<Record<string, unknown> | null>(null);
    const [isGeneratingExcalidraw, setIsGeneratingExcalidraw] = useState(false);
    const [excalidrawError, setExcalidrawError] = useState<string | null>(null);
    const [specHash, setSpecHash] = useState<string | null>(null);
    const [diagramSpecHash, setDiagramSpecHash] = useState<string | null>(null); // Hash when diagram was generated
    const [rateLimitRemaining, setRateLimitRemaining] = useState<number>(2); // Default: 2/day
    const [forceMockDiagram, setForceMockDiagram] = useState(false); // Manual toggle: mock vs real rendering
    const [isSavingDiagram, setIsSavingDiagram] = useState(false);

    // UI States
    const [activeTab, setActiveTab] = useState<'document' | 'json'>('document');
    const [isCopied, setIsCopied] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublished, setIsPublished] = useState(true); // Publish checkbox state
    const [specFilter, setSpecFilter] = useState<'all' | 'published' | 'draft'>('all');
    const [vizFilter, setVizFilter] = useState<'all' | 'ready' | 'none'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
    const [generatingBySpecId, setGeneratingBySpecId] = useState<Record<string, boolean>>({});
    const [activeProgressStep, setActiveProgressStep] = useState<number>(0);
    const [progressMode, setProgressMode] = useState<'live' | 'fallback' | null>(null);
    const [progressElapsedMs, setProgressElapsedMs] = useState<number>(0);
    const [lastCompletedMs, setLastCompletedMs] = useState<number | null>(null);
    const [lastErrorStep, setLastErrorStep] = useState<string | null>(null);
    const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
    const [finishedAtMs, setFinishedAtMs] = useState<number | null>(null);

    // Database Connection State
    const [dbStatus, setDbStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
    const [specsErrorMessage, setSpecsErrorMessage] = useState<string | null>(null);

    // State เก็บประวัติ
    const [savedSpecs, setSavedSpecs] = useState<SavedSpec[]>([]);
    const savedSpecsScrollRef = useRef<HTMLDivElement | null>(null);
    const [savedSpecsScrollTop, setSavedSpecsScrollTop] = useState(0);
    const [savedSpecsViewportHeight, setSavedSpecsViewportHeight] = useState(520);

    // --- Effects (API Connections) ---
    const fetchSpecs = async () => {
        console.log('[E2E TEST] 📚 Loading saved specs from database...');
        try {
            // Fetch user's specs from Next.js API (database)
            const response = await fetch('/api/user-specs');

            if (!response.ok) {
                if (response.status === 401) {
                    // User not logged in, clear specs
                    console.log('[E2E TEST] ℹ️ User not authenticated, clearing specs');
                    setSavedSpecs([]);
                    setSpecsErrorMessage(null);
                    return;
                }

                let errorPayload: { error?: string; code?: string } | null = null;
                try {
                    errorPayload = await response.json();
                } catch {
                    errorPayload = null;
                }

                console.error('[E2E TEST] ❌ Error fetching specs:', errorPayload);

                if (response.status === 503 || errorPayload?.code === 'DATABASE_UNAVAILABLE') {
                    setSavedSpecs([]);
                    setSpecsErrorMessage(errorPayload?.error || 'Database is unavailable. Please try again later.');
                    return;
                }

                throw new Error(errorPayload?.error || 'Failed to fetch specs');
            }
            const data = await response.json();
            console.log('[E2E TEST] ✅ Specs loaded successfully:', {
                count: data.length,
                specs: data.map((s: SavedSpec) => ({
                    name: s.project_name,
                    status: s.status,
                    isPublished: s.isPublished
                }))
            });
            setSavedSpecs(data);
            setSpecsErrorMessage(null);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error("[E2E TEST] ❌ Error fetching specs:", errorMsg);
            setSavedSpecs([]);
            setSpecsErrorMessage('Unable to load saved specs right now. Please retry.');
        }
    };

    useEffect(() => {
        const initializeData = async () => {
            setDbStatus('connecting');
            setApiErrorMessage(null);

            // Always fetch user's saved specs from Next.js database first
            if (status === 'authenticated') {
                await fetchSpecs();
            } else {
                setSavedSpecs([]);
                setSpecsErrorMessage(null);
            }

            try {
                // Check Python API health for generation feature
                const healthRes = await fetch(`${API_BASE_URL}/health`);
                if (!healthRes.ok) throw new Error('API server returned error');

                setDbStatus('connected');

            } catch (error) {
                console.warn("⚠️ Cannot connect to Python API. Generation features may not work.", error);
                setDbStatus('error');
                setApiErrorMessage("Cannot connect to Python API at http://localhost:8000. Make sure FastAPI is running for generation features.");
                // Note: User's specs already loaded from Next.js database above
            }
        };

        initializeData();
    }, [status]); // Re-fetch when auth status changes

    // --- Actions ---

    // โค้ดที่เรียก API ของจริง (ลบฟังก์ชัน simulate ทิ้งไปแล้ว)
    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        console.log('[E2E TEST] 📝 Starting spec generation with prompt:', prompt);
        setIsGenerating(true);
        setGeneratedData(null);

        try {
            const requestPayload = {
                prompt: prompt,
                userId: session?.user?.id ?? null,
            };

            console.log('[E2E TEST] 📤 Sending to /generate endpoint:', requestPayload);

            const response = await fetch(`${API_BASE_URL}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload)
            });

            console.log('[E2E TEST] 📩 Response status:', response.status);

            if (!response.ok) {
                // Check for specific error codes from backend
                let errorPayload: ApiErrorPayload | null = null;
                try {
                    errorPayload = await response.json();
                } catch {
                    // If response is not JSON, just use status
                }

                console.error('[E2E TEST] ❌ Error response:', errorPayload);

                // Handle specific error cases
                if (response.status === 503 || errorPayload?.code === 'DATABASE_UNAVAILABLE') {
                    toast.error("Database unavailable", {
                        description: "The database is temporarily down. Please try again later."
                    });
                    return;
                }

                throw new Error(`Generation failed (${response.status})`);
            }

            const result = await response.json();
            console.log('[E2E TEST] ✅ Spec generated:', {
                projectName: result.data?.project_name,
                hasProcessDescription: !!result.data?.processDescription,
                hasVisualization: !!result.data?.visualizationProcess,
                isMock: result.isMock,
                filename: result.filename
            });

            // อัปเดตหน้าจอขวา
            setGeneratedData(result.data);
            setSpecFilename(result.filename); // Store filename for /api/visualize-spec calls
            setIsPublished(true);

            if (result?.isMock) {
                toast.warning('Using mock data (LLM quota limit)', {
                    description: 'Generated content is fallback mock data. Please retry when API quota is available.'
                });
            }

            // Refresh sidebar automatically after successful generation
            if (status === 'authenticated') {
                console.log('[E2E TEST] 🔄 Refreshing saved specs from database...');
                await fetchSpecs();
            }

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error("[E2E TEST] ❌ Error generating spec:", errorMsg);
            toast.error("Generation failed - is FastAPI running?", {
                description: "Please check if the Python API service is available on localhost:8000"
            });
        } finally {
            setIsGenerating(false);
            console.log('[E2E TEST] 🏁 Spec generation complete');
        }
    };

    const handleCopy = () => {
        if (generatedData) {
            navigator.clipboard.writeText(JSON.stringify(generatedData, null, 2));
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handleLoadSpec = (spec: SavedSpec) => {
        console.log('[E2E TEST] 📖 Loading spec:', {
            projectName: spec.project_name,
            hasProcessDescription: !!spec.content.processDescription,
            hasVisualization: !!spec.content.visualizationProcess,
            filename: spec.id,
            created: spec.created_at
        });
        setGeneratedData(spec.content);
        setSpecFilename(spec.id); // Store filename for /api/visualize-spec calls
        setPrompt(spec.content.problem_statement);
        setIsPublished(spec.isPublished);

        // Load existing visualization if available
        if (spec.content.visualizationProcess) {
            console.log('[E2E TEST] 🎨 Loading existing visualization from database...');
            setExcalidrawDiagram(spec.content.visualizationProcess);
            setExcalidrawError(null);
            toast.success('Visualization loaded from database', {
                description: 'This visualization was previously generated'
            });
        } else {
            setExcalidrawDiagram(null);
            console.log('[E2E TEST] ℹ️ No visualization saved for this spec yet');
        }

        setActiveTab('document');
        console.log('[E2E TEST] ✅ Spec loaded with visualization, ready for display');
    };

    const handleDeleteSpec = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this spec?")) {
            try {
                const response = await fetch(`/api/user-specs/${id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    let errorPayload: ApiErrorPayload | null = null;
                    try {
                        errorPayload = await response.json();
                    } catch {
                        errorPayload = null;
                    }

                    if (response.status === 503 || errorPayload?.code === 'DATABASE_UNAVAILABLE') {
                        toast.error('Database unavailable', {
                            description: errorPayload?.error || 'Please try deleting again in a moment.'
                        });
                        return;
                    }

                    throw new Error(errorPayload?.error || 'Failed to delete');
                }

                const deletedSpec = savedSpecs.find(s => s.id === id);
                setSavedSpecs(prev => prev.filter(s => s.id !== id));

                if (generatedData && deletedSpec?.content.project_name === generatedData.project_name) {
                    setGeneratedData(null);
                    setPrompt("");
                }
            } catch (error) {
                console.error("Error deleting spec:", error);
                toast.error("Failed to delete spec", {
                    description: "Please try again later"
                });
            }
        }
    };

    const handleSaveExcalidrawDiagram = async (diagramData: Record<string, unknown>) => {
        if (!generatedData || !specFilename) {
            toast.error('Cannot save diagram', {
                description: 'No spec loaded or filename missing'
            });
            return;
        }

        setIsSavingDiagram(true);

        try {
            // Update the generatedData with the edited diagram
            const updatedData = {
                ...generatedData,
                visualizationProcess: diagramData
            };

            // Save to database via API
            const response = await fetch('/api/specs-save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: updatedData,
                    userId: session?.user?.id,
                    filename: specFilename,
                    isPublished: isPublished
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save diagram');
            }

            // Update local state
            setExcalidrawDiagram(diagramData);
            setGeneratedData(updatedData);
            await fetchSpecs();

            toast.success('Diagram saved successfully!', {
                description: `Updated ${generatedData.project_name} with ${(diagramData.elements as Array<unknown>)?.length || 0} elements`
            });
        } catch (error) {
            console.error('Error saving diagram:', error);
            toast.error('Failed to save diagram', {
                description: error instanceof Error ? error.message : 'Please try again'
            });
        } finally {
            setIsSavingDiagram(false);
        }
    };

    const handleSaveSpec = async () => {
        // Check if user is logged in
        if (status !== 'authenticated' || !session?.user?.id) {
            setShowLoginModal(true);
            return;
        }

        if (!generatedData) {
            toast.warning("No spec to save", {
                description: "Generate a spec first before saving"
            });
            return;
        }

        setIsSaving(true);

        try {
            // Send to Next.js API (not Python) with userId and isPublished state
            const response = await fetch('/api/specs-save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: generatedData,
                    userId: session.user.id,
                    isPublished: isPublished
                })
            });

            if (!response.ok) {
                let errorPayload: ApiErrorPayload | null = null;
                try {
                    errorPayload = await response.json();
                } catch {
                    errorPayload = null;
                }

                if (response.status === 503 || errorPayload?.code === 'DATABASE_UNAVAILABLE') {
                    toast.error('Database unavailable', {
                        description: errorPayload?.error || 'Please try saving again in a moment.'
                    });
                    return;
                }

                throw new Error(errorPayload?.error || 'Failed to save spec');
            }

            // Refresh the specs list
            await fetchSpecs();

            const publishStatus = isPublished ? 'published' : 'saved as draft';
            toast.success(`Spec ${publishStatus} successfully!`, {
                description: `Your spec "${generatedData?.project_name}" has been ${publishStatus}`
            });

        } catch (error) {
            console.error("Error saving spec:", error);
            toast.error("Failed to save spec", {
                description: "An error occurred while saving. Please try again"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleTogglePublishSpec = async (spec: SavedSpec) => {
        try {
            const response = await fetch(`/api/user-specs/${spec.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublished: !spec.isPublished }),
            });

            if (!response.ok) {
                let errorPayload: ApiErrorPayload | null = null;
                try {
                    errorPayload = await response.json();
                } catch {
                    errorPayload = null;
                }

                if (response.status === 503 || errorPayload?.code === 'DATABASE_UNAVAILABLE') {
                    toast.error('Database unavailable', {
                        description: errorPayload?.error || 'Please try updating publish status again in a moment.'
                    });
                    return;
                }

                throw new Error(errorPayload?.error || 'Failed to update publish status');
            }

            setSavedSpecs((prev) =>
                prev.map((item) =>
                    item.id === spec.id ? { ...item, isPublished: !item.isPublished } : item
                )
            );

            if (generatedData?.project_name === spec.project_name) {
                setIsPublished(!spec.isPublished);
            }
        } catch (error) {
            console.error('Error updating publish status:', error);
            toast.error('Failed to update status', {
                description: 'Could not update the publish status. Please try again'
            });
        }
    };

    const handleSignOut = async () => {
        await signOut({ redirectTo: '/' });
    };

    // Phase 3: Mermaid Diagram Generation
    const handleGenerateMermaidDiagram = async () => {
        if (!generatedData?.processDescription) {
            toast.error('No process description', {
                description: 'Generate a spec first to create a diagram'
            });
            return;
        }

        setIsGeneratingViz(true);
        setVizError(null);

        try {
            const response = await fetch('/api/generate-diagram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    processDescription: generatedData.processDescription,
                    projectName: generatedData.project_name
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate diagram');
            }

            const data = await response.json();
            setCurrentVizJson(data.mermaidCode);
            toast.success('Mermaid diagram generated', {
                description: 'Check the visualization below'
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setVizError(errorMessage);
            toast.error('Diagram generation failed', {
                description: errorMessage
            });
        } finally {
            setIsGeneratingViz(false);
        }
    };

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const handleGenerateExcalidrawDiagramForSpec = async (targetSpec?: SavedSpec) => {
        const targetData = targetSpec?.content ?? generatedData;
        const targetSpecId = targetSpec?.id ?? specFilename ?? targetData?.project_name;

        console.log('[E2E TEST] 🎨 Starting Excalidraw diagram generation...');
        console.log('[E2E TEST] Target spec:', targetSpecId);

        if (!targetData || !targetSpecId) {
            console.error('[E2E TEST] ❌ No spec available');
            toast.error('No spec available', {
                description: 'Generate or load a spec first'
            });
            return;
        }

        if (rateLimitRemaining <= 0) {
            console.warn('[E2E TEST] ⚠️ API quota exhausted, using mock diagram');
            setExcalidrawDiagram(buildMockExcalidrawMcp(targetData.project_name));
            setExcalidrawError(null);
            toast.warning('Using mock Excalidraw MCP diagram', {
                description: 'API quota reached. Showing custom mock visualization for this spec.'
            });
            return;
        }

        setIsGeneratingExcalidraw(true);
        setExcalidrawError(null);
        setGeneratingBySpecId((prev) => ({ ...prev, [targetSpecId]: true }));

        if (targetSpec) {
            setGeneratedData(targetSpec.content);
            setSpecFilename(targetSpec.id);
            setPrompt(targetSpec.content.problem_statement);
            setIsPublished(targetSpec.isPublished);
        }

        const startedAt = Date.now();
        setStartedAtMs(startedAt);
        setFinishedAtMs(null);
        let latestStepIndex = 0;
        let streamErrorStep: string | null = null;
        const updateProgressStep = (index: number) => {
            const normalized = Math.max(0, Math.min(index, VISUALIZATION_STEPS.length - 1));
            latestStepIndex = normalized;
            setActiveProgressStep(normalized);
        };

        updateProgressStep(0);
        setProgressMode(null);
        setProgressElapsedMs(0);
        setLastCompletedMs(null);
        setLastErrorStep(null);

        const elapsedTimer = window.setInterval(() => {
            setProgressElapsedMs(Date.now() - startedAt);
        }, 150);

        const applyFallbackProgress = async () => {
            for (let index = 1; index < VISUALIZATION_STEPS.length; index += 1) {
                await wait(900);
                updateProgressStep(index);
            }
        };

        const readStreamingResult = async (response: Response): Promise<Record<string, unknown> | null> => {
            if (!response.body) {
                return null;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let streamedResult: Record<string, unknown> | null = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const rawLine of lines) {
                    const line = rawLine.trim();
                    if (!line) continue;

                    const payloadLine = line.startsWith('data:') ? line.slice(5).trim() : line;
                    try {
                        const payload = JSON.parse(payloadLine) as Record<string, unknown>;

                        if (typeof payload.step === 'number') {
                            const stepIdx = Math.max(0, Math.min(Number(payload.step) - 1, VISUALIZATION_STEPS.length - 1));
                            updateProgressStep(stepIdx);
                        }

                        if (typeof payload.message === 'string') {
                            const inferredStep = resolveProgressStepFromMessage(payload.message);
                            if (inferredStep !== null) {
                                updateProgressStep(inferredStep);
                            }
                        }

                        if (typeof payload.status === 'string' && payload.status === 'error') {
                            const label = VISUALIZATION_STEPS[Math.max(0, Math.min(latestStepIndex, VISUALIZATION_STEPS.length - 1))];
                            const detail = typeof payload.message === 'string' ? payload.message : 'Unknown stream error';
                            streamErrorStep = `${label} — ${detail}`;
                        }

                        if (typeof payload.status === 'string' && payload.status === 'success') {
                            streamedResult = payload;
                        }

                        if (payload.diagram && typeof payload.diagram === 'object') {
                            streamedResult = payload;
                        }
                    } catch {
                        const inferredStep = resolveProgressStepFromMessage(payloadLine);
                        if (inferredStep !== null) {
                            updateProgressStep(inferredStep);
                        }
                    }
                }
            }

            if (streamErrorStep) {
                throw new Error(streamErrorStep);
            }

            return streamedResult;
        };

        try {
            const currentHash = await computeSpecHash({
                problem_statement: targetData.problem_statement,
                functional_requirements: targetData.functional_requirements,
                non_functional_requirements: targetData.non_functional_requirements,
                tech_stack_recommendation: targetData.tech_stack_recommendation
            });
            setSpecHash(currentHash);
            console.log('[E2E TEST] 📊 Spec hash computed:', currentHash);

            const requestPayload = {
                specId: targetSpecId,
                userId: session?.user?.email || 'anonymous',
                forceRegenerate: false,
                diagramTypes: ['excalidraw']
            };

            console.log('[E2E TEST] 📤 Sending request to /visualize-spec:', requestPayload);

            const response = await fetch(`${API_BASE_URL}/visualize-spec?stream=1`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream, application/x-ndjson, application/json'
                },
                body: JSON.stringify(requestPayload)
            });

            console.log('[E2E TEST] 📩 Response status:', response.status);

            if (!response.ok) {
                const error = await response.json();
                console.error('[E2E TEST] ❌ Error response:', error);
                throw new Error(error.detail?.message || 'Failed to generate diagram');
            }

            const contentType = response.headers.get('content-type') || '';
            let result: Record<string, unknown> | null = null;

            if (contentType.includes('text/event-stream') || contentType.includes('application/x-ndjson')) {
                setProgressMode('live');
                result = await readStreamingResult(response);
            } else {
                setProgressMode('fallback');
                void applyFallbackProgress();
                result = await response.json();
            }

            if (!result || !result.diagram || typeof result.diagram !== 'object') {
                throw new Error('Invalid visualization payload');
            }

            console.log('[E2E TEST] ✅ Excalidraw diagram received:', {
                hasElements: Array.isArray((result.diagram as Record<string, unknown>).elements)
                    ? ((result.diagram as Record<string, unknown>).elements as unknown[]).length
                    : 0,
                rateLimitRemaining: result.rateLimitRemaining,
                diagramType: (result.diagram as Record<string, unknown>).type
            });

            const elapsed = Date.now() - startedAt;
            if (elapsed < VISUALIZATION_MIN_DURATION_MS) {
                await wait(VISUALIZATION_MIN_DURATION_MS - elapsed);
            }

            setExcalidrawDiagram(result.diagram as Record<string, unknown>);
            setDiagramSpecHash(typeof result.specHash === 'string' ? result.specHash : null);
            setRateLimitRemaining(typeof result.rateLimitRemaining === 'number' ? result.rateLimitRemaining : rateLimitRemaining);

            setSavedSpecs((prev) => prev.map((spec) => (
                spec.id === targetSpecId
                    ? {
                        ...spec,
                        content: {
                            ...spec.content,
                            visualizationProcess: result.diagram as Record<string, unknown>
                        }
                    }
                    : spec
            )));

            if (targetData) {
                setGeneratedData({
                    ...targetData,
                    visualizationProcess: result.diagram as Record<string, unknown>
                });
            }

            const completedMs = Date.now() - startedAt;
            setLastCompletedMs(completedMs);
            setFinishedAtMs(Date.now());

            toast.success('Excalidraw diagram generated!', {
                description: `${typeof result.rateLimitRemaining === 'number' ? result.rateLimitRemaining : rateLimitRemaining} generations remaining today`
            });

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            console.error('[E2E TEST] ❌ Exception during diagram generation:', errorMsg);
            setExcalidrawDiagram(buildMockExcalidrawMcp(targetData.project_name));
            setExcalidrawError(null);
            setLastErrorStep(streamErrorStep ?? `${VISUALIZATION_STEPS[Math.max(0, Math.min(latestStepIndex, VISUALIZATION_STEPS.length - 1))]} — ${errorMsg}`);
            setProgressMode((prev) => prev ?? 'fallback');
            toast.warning('Switched to mock Excalidraw MCP diagram', {
                description: `API unavailable (${errorMsg}). Using mock process visualization.`
            });
        } finally {
            window.clearInterval(elapsedTimer);
            setProgressElapsedMs(Date.now() - startedAt);
            setActiveProgressStep(VISUALIZATION_STEPS.length - 1);
            setIsGeneratingExcalidraw(false);
            setGeneratingBySpecId((prev) => ({ ...prev, [targetSpecId]: false }));
            console.log('[E2E TEST] 🏁 Excalidraw generation complete');
        }
    };

    const handleGenerateExcalidrawDiagram = async () => {
        await handleGenerateExcalidrawDiagramForSpec();
    };

    const clearProgress = () => {
        setLastCompletedMs(null);
        setLastErrorStep(null);
        setStartedAtMs(null);
        setFinishedAtMs(null);
        setIsGeneratingExcalidraw(false);
        setProgressMode(null);
        setProgressElapsedMs(0);
        setActiveProgressStep(-1);
    };

    const loadDemo3TierArchitecture = () => {
        console.log('[DEMO] Loading 3-tier web architecture from gemini_to_excalidraw.py');
        setExcalidrawDiagram(DEMO_3TIER_ARCHITECTURE as Record<string, unknown>);

        setGeneratedData({
            project_name: '3-Tier Web Architecture',
            problem_statement: 'Design a scalable web application architecture with load balancing',
            solution_overview: 'A three-tier architecture separating presentation, application, and data layers for scalability and maintainability',
            functional_requirements: [
                'Handle multiple concurrent users through load balancer',
                'Distribute traffic across web servers',
                'Process requests in application tier',
                'Persist data in centralized database',
                'Support horizontal scaling',
            ],
            non_functional_requirements: [
                'High availability and fault tolerance',
                'Horizontal and vertical scalability',
                'Low latency inter-tier communication',
                'Security at each tier boundary',
            ],
            tech_stack_recommendation: [
                'Load Balancer: Nginx, HAProxy, or cloud load balancer',
                'Web Tier: Node.js, Python, or Go',
                'App Tier: Node.js, Java, Python, or .NET',
                'Database: PostgreSQL, MySQL, or NoSQL alternatives',
            ],
            status: 'Production-Ready',
            visualizationProcess: DEMO_3TIER_ARCHITECTURE as Record<string, unknown>,
        });

        setSpecFilename('demo-3tier-architecture');
        setPrompt('3-tier web architecture with load balancer, web servers, application servers, and database');
        setActiveTab('document');

        toast.success('Demo 3-tier architecture loaded!', {
            description: 'Generated from gemini_to_excalidraw.py with Gemini API and Excalidraw MCP'
        });
    };


    const publishedCount = savedSpecs.filter((spec) => spec.isPublished).length;
    const draftCount = savedSpecs.filter((spec) => !spec.isPublished).length;
    const filteredSavedSpecs = savedSpecs.filter((spec) => {
        if (specFilter === 'published') return spec.isPublished;
        if (specFilter === 'draft') return !spec.isPublished;
        return true;
    }).filter((spec) => {
        if (vizFilter === 'ready') return hasVisualizationData(spec);
        if (vizFilter === 'none') return !hasVisualizationData(spec);
        return true;
    }).filter((spec) => spec.project_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const sortedSavedSpecs = [...filteredSavedSpecs].sort((a, b) => {
        const dateA = new Date(a.created_at.replace(' ', 'T')).getTime();
        const dateB = new Date(b.created_at.replace(' ', 'T')).getTime();
        return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
    });

    const specsWithVisualization = savedSpecs.filter((spec) => hasVisualizationData(spec));
    const specsWithoutVisualization = savedSpecs.filter((spec) => !hasVisualizationData(spec));
    const canRenderLoadedVisualization = isRenderableExcalidrawDiagram(excalidrawDiagram);

    useEffect(() => {
        const updateViewportHeight = () => {
            if (savedSpecsScrollRef.current) {
                setSavedSpecsViewportHeight(savedSpecsScrollRef.current.clientHeight);
            }
        };

        updateViewportHeight();
        window.addEventListener('resize', updateViewportHeight);
        return () => window.removeEventListener('resize', updateViewportHeight);
    }, [sortedSavedSpecs.length]);

    const useVirtualizedSavedSpecs = sortedSavedSpecs.length > VIRTUALIZE_THRESHOLD;

    const virtualizedSavedSpecs = useMemo(() => {
        if (!useVirtualizedSavedSpecs) {
            return {
                items: sortedSavedSpecs,
                paddingTop: 0,
                paddingBottom: 0,
            };
        }

        const startIndex = Math.max(
            0,
            Math.floor(savedSpecsScrollTop / VIRTUAL_ITEM_HEIGHT) - VIRTUAL_OVERSCAN
        );

        const visibleCount = Math.ceil(savedSpecsViewportHeight / VIRTUAL_ITEM_HEIGHT) + VIRTUAL_OVERSCAN * 2;

        const endIndex = Math.min(sortedSavedSpecs.length, startIndex + visibleCount);
        const items = sortedSavedSpecs.slice(startIndex, endIndex);
        const paddingTop = startIndex * VIRTUAL_ITEM_HEIGHT;
        const paddingBottom = Math.max(0, (sortedSavedSpecs.length - endIndex) * VIRTUAL_ITEM_HEIGHT);

        return {
            items,
            paddingTop,
            paddingBottom,
        };
    }, [
        useVirtualizedSavedSpecs,
        sortedSavedSpecs,
        savedSpecsScrollTop,
        savedSpecsViewportHeight,
    ]);

    const diagramState: DiagramState = {
        exists: !!excalidrawDiagram,
        specHash,
        specChanged: !!specHash && !!diagramSpecHash && specHash !== diagramSpecHash,
        remainingGens: rateLimitRemaining,
        lastGenerated: null,
    };
    const quotaTone = getQuotaTone(rateLimitRemaining);
    const diagramButton = getButtonLabel(diagramState);
    const diagramButtonStyles =
        diagramButton.variant === 'primary'
            ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200'
            : diagramButton.variant === 'warning'
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200';

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">

            <nav className="bg-slate-900 text-white px-4 py-3 shadow-lg sticky top-0 z-40">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Layers className="text-blue-400" size={22} />
                        <span className="text-lg font-bold tracking-tight">Blueprint<span className="text-blue-400">Hub</span></span>
                    </Link>

                    <div className="flex items-center gap-3">
                        {status === 'authenticated' && session?.user ? (
                            <>
                                <Link href="/profile" className="text-xs text-slate-300 hover:text-blue-400 transition">
                                    {session.user.name || 'User'}
                                </Link>
                                {session.user.image ? (
                                    <Link href="/profile" title="View Profile">
                                        <Image
                                            src={session.user.image}
                                            alt="Profile"
                                            width={32}
                                            height={32}
                                            className="w-8 h-8 rounded-full border border-blue-500 object-cover hover:border-blue-400 transition"
                                        />
                                    </Link>
                                ) : (
                                    <Link href="/profile" title="View Profile" className="w-8 h-8 rounded-full bg-slate-700 hover:bg-blue-600 transition" />
                                )}
                                <button
                                    onClick={handleSignOut}
                                    className="text-slate-300 hover:text-red-400 transition"
                                    title="Sign out"
                                >
                                    <LogOut size={18} />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setShowLoginModal(true)}
                                className="text-sm font-medium text-slate-300 hover:text-white transition"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            <div className="flex flex-1 overflow-hidden min-h-0">

            {/* ---------------- SIDEBAR ---------------- */}
            <div className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0 min-h-0">
                <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
                    <div className="bg-blue-600 p-2 rounded-lg text-white">
                        <Sparkles size={20} />
                    </div>
                    <h1 className="font-bold text-lg">Auto-Spec</h1>
                </div>

                <div className="p-6 flex-1 space-y-8 min-h-0">

                    {/* Storage Config & DB Status */}
                    <div className="flex flex-col min-h-0">
                        <div className="flex items-center space-x-2 text-slate-800 font-semibold mb-3">
                            <Database size={18} className="text-blue-500" />
                            <h3>Storage Backend</h3>
                        </div>

                        {dbStatus === 'connecting' && (
                            <div className="bg-slate-50 border border-slate-200 text-slate-600 text-sm p-3 rounded-lg flex items-center space-x-2 animate-pulse">
                                <Loader2 size={16} className="animate-spin text-slate-400" />
                                <span>Connecting to Python API...</span>
                            </div>
                        )}

                        {dbStatus === 'connected' && (
                            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm p-3 rounded-lg flex items-start space-x-2">
                                <Check size={16} className="mt-0.5 shrink-0 text-blue-600" />
                                <div>
                                    <span className="font-semibold block">API Connected</span>
                                    <span className="text-xs text-blue-600/80">Fetching live from PostgreSQL</span>
                                </div>
                            </div>
                        )}

                        {dbStatus === 'error' && (
                            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3 rounded-lg flex items-start space-x-2">
                                <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                                <div>
                                    <span className="font-semibold block">API Disconnected</span>
                                    <span className="text-xs text-amber-600/90 leading-tight block mt-1">
                                        {apiErrorMessage}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Configuration */}
                    <div>
                        <div className="flex items-center space-x-2 text-slate-800 font-semibold mb-3">
                            <Settings size={18} className="text-slate-500" />
                            <h3>Configuration</h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Model ID</label>
                                <input
                                    type="text" disabled value="gemini-2.5-flash"
                                    className="w-full text-sm p-2 bg-slate-100 border border-slate-200 rounded text-slate-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Saved Specs List */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2 text-slate-800 font-semibold">
                                <FileText size={18} className="text-amber-500" />
                                <h3>Saved Specs ({savedSpecs.length})</h3>
                            </div>
                            <button
                                onClick={fetchSpecs}
                                className="text-[11px] px-2 py-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50"
                            >
                                Refresh
                            </button>
                        </div>

                        {specsErrorMessage && (
                            <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-lg">
                                <span className="font-semibold block">Database unavailable</span>
                                <span className="leading-tight block mt-1">{specsErrorMessage}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg mb-3">
                            <button
                                onClick={() => setSpecFilter('all')}
                                className={`text-[11px] py-1.5 rounded ${specFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                            >
                                All ({savedSpecs.length})
                            </button>
                            <button
                                onClick={() => setSpecFilter('published')}
                                className={`text-[11px] py-1.5 rounded ${specFilter === 'published' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                            >
                                Published ({publishedCount})
                            </button>
                            <button
                                onClick={() => setSpecFilter('draft')}
                                className={`text-[11px] py-1.5 rounded ${specFilter === 'draft' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                            >
                                Draft ({draftCount})
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg mb-3">
                            <button
                                onClick={() => setVizFilter('all')}
                                className={`text-[11px] py-1.5 rounded ${vizFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                            >
                                Viz All
                            </button>
                            <button
                                onClick={() => setVizFilter('ready')}
                                className={`text-[11px] py-1.5 rounded ${vizFilter === 'ready' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                            >
                                Viz Ready
                            </button>
                            <button
                                onClick={() => setVizFilter('none')}
                                className={`text-[11px] py-1.5 rounded ${vizFilter === 'none' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                            >
                                No Viz
                            </button>
                        </div>

                        <div className="mb-3 space-y-2">
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search project name..."
                                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-slate-500">Sort</span>
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as 'latest' | 'oldest')}
                                    className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-600"
                                >
                                    <option value="latest">Latest</option>
                                    <option value="oldest">Oldest</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-emerald-700 font-semibold">Visualization Ready: {specsWithVisualization.length}</span>
                                <span className="text-amber-700 font-semibold">No Visualization: {specsWithoutVisualization.length}</span>
                            </div>
                            {specsWithoutVisualization.length > 0 && (
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                    Missing: {specsWithoutVisualization.slice(0, 3).map((spec) => spec.project_name).join(', ')}{specsWithoutVisualization.length > 3 ? ' ...' : ''}
                                </p>
                            )}
                        </div>

                        {sortedSavedSpecs.length === 0 ? (
                            <div className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                ไม่พบรายการที่ตรงเงื่อนไข ✨
                            </div>
                        ) : (
                            <div
                                ref={savedSpecsScrollRef}
                                onScroll={(e) => setSavedSpecsScrollTop(e.currentTarget.scrollTop)}
                                className="space-y-2 max-h-[52vh] overflow-y-auto pr-1"
                            >
                                {useVirtualizedSavedSpecs && (
                                    <div className="text-[10px] text-slate-400 mb-1">
                                        Virtualized list active ({sortedSavedSpecs.length} items)
                                    </div>
                                )}

                                <div
                                    className="space-y-2"
                                    style={{
                                        paddingTop: useVirtualizedSavedSpecs ? virtualizedSavedSpecs.paddingTop : 0,
                                        paddingBottom: useVirtualizedSavedSpecs ? virtualizedSavedSpecs.paddingBottom : 0,
                                    }}
                                >
                                {virtualizedSavedSpecs.items.map(spec => (
                                    <div
                                        key={spec.id}
                                        className={`group border rounded-lg p-3 transition bg-white ${generatedData?.project_name === spec.project_name
                                            ? 'border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                                            : 'border-slate-200 hover:border-blue-400 hover:shadow-sm cursor-pointer'
                                            }`}
                                    >
                                        <div onClick={() => handleLoadSpec(spec)}>
                                            <h4 className="font-semibold text-sm truncate text-slate-800">{spec.project_name}</h4>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-xs text-slate-400">{spec.created_at}</p>
                                                <div className="flex items-center gap-1">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${spec.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {spec.isPublished ? 'Published' : 'Draft'}
                                                    </span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${hasVisualizationData(spec) ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>
                                                        {hasVisualizationData(spec) ? 'Viz Ready' : 'No Viz'}
                                                    </span>
                                                    <span className="text-[10px] bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded">
                                                        {getVisualizationElementCount(spec)} el
                                                    </span>
                                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{spec.status}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons (Load / Delete) */}
                                        <div className="mt-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleLoadSpec(spec); }}
                                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-1.5 rounded flex items-center justify-center"
                                            >
                                                <Edit3 size={12} className="mr-1" /> Load
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void handleGenerateExcalidrawDiagramForSpec(spec);
                                                }}
                                                disabled={!!generatingBySpecId[spec.id] || isGeneratingExcalidraw || rateLimitRemaining <= 0}
                                                className={`text-xs px-2 rounded flex items-center justify-center ${
                                                    !!generatingBySpecId[spec.id] || isGeneratingExcalidraw || rateLimitRemaining <= 0
                                                        ? 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
                                                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                                                }`}
                                                title={rateLimitRemaining <= 0 ? 'Daily limit reached (2/day)' : 'Generate visualization for this spec'}
                                            >
                                                {!!generatingBySpecId[spec.id] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleTogglePublishSpec(spec); }}
                                                className={`text-xs px-2 rounded flex items-center justify-center ${spec.isPublished ? 'bg-amber-50 hover:bg-amber-100 text-amber-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'}`}
                                                title={spec.isPublished ? 'Unpublish' : 'Republish'}
                                            >
                                                {spec.isPublished ? 'Unpublish' : 'Republish'}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteSpec(spec.id); }}
                                                className="bg-red-50 hover:bg-red-100 text-red-600 px-2 rounded flex items-center justify-center"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ---------------- MAIN CONTENT ---------------- */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">

                {/* Main Header */}
                <header className="bg-white border-b border-slate-200 p-4 px-8 shrink-0 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">🚀 Auto-Spec Generator</h2>
                        <p className="text-sm text-slate-500">เปลี่ยนไอเดียฟุ้งๆ ให้เป็น Software Requirement แบบมืออาชีพ</p>
                    </div>
                    <Link
                        href="/"
                        className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                    >
                        Go to Homepage
                    </Link>
                </header>

                {/* 2-Column Workspace */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 min-h-0">
                    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 h-full min-h-0">

                        {/* COLUMN 1: INPUT (ซ้าย) */}
                        <div className="w-full lg:w-5/12 flex flex-col h-full min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex items-center bg-slate-50/50">
                                <User size={18} className="text-blue-500 mr-2" />
                                <h3 className="font-semibold">📥 Raw Idea Input</h3>
                            </div>

                            <div className="p-4 flex-1 flex flex-col">
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="พิมพ์สิ่งที่คิดออกลงไปเลย (ไม่จำเป็นต้องเรียบเรียง)..."
                                    className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none outline-none text-slate-700 leading-relaxed"
                                    disabled={isGenerating}
                                />

                                <div className="mt-4 flex justify-between items-center">
                                    <span className="text-xs text-slate-400 font-mono">
                                        {prompt.length} chars
                                    </span>
                                    <div className="space-x-2">
                                        <button
                                            onClick={() => setPrompt("")}
                                            className="px-4 py-2.5 rounded-xl font-medium text-slate-500 hover:bg-slate-100 transition"
                                            disabled={isGenerating || !prompt}
                                        >
                                            Clear
                                        </button>
                                        <button
                                            onClick={handleGenerate}
                                            disabled={isGenerating || !prompt.trim()}
                                            className={`inline-flex items-center px-6 py-2.5 rounded-xl font-medium transition-all ${isGenerating || !prompt.trim()
                                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                                : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
                                                }`}
                                        >
                                            {isGenerating ? (
                                                <><Loader2 size={18} className="animate-spin mr-2" /> Generating...</>
                                            ) : (
                                                <><Send size={18} className="mr-2" /> Generate Spec</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COLUMN 2: OUTPUT (ขวา) */}
                        <div className="w-full lg:w-7/12 flex flex-col h-full min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">

                            {/* Output Header & Tabs */}
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                                <div className="flex items-center">
                                    <Bot size={18} className="text-emerald-500 mr-2" />
                                    <h3 className="font-semibold">📄 Structured Requirement</h3>
                                </div>

                                {/* Tabs Switcher */}
                                {generatedData && (
                                    <div className="flex items-center space-x-3">
                                        <div className="flex bg-slate-200/60 p-1 rounded-lg">
                                            <button
                                                onClick={() => setActiveTab('document')}
                                                className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'document' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                <LayoutTemplate size={14} className="mr-1.5" /> Document
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('json')}
                                                className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'json' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                <Code size={14} className="mr-1.5" /> JSON
                                            </button>
                                        </div>
                                        {/* ปุ่ม Close เทียบเท่า st.button("❌ Close") */}
                                        <button
                                            onClick={() => setGeneratedData(null)}
                                            className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50"
                                            title="Close Document"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Output Content Area */}
                            <div className="flex-1 overflow-y-auto bg-slate-50/30 p-6">

                                {isGenerating ? (
                                    // Loading State
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                                        <div className="relative">
                                            <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
                                            <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                                        </div>
                                        <p className="animate-pulse font-medium text-slate-500">🤖 AI กำลังวิเคราะห์และเขียน Spec ให้คุณ...</p>
                                    </div>
                                ) : !generatedData ? (
                                    // Empty State
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                                        <FileText size={64} className="opacity-20 text-slate-400" />
                                        <p className="text-sm">เลือกเอกสารจากเมนูด้านซ้าย หรือกดปุ่ม Generate เพื่อเริ่ม</p>
                                    </div>
                                ) : (
                                    // Data State
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">

                                        {/* Action Buttons (Copy & Save) */}
                                        <div className="flex justify-between items-center mb-4">
                                            {/* Publish Checkbox */}
                                            <label className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={isPublished}
                                                    onChange={(e) => setIsPublished(e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                                                />
                                                <span className="font-medium">Publish to homepage</span>
                                            </label>

                                            <span className="hidden xl:block text-[11px] text-slate-400">Only published specs appear on homepage</span>

                                            {/* Buttons */}
                                            <div className="flex space-x-2">
                                            <button
                                                onClick={handleSaveSpec}
                                                disabled={isSaving || status !== 'authenticated'}
                                                title={status !== 'authenticated' ? 'Sign in to save specs' : 'Save this spec to database'}
                                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                                                    status !== 'authenticated'
                                                        ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                                                } ${isSaving ? 'opacity-75' : ''}`}
                                            >
                                                {status !== 'authenticated' && <Lock size={14} />}
                                                {status === 'authenticated' && (isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />)}
                                                <span>{isSaving ? 'Saving...' : 'Save to DB'}</span>
                                            </button>
                                            <button
                                                onClick={handleGenerateExcalidrawDiagram}
                                                disabled={isGeneratingExcalidraw || rateLimitRemaining <= 0}
                                                title={rateLimitRemaining <= 0 ? 'Daily limit reached (2/day)' : 'Generate Excalidraw process flow overview'}
                                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                                                    rateLimitRemaining <= 0
                                                        ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                                        : diagramButtonStyles
                                                } ${isGeneratingExcalidraw ? 'opacity-75' : ''}`}
                                            >
                                                {isGeneratingExcalidraw ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                                <span>{isGeneratingExcalidraw ? 'Generating...' : `${diagramButton.icon} ${diagramButton.label}`}</span>
                                                {diagramButton.showBadge && diagramButton.badgeText && (
                                                    <span className="rounded-full bg-white/80 border border-current px-2 py-0.5 text-[10px] font-bold leading-none">
                                                        {diagramButton.badgeText}
                                                    </span>
                                                )}
                                                <span className="rounded-full bg-white/80 border border-current px-2 py-0.5 text-[10px] font-bold leading-none">
                                                    {rateLimitRemaining}/2 left
                                                </span>
                                            </button>
                                            <button
                                                onClick={() => setForceMockDiagram((prev) => !prev)}
                                                disabled={!excalidrawDiagram}
                                                title={!excalidrawDiagram ? 'Generate diagram first' : forceMockDiagram ? 'Switch to real Excalidraw renderer' : 'Force mock SVG renderer'}
                                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                                                    !excalidrawDiagram
                                                        ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                                        : forceMockDiagram
                                                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'
                                                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200'
                                                }`}
                                            >
                                                <Layers size={14} />
                                                <span>{getDiagramModeLabel(forceMockDiagram)}</span>
                                            </button>
                                            <span
                                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                                                    quotaTone === 'exhausted'
                                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                }`}
                                                title="Excalidraw API quota status"
                                            >
                                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${quotaTone === 'exhausted' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                <span>API Quota: {rateLimitRemaining}/2</span>
                                            </span>
                                            <button
                                                onClick={handleCopy}
                                                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold transition shadow-sm"
                                            >
                                                {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                                <span>{isCopied ? 'Copied!' : 'Copy JSON'}</span>
                                            </button>
                                            <button
                                                onClick={loadDemo3TierArchitecture}
                                                title="Load demo 3-tier web architecture from gemini_to_excalidraw.py"
                                                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition shadow-sm"
                                            >
                                                <Sparkles size={14} />
                                                <span>Demo: 3-Tier Arch</span>
                                            </button>
                                            </div>
                                        </div>

                                        {(isGeneratingExcalidraw || lastCompletedMs !== null || lastErrorStep !== null) && (
                                            <div className={`mb-4 rounded-xl border p-4 ${lastErrorStep ? 'border-rose-200 bg-rose-50' : 'border-indigo-200 bg-indigo-50'}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className={`text-sm font-semibold ${lastErrorStep ? 'text-rose-800' : 'text-indigo-800'}`}>
                                                        Visualization generation progress
                                                    </p>
                                                    {isGeneratingExcalidraw ? (
                                                        <Loader2 size={14} className="animate-spin text-indigo-600" />
                                                    ) : (
                                                        <Check size={14} className={`${lastErrorStep ? 'text-rose-600' : 'text-emerald-600'}`} />
                                                    )}
                                                </div>

                                                <div className="mb-2">
                                                    <div className="w-full h-2 rounded-full bg-white/70 border border-slate-200 overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-300 ${lastErrorStep ? 'bg-rose-500' : 'bg-indigo-500'}`}
                                                            style={{ width: `${Math.max(0, Math.min(((activeProgressStep + 1) / VISUALIZATION_STEPS.length) * 100, 100))}%` }}
                                                        />
                                                    </div>
                                                    <div className="mt-1 text-[11px] text-slate-600 font-semibold">
                                                        {Math.round(Math.max(0, Math.min(((activeProgressStep + 1) / VISUALIZATION_STEPS.length) * 100, 100)))}%
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    {VISUALIZATION_STEPS.map((step, idx) => (
                                                        <div
                                                            key={step}
                                                            className={`text-xs ${idx <= activeProgressStep ? 'text-indigo-800 font-medium' : 'text-slate-400'}`}
                                                        >
                                                            {idx <= activeProgressStep ? '•' : '○'} {step}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-2 flex items-center justify-between text-[11px]">
                                                    <span className={`font-semibold ${progressMode === 'live' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                        Mode: {progressMode === 'live' ? 'Live stream' : 'Fallback'}
                                                    </span>
                                                    <span className="text-indigo-700 font-semibold">
                                                        Elapsed: {(progressElapsedMs / 1000).toFixed(1)}s
                                                    </span>
                                                </div>

                                                {!isGeneratingExcalidraw && lastCompletedMs !== null && !lastErrorStep && (
                                                    <p className="text-[11px] text-emerald-700 mt-1 font-semibold">
                                                        Completed in {(lastCompletedMs / 1000).toFixed(1)}s
                                                    </p>
                                                )}

                                                {lastErrorStep && (
                                                    <p className="text-[11px] text-rose-700 mt-1 font-semibold">
                                                        Last error step: {lastErrorStep}
                                                    </p>
                                                )}

                                                <div className="mt-2 space-y-1">
                                                    {startedAtMs !== null && (
                                                        <p className="text-[11px] text-slate-600 font-medium">
                                                            Started: {formatTimestamp(startedAtMs)}
                                                        </p>
                                                    )}
                                                    {finishedAtMs !== null && (
                                                        <p className="text-[11px] text-slate-600 font-medium">
                                                            Finished: {formatTimestamp(finishedAtMs)}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="mt-3 flex gap-2">
                                                    <button
                                                        onClick={clearProgress}
                                                        className="flex-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-300"
                                                    >
                                                        Clear Progress
                                                    </button>
                                                </div>

                                                <p className={`text-[11px] mt-2 ${lastErrorStep ? 'text-rose-700' : 'text-indigo-700'}`}>
                                                    กระบวนการนี้อาจใช้เวลาหลายวินาที ขึ้นกับความซับซ้อนของ spec และการสร้าง scene
                                                </p>
                                            </div>
                                        )}

                                        {/* View: Document Format */}
                                        {activeTab === 'document' && (
                                            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm prose prose-slate max-w-none">
                                                <h1 className="text-2xl font-extrabold text-slate-900 border-b border-slate-100 pb-4 mb-6">
                                                    🏗️ {generatedData.project_name}
                                                </h1>

                                                <div className="inline-block bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-8">
                                                    Status: {generatedData.status}
                                                </div>

                                                <h3 className="text-lg font-bold text-slate-800 flex items-center mb-3">
                                                    <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded flex items-center justify-center text-sm mr-2">1</span>
                                                    Problem Statement
                                                </h3>
                                                <p className="text-slate-600 mb-8 leading-relaxed">{generatedData.problem_statement}</p>

                                                <h3 className="text-lg font-bold text-slate-800 flex items-center mb-3">
                                                    <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded flex items-center justify-center text-sm mr-2">2</span>
                                                    Solution Overview
                                                </h3>
                                                <p className="text-slate-600 mb-8 leading-relaxed">{generatedData.solution_overview}</p>

                                                <h3 className="text-lg font-bold text-slate-800 flex items-center mb-3">
                                                    <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded flex items-center justify-center text-sm mr-2">3</span>
                                                    Functional Requirements
                                                </h3>
                                                <ul className="space-y-2 mb-8 text-slate-600">
                                                    {generatedData.functional_requirements.map((req, i) => (
                                                        <li key={i} className="flex items-start">
                                                            <ChevronRight size={16} className="mt-1 mr-2 text-blue-500 shrink-0" />
                                                            <span>{req}</span>
                                                        </li>
                                                    ))}
                                                </ul>

                                                <h3 className="text-lg font-bold text-slate-800 flex items-center mb-3">
                                                    <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded flex items-center justify-center text-sm mr-2">4</span>
                                                    Non-Functional Requirements
                                                </h3>
                                                <ul className="space-y-2 mb-8 text-slate-600">
                                                    {generatedData.non_functional_requirements.map((req, i) => (
                                                        <li key={i} className="flex items-start">
                                                            <ChevronRight size={16} className="mt-1 mr-2 text-amber-500 shrink-0" />
                                                            <span>{req}</span>
                                                        </li>
                                                    ))}
                                                </ul>

                                                <h3 className="text-lg font-bold text-slate-800 flex items-center mb-3">
                                                    <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded flex items-center justify-center text-sm mr-2">5</span>
                                                    Tech Stack Recommendation
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {generatedData.tech_stack_recommendation.map((tech, i) => (
                                                        <span key={i} className="bg-slate-800 text-slate-100 px-3 py-1.5 rounded-md font-mono text-sm">
                                                            {tech}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* View: JSON Format */}
                                        {activeTab === 'json' && (
                                            <div className="bg-slate-900 rounded-xl p-6 shadow-sm overflow-x-auto relative">
                                                <pre className="font-mono text-sm text-emerald-400">
                                                    <code>{JSON.stringify(generatedData, null, 2)}</code>
                                                </pre>
                                            </div>
                                        )}

                                        {/* Diagram Viewer */}
                                        {currentVizJson && (
                                            <ProcessDiagramViewer
                                                mermaidCode={currentVizJson}
                                                isLoading={isGeneratingViz}
                                                error={vizError ?? undefined}
                                                onRegenerate={handleGenerateMermaidDiagram}
                                            />
                                        )}

                                        <div className="mt-6 bg-white border border-slate-200 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-semibold text-slate-800">🎨 Visualization</h4>
                                                <span className="text-[11px] text-slate-500">Auto-load from saved spec</span>
                                            </div>

                                            {isGeneratingExcalidraw ? (
                                                <ProcessDiagramViewer
                                                    excalidrawJson={excalidrawDiagram ?? undefined}
                                                    isLoading={true}
                                                    onRegenerate={handleGenerateExcalidrawDiagram}
                                                    forceMockDisplay={forceMockDiagram}
                                                />
                                            ) : excalidrawError ? (
                                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                                    <p className="text-sm text-amber-800 font-semibold">Visualization render issue</p>
                                                    <p className="text-xs text-amber-700 mt-1">{excalidrawError}</p>
                                                    {excalidrawDiagram && (
                                                        <div className="mt-3 bg-slate-900 rounded-lg p-3 overflow-x-auto">
                                                            <p className="text-[11px] text-slate-300 mb-2">Fallback JSON</p>
                                                            <pre className="font-mono text-xs text-emerald-400">
                                                                <code>{JSON.stringify(excalidrawDiagram, null, 2)}</code>
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : !excalidrawDiagram ? (
                                                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                                                    <p className="text-sm font-medium text-slate-700">คุณยังไม่ได้ generate visualization สำหรับ spec นี้</p>
                                                    <p className="text-xs text-slate-500 mt-1">กดปุ่ม Generate Diagram เพื่อสร้างและบันทึกลง Database/JSON</p>
                                                </div>
                                            ) : canRenderLoadedVisualization ? (
                                                <EditableExcalidrawCanvas
                                                    initialData={excalidrawDiagram as Record<string, unknown>}
                                                    onSave={handleSaveExcalidrawDiagram}
                                                    isSaving={isSavingDiagram}
                                                />
                                            ) : (
                                                <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                                                    <p className="text-sm text-indigo-800 font-semibold">Render ไม่สำเร็จ — แสดง JSON แทน</p>
                                                    <p className="text-xs text-indigo-700 mt-1">ข้อมูล visualization ถูกโหลดแล้ว แต่ยังไม่ผ่านเงื่อนไข render ของ canvas</p>
                                                    <div className="mt-3 bg-slate-900 rounded-lg p-3 overflow-x-auto">
                                                        <pre className="font-mono text-xs text-emerald-400">
                                                            <code>{JSON.stringify(excalidrawDiagram, null, 2)}</code>
                                                        </pre>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            </div>

            {/* Login Modal */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onLogin={(provider) => {
                    // Handle OAuth signin - redirect to auth provider
                    window.location.href = `/api/auth/signin/${provider}`;
                }}
            />
        </div>
    );
}
