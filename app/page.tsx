"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  GitBranch,
  Code2,
  FileText,
  Layers,
  CheckSquare,
  ExternalLink,
  PlusCircle,
  Search,
  User,
  ArrowRight,
  Database,
  Cpu,
  Share2,
  Github,
  Mail,
  LogOut,
  X,
  Plus,
  Calendar,
  Award,
  GitCommit,
  Edit3,
  Send,
  Link as LinkIcon,
  Image as ImageIcon,
  Trash2,
  Save,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Shield,
  Zap,
  Lock,
  List,
  Target,
  Users,
  Box,
  CheckCircle
} from 'lucide-react';

// --- Extend Window Interface for Mermaid ---
declare global {
  interface Window {
    mermaid?: {
      initialize: (config: Record<string, unknown>) => void;
      contentLoaded: () => void;
    };
  }
}

// --- Types & Interfaces ---

type ArtifactType = 'requirement' | 'diagram' | 'testing' | 'ui';
type ArtifactFormat = 'text' | 'mermaid' | 'structured';

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  role: 'student' | 'volunteer' | 'business';
  provider: 'google' | 'github';
  bio?: string;
  joinedDate?: string;
}

interface ExternalResource {
  title: string;
  url: string;
}

interface StandardSectionsData {
  title?: string;
  version?: string;
  problem?: string;
  goal?: string;
  inScope?: string[];
  outScope?: string[];
  users?: string[];
  systemActors?: string[];
  features?: string[];
  userStories?: string[];
  performance?: string;
  security?: string;
  reliability?: string;
  techConstraints?: string[];
  bizConstraints?: string[];
  assumptions?: string[];
  dependencies?: string[];
  definitionOfDone?: string[];
}

// Structured Data Types for Granular Requirements
interface SectionField {
  id: string;
  label: string;
  value: string | string[];
  inputType: 'text' | 'textarea' | 'list';
  placeholder?: string;
}

interface RequirementSection {
  id: string;
  title: string;
  icon?: React.ReactNode;
  fields: SectionField[];
  isExpanded?: boolean;
}

interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  contentFormat?: ArtifactFormat;
  structuredContent?: RequirementSection[];
  imageUrl?: string;
  externalLinks?: ExternalResource[];
}

interface Implementation {
  language: string;
  repoUrl: string;
  description: string;
}

interface Version {
  versionNumber: string;
  label: string;
  description: string;
  artifacts: Artifact[];
  implementations: Implementation[];
}

interface Project {
  id: string;
  title: string;
  summary: string;
  author: string;
  tags: string[];
  versions: Version[];
  references?: ExternalResource[];
}

interface Contribution {
  id: string;
  projectTitle: string;
  action: string;
  date: string;
  type: 'artifact' | 'code' | 'review';
}

// --- Standard SE Template Generator ---

const generateStandardSections = (data?: StandardSectionsData): RequirementSection[] => [
  {
    id: 'sec-1',
    title: '1. Project Information (ข้อมูลทั่วไป)',
    icon: <BookOpen size={18} />,
    isExpanded: true,
    fields: [
      { id: 'f-1-1', label: 'Project Name', value: data?.title || '', inputType: 'text', placeholder: 'Enter project name' },
      { id: 'f-1-2', label: 'Version', value: data?.version || '0.1 (Draft)', inputType: 'text', placeholder: 'e.g. 1.0.0' },
      { id: 'f-1-3', label: 'Last Updated', value: new Date().toLocaleDateString(), inputType: 'text' },
    ]
  },
  {
    id: 'sec-2',
    title: '2. Problem Statement (ที่มาและความสำคัญ)',
    icon: <AlertCircle size={18} />,
    isExpanded: true,
    fields: [
      { id: 'f-2-1', label: 'Current Problem', value: data?.problem || '', inputType: 'textarea', placeholder: 'Describe the pain point...' },
      { id: 'f-2-2', label: 'Business Goal / Objective', value: data?.goal || '', inputType: 'textarea', placeholder: 'What is the main goal?' },
    ]
  },
  {
    id: 'sec-3',
    title: '3. Project Scope (ขอบเขตงาน)',
    icon: <Target size={18} />,
    isExpanded: false,
    fields: [
      { id: 'f-3-1', label: 'In-Scope', value: data?.inScope || [], inputType: 'list', placeholder: 'Add in-scope item' },
      { id: 'f-3-2', label: 'Out-of-Scope', value: data?.outScope || [], inputType: 'list', placeholder: 'Add out-of-scope item' },
    ]
  },
  {
    id: 'sec-4',
    title: '4. Stakeholders & Actors (ผู้เกี่ยวข้อง)',
    icon: <Users size={18} />,
    isExpanded: false,
    fields: [
      { id: 'f-4-1', label: 'User Personas', value: data?.users || [], inputType: 'list', placeholder: 'Add user persona' },
      { id: 'f-4-2', label: 'System Actors', value: data?.systemActors || [], inputType: 'list', placeholder: 'e.g. Admin, 3rd Party API' },
    ]
  },
  {
    id: 'sec-5',
    title: '5. Functional Requirements (ฟังก์ชันการทำงาน)',
    icon: <Zap size={18} />,
    isExpanded: false,
    fields: [
      { id: 'f-5-1', label: 'Features List', value: data?.features || [], inputType: 'list', placeholder: 'Add feature' },
      { id: 'f-5-2', label: 'User Stories', value: data?.userStories || [], inputType: 'list', placeholder: 'As a [user], I want to...' },
    ]
  },
  {
    id: 'sec-6',
    title: '6. Non-Functional Requirements (คุณสมบัติเชิงคุณภาพ)',
    icon: <Shield size={18} />,
    isExpanded: false,
    fields: [
      { id: 'f-6-1', label: 'Performance', value: data?.performance || '', inputType: 'text', placeholder: 'e.g. < 2s response time' },
      { id: 'f-6-2', label: 'Security', value: data?.security || '', inputType: 'text', placeholder: 'e.g. OAuth2, Encryption' },
      { id: 'f-6-3', label: 'Reliability', value: data?.reliability || '', inputType: 'text', placeholder: 'e.g. 99.9% Uptime' },
    ]
  },
  {
    id: 'sec-7',
    title: '7. Constraints (ข้อจำกัด)',
    icon: <Lock size={18} />,
    isExpanded: false,
    fields: [
      { id: 'f-7-1', label: 'Technical Constraints', value: data?.techConstraints || [], inputType: 'list', placeholder: 'e.g. Tech Stack' },
      { id: 'f-7-2', label: 'Business Constraints', value: data?.bizConstraints || [], inputType: 'list', placeholder: 'e.g. Budget, Timeline' },
    ]
  },
  {
    id: 'sec-8',
    title: '8. Assumptions & Dependencies',
    icon: <Box size={18} />,
    isExpanded: false,
    fields: [
      { id: 'f-8-1', label: 'Assumptions', value: data?.assumptions || [], inputType: 'list', placeholder: 'Add assumption' },
      { id: 'f-8-2', label: 'Dependencies', value: data?.dependencies || [], inputType: 'list', placeholder: 'Add dependency' },
    ]
  },
  {
    id: 'sec-9',
    title: '9. Acceptance Criteria',
    icon: <CheckCircle size={18} />,
    isExpanded: false,
    fields: [
      { id: 'f-9-1', label: 'Definition of Done', value: data?.definitionOfDone || [], inputType: 'list', placeholder: 'Criteria for completion' },
    ]
  }
];

// --- Initial Mock Data ---

const INITIAL_PROJECTS: Project[] = [
  {
    id: '0',
    title: 'The Blueprint Hub (Official)',
    summary: 'แพลตฟอร์ม Open Source สำหรับรวบรวม Software Requirements และ Architecture เพื่อแก้ปัญหา "มี Code แต่ไม่มี Docs"',
    author: 'Blueprint_Core_Team',
    tags: ['Platform', 'React', 'Education', 'Social Impact'],
    references: [
      { title: 'Inspiration: GitHub', url: 'https://github.com' },
      { title: 'Concept: Open Design', url: '#' }
    ],
    versions: [
      {
        versionNumber: '0.1',
        label: 'Concept Prototype',
        description: 'Interactive Mockup ที่เน้นทดสอบ User Journey',
        artifacts: [
          {
            id: 'bp1',
            type: 'requirement',
            title: 'Standard Software Requirement Specification (SRS)',
            content: '',
            contentFormat: 'structured',
            structuredContent: generateStandardSections({
              title: 'The Blueprint Hub (Official)',
              problem: 'Software product ปัจจุบันขาดเอกสาร (Documentation Debt) ทำให้ยากต่อการพัฒนาต่อ และ Source Code มักผูกติดกับภาษาใดภาษาหนึ่งมากเกินไป',
              goal: 'สร้าง Knowledge Base ที่คนรุ่นหลังสามารถนำไปพัฒนาต่อได้ทันที',
              users: ['Student (CS/SE)', 'Volunteer', 'Business Owner'],
              features: ['ระบบ Version Control สำหรับเอกสาร', 'Template มาตรฐานสำหรับ SRS', 'ระบบ Suggest Edit สำหรับ Volunteers'],
              techConstraints: ['Frontend: React/Next.js', 'Database: Firestore (Mock first)'],
              inScope: ['ระบบเก็บ Document', 'ระบบ Versioning'],
              outScope: ['Code Compiler', 'Project Management (Jira-like features)']
            })
          },
          {
            id: 'bp3',
            type: 'diagram',
            title: 'System Context Diagram',
            content: `graph LR
    User -->|Uses| BlueprintHub
    BlueprintHub -->|Links to| ExternalRepos
    Volunteer -->|Contributes| BlueprintHub
    style BlueprintHub fill:#e1f5fe,stroke:#01579b,stroke-width:2px`,
            contentFormat: 'mermaid'
          }
        ],
        implementations: [
          { language: 'React + TS', repoUrl: '#', description: 'Current Prototype' }
        ]
      }
    ]
  }
];

const MOCK_CONTRIBUTIONS: Contribution[] = [
  { id: 'c1', projectTitle: 'E-Commerce Inventory', action: 'Refined ER Diagram', date: '2023-10-15', type: 'artifact' },
  { id: 'c2', projectTitle: 'Basic Calculator', action: 'Added Unit Tests', date: '2023-10-20', type: 'code' },
  { id: 'c3', projectTitle: 'The Blueprint Hub', action: 'Added NFRs', date: '2023-11-01', type: 'review' },
];

// --- Components ---

const LoginModal = ({ isOpen, onClose, onLogin }: { isOpen: boolean; onClose: () => void; onLogin: (provider: 'google' | 'github') => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 relative transform transition-all scale-100">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition">
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 ring-4 ring-blue-50">
            <User size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
          <p className="text-slate-500 mt-2 text-sm">Sign in to share your ideas or contribute code</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onLogin('google')}
            className="w-full flex items-center justify-center space-x-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition font-medium text-slate-700 bg-white"
          >
            <Mail size={20} className="text-red-500" />
            <span>Continue with Google</span>
          </button>
          <button
            onClick={() => onLogin('github')}
            className="w-full flex items-center justify-center space-x-3 p-3 bg-[#24292e] text-white rounded-xl hover:bg-[#2f363d] transition font-medium shadow-md"
          >
            <Github size={20} />
            <span>Continue with GitHub</span>
          </button>
        </div>

        <p className="text-xs text-center text-slate-400 mt-6">
          Note: Logs in as `Blueprint_Core_Team` to test editing.
        </p>
      </div>
    </div>
  );
};

const SectionEditorModal = ({
  isOpen,
  onClose,
  section,
  onSubmit
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
    setFields(fields.map(f => f.id === id ? { ...f, value } : f));
  };

  const handleListChange = (id: string, idx: number, val: string) => {
    const field = fields.find(f => f.id === id);
    if (field && Array.isArray(field.value)) {
      const newList = [...field.value];
      newList[idx] = val;
      handleFieldChange(id, newList);
    }
  };

  const addListItem = (id: string) => {
    const field = fields.find(f => f.id === id);
    if (field && Array.isArray(field.value)) {
      handleFieldChange(id, [...field.value, '']);
    }
  };

  const removeListItem = (id: string, idx: number) => {
    const field = fields.find(f => f.id === id);
    if (field && Array.isArray(field.value)) {
      const newList = [...field.value];
      newList.splice(idx, 1);
      handleFieldChange(id, newList);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 relative flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <h3 className="text-xl font-bold text-slate-800">Edit Section: <span className="text-blue-600">{section.title}</span></h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="flex-grow overflow-y-auto space-y-5 px-1">
          {fields.map(field => (
            <div key={field.id}>
              <label className="block text-sm font-bold text-slate-700 mb-2">{field.label}</label>

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
                        className="flex-grow p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={item}
                        onChange={(e) => handleListChange(field.id, idx, e.target.value)}
                      />
                      <button onClick={() => removeListItem(field.id, idx)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
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
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium">Cancel</button>
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

const Navbar = ({
  onViewChange,
  user,
  onLoginClick,
  onLogoutClick
}: {
  onViewChange: (view: 'home' | 'project' | 'request' | 'profile') => void;
  user: UserProfile | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}) => (
  <nav className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
    <div className="container mx-auto flex justify-between items-center">
      <div className="flex items-center space-x-2 cursor-pointer" onClick={() => onViewChange('home')}>
        <Layers className="text-blue-400" size={28} />
        <span className="text-xl font-bold tracking-tight">Blueprint<span className="text-blue-400">Hub</span></span>
      </div>
      <div className="flex items-center space-x-6">
        <button onClick={() => onViewChange('home')} className="hover:text-blue-300 transition text-sm font-medium">Explore</button>

        <button
          onClick={() => user ? onViewChange('request') : onLoginClick()}
          className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition font-medium text-sm shadow-lg shadow-blue-900/20"
        >
          <PlusCircle size={18} />
          <span>Post Idea</span>
        </button>

        {user ? (
          <div className="flex items-center space-x-4 pl-4 border-l border-slate-700">
            <div
              className="flex items-center space-x-3 group cursor-pointer relative"
              onClick={() => onViewChange('profile')}
            >
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-slate-200 group-hover:text-white">{user.name}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{user.role}</p>
              </div>
              <img src={user.avatar} alt="Profile" className="w-9 h-9 rounded-full border-2 border-slate-700 group-hover:border-blue-400 transition" />
            </div>
            <button
              onClick={onLogoutClick}
              className="text-slate-400 hover:text-red-400 transition"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="text-sm font-medium text-slate-300 hover:text-white transition px-3 py-2 rounded hover:bg-slate-800"
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  </nav>
);

const ProjectCard = ({ project, onClick }: { project: Project; onClick: () => void }) => (
  <div onClick={onClick} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition cursor-pointer p-6 flex flex-col h-full group">
    <div className="flex justify-between items-start mb-4">
      <div className="flex space-x-2">
        {project.tags.map(tag => (
          <span key={tag} className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-full">{tag}</span>
        ))}
      </div>
      <span className="text-xs text-slate-400 flex items-center">
        <GitBranch size={12} className="mr-1" />
        {project.versions.length} versions
      </span>
    </div>
    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition">{project.title}</h3>
    <p className="text-slate-500 text-sm mb-6 flex-grow">{project.summary}</p>

    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
      <span className="text-xs text-slate-400">By {project.author}</span>
      <span className="text-blue-600 text-sm font-medium flex items-center">
        View Blueprint <ArrowRight size={16} className="ml-1" />
      </span>
    </div>
  </div>
);

// --- Structured Requirement Viewer ---

const RequirementViewer = ({
  sections,
  isOwner,
  onUpdateSection
}: {
  sections: RequirementSection[];
  isOwner: boolean;
  onUpdateSection: (section: RequirementSection) => void;
}) => {
  const [localSections, setLocalSections] = useState(sections);
  const [editingSection, setEditingSection] = useState<RequirementSection | null>(null);

  useEffect(() => {
    setLocalSections(sections);
  }, [sections]);

  const toggleSection = (id: string) => {
    setLocalSections(prev => prev.map(s => s.id === id ? { ...s, isExpanded: !s.isExpanded } : s));
  };

  const handleEditClick = (section: RequirementSection, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSection(section);
  };

  return (
    <div className="space-y-4">
      {localSections.map((section) => (
        <div key={section.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:border-blue-200 transition">
          <div
            className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition ${section.isExpanded ? 'border-b border-slate-100' : ''}`}
            onClick={() => toggleSection(section.id)}
          >
            <div className="flex items-center space-x-3 font-bold text-slate-800">
              <div className={`text-slate-400 transition-transform duration-200 ${section.isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                <ChevronDown size={18} />
              </div>
              <span className="text-blue-600">{section.icon}</span>
              <span>{section.title}</span>
            </div>
            {isOwner && (
              <button
                onClick={(e) => handleEditClick(section, e)}
                className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-slate-500 bg-slate-100 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                title="Edit this section"
              >
                <Edit3 size={14} />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
          </div>

          {section.isExpanded && (
            <div className="p-5 bg-slate-50/50 space-y-4 animate-in slide-in-from-top-1 duration-200">
              {section.fields.map(field => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                  <div className="text-sm font-semibold text-slate-600 md:text-right pt-1">{field.label}</div>
                  <div className="md:col-span-3 text-sm text-slate-800">
                    {Array.isArray(field.value) ? (
                      field.value.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 pl-2">
                          {field.value.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      ) : <span className="text-slate-400 italic">Not specified</span>
                    ) : (
                      field.value ? <p className="whitespace-pre-wrap">{field.value}</p> : <span className="text-slate-400 italic">Not specified</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {editingSection && (
        <SectionEditorModal
          isOpen={true}
          onClose={() => setEditingSection(null)}
          section={editingSection}
          onSubmit={(updated) => {
            onUpdateSection(updated);
            setEditingSection(null);
          }}
        />
      )}
    </div>
  );
};

const MermaidDiagram = ({ code }: { code: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    
    initializedRef.current = true;

    if (!window.mermaid) {
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js";
      script.onload = () => {
        if (window.mermaid) {
          window.mermaid.initialize({ startOnLoad: true, theme: 'default' });
        }
        setIsLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      setTimeout(() => setIsLoaded(true), 0);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && containerRef.current && window.mermaid) {
      containerRef.current.innerHTML = `<div class="mermaid">${code}</div>`;
      try { window.mermaid.contentLoaded(); } catch (e) { }
    }
  }, [isLoaded, code]);

  return (
    <div className="w-full overflow-x-auto bg-white p-4 rounded-lg border border-slate-100 flex justify-center min-h-[100px]" ref={containerRef}>
      <div className="animate-pulse flex space-x-4 w-full justify-center opacity-50">Loading Diagram...</div>
    </div>
  );
};

const ArtifactViewer = ({
  artifact,
  isOwner,
  onAction,
  onUpdateStructuredSection
}: {
  artifact: Artifact;
  isOwner: boolean;
  onAction: (artifact: Artifact, mode: 'edit' | 'suggest') => void;
  onUpdateStructuredSection?: (updatedSection: RequirementSection) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (artifact.contentFormat === 'structured' && artifact.structuredContent) {
    return (
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4 border-b border-slate-200 pb-2">
          <div className="bg-orange-100 p-2 rounded-lg">
            <FileText className="text-orange-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{artifact.title}</h2>
            <p className="text-xs text-slate-500">Comprehensive Software Requirements Specification</p>
          </div>
        </div>
        <RequirementViewer
          sections={artifact.structuredContent}
          isOwner={isOwner}
          onUpdateSection={(updated) => onUpdateStructuredSection && onUpdateStructuredSection(updated)}
        />
      </div>
    );
  }

  const getIcon = () => {
    switch (artifact.type) {
      case 'requirement': return <FileText className="text-orange-500" />;
      case 'diagram': return <Database className="text-purple-500" />;
      case 'testing': return <CheckSquare className="text-green-500" />;
      default: return <BookOpen />;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg mb-4 overflow-hidden shadow-sm hover:border-blue-200 transition">
      <div
        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition ${isExpanded ? 'border-b border-slate-100' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3 select-none">
          <div className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
            <ChevronDown size={20} />
          </div>
          {getIcon()}
          <h4 className="font-bold text-slate-800">{artifact.title}</h4>
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {artifact.type}
          </span>
        </div>

        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
          {isOwner && artifact.contentFormat !== 'structured' && (
            <button
              onClick={() => onAction(artifact, 'edit')}
              className="p-2 text-slate-400 hover:text-green-600 rounded-full hover:bg-green-50 transition"
            >
              <Edit3 size={16} />
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 bg-white animate-in slide-in-from-top-2 duration-200">
          {artifact.externalLinks && (
            <div className="flex flex-wrap gap-2 mb-4">
              {artifact.externalLinks.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="flex items-center space-x-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full hover:bg-blue-100 transition">
                  <ExternalLink size={12} /><span>{link.title}</span>
                </a>
              ))}
            </div>
          )}
          {artifact.contentFormat === 'mermaid' ? (
            <div className="relative">
              <MermaidDiagram code={artifact.content} />
            </div>
          ) : (
            <div className="prose prose-sm text-slate-600 whitespace-pre-line">{artifact.content}</div>
          )}
        </div>
      )}
    </div>
  );
};

const ActivityHeatmap = () => {
  const [days, setDays] = useState<number[]>(() =>
    Array.from({ length: 150 }, (_, i) => {
      const level = Math.random() > 0.7 ? Math.floor(Math.random() * 4) + 1 : 0;
      return level;
    })
  );

  const getColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-200';
      case 2: return 'bg-green-300';
      case 3: return 'bg-green-400';
      case 4: return 'bg-green-600';
      default: return 'bg-slate-100';
    }
  };

  return (
    <div className="w-full overflow-hidden">
      <div className="flex flex-wrap gap-1">
        {days.map((level, idx) => (
          <div
            key={idx}
            className={`w-3 h-3 rounded-sm ${getColor(level)} hover:ring-1 ring-slate-400 transition`}
            title={`Activity Level: ${level}`}
          ></div>
        ))}
      </div>
      <div className="flex items-center justify-end mt-2 space-x-2 text-xs text-slate-400">
        <span>Less</span>
        <div className="w-2 h-2 bg-slate-100 rounded-sm"></div>
        <div className="w-2 h-2 bg-green-200 rounded-sm"></div>
        <div className="w-2 h-2 bg-green-400 rounded-sm"></div>
        <div className="w-2 h-2 bg-green-600 rounded-sm"></div>
        <span>More</span>
      </div>
    </div>
  );
};

const UserProfileView = ({ user, projects, onBack }: { user: UserProfile, projects: Project[], onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'contributions'>('posts');
  const myProjects = projects.filter(p => p.author === user.name);
  const contributions = MOCK_CONTRIBUTIONS;

  return (
    <div className="max-w-5xl mx-auto p-4 animate-in fade-in duration-300">
      <button onClick={onBack} className="mb-6 text-slate-500 hover:text-slate-800 flex items-center font-medium">
        <ArrowRight className="rotate-180 mr-2" size={18} /> Back to Home
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6 flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-shrink-0">
          <img src={user.avatar} alt={user.name} className="w-32 h-32 rounded-full border-4 border-white shadow-lg" />
        </div>
        <div className="flex-grow">
          <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
          <div className="flex items-center space-x-3 mt-2 text-slate-500">
            <span className="flex items-center"><User size={16} className="mr-1" /> {user.role}</span>
            <span>•</span>
            <span className="flex items-center"><Calendar size={16} className="mr-1" /> Joined {user.joinedDate || 'Oct 2023'}</span>
          </div>
          <p className="mt-4 text-slate-600 max-w-2xl">{user.bio || "Passionate about building scalable software and helping others learn. Currently focusing on System Design."}</p>

          <div className="mt-6 flex space-x-4">
            <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
              <span className="block text-2xl font-bold text-blue-600">{myProjects.length}</span>
              <span className="text-xs text-slate-500 uppercase font-semibold">Blueprints</span>
            </div>
            <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
              <span className="block text-2xl font-bold text-green-600">{contributions.length + 12}</span>
              <span className="text-xs text-slate-500 uppercase font-semibold">Contributions</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center">
          <GitCommit size={16} className="mr-2" /> Contribution Activity (Last Year)
        </h3>
        <ActivityHeatmap />
      </div>

      <div className="mb-6 flex space-x-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('posts')}
          className={`pb-3 font-medium transition ${activeTab === 'posts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          My Blueprints ({myProjects.length})
        </button>
        <button
          onClick={() => setActiveTab('contributions')}
          className={`pb-3 font-medium transition ${activeTab === 'contributions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Contributions History
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === 'posts' ? (
          myProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myProjects.map(project => (
                <ProjectCard key={project.id} project={project} onClick={() => { }} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <FileText size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">You haven`t posted any blueprints yet.</p>
            </div>
          )
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {contributions.map(contrib => (
              <div key={contrib.id} className="p-4 flex items-start space-x-4 hover:bg-slate-50 transition">
                <div className={`p-2 rounded-lg ${contrib.type === 'artifact' ? 'bg-purple-100 text-purple-600' :
                    contrib.type === 'code' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                  {contrib.type === 'artifact' ? <Database size={20} /> :
                    contrib.type === 'code' ? <CheckSquare size={20} /> : <FileText size={20} />}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{contrib.action}</h4>
                  <p className="text-sm text-slate-500">on <span className="font-medium text-blue-600">{contrib.projectTitle}</span></p>
                  <p className="text-xs text-slate-400 mt-1">{contrib.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const BlueprintDetail = ({
  project,
  onBack,
  user,
  onLoginRequest,
  onUpdateArtifact
}: {
  project: Project;
  onBack: () => void;
  user: UserProfile | null;
  onLoginRequest: () => void;
  onUpdateArtifact: (artifact: Artifact) => void;
}) => {
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
  const currentVersion = project.versions[selectedVersionIndex];
  const [editingArtifact, setEditingArtifact] = useState<Artifact | null>(null);

  const handleUpdateStructuredSection = (artifact: Artifact, updatedSection: RequirementSection) => {
    if (!artifact.structuredContent) return;
    const updatedStructuredContent = artifact.structuredContent.map(s => s.id === updatedSection.id ? updatedSection : s);
    onUpdateArtifact({ ...artifact, structuredContent: updatedStructuredContent });
  };

  const isOwner = user?.name === project.author;

  return (
    <div className="max-w-6xl mx-auto p-6 animate-in fade-in duration-300">
      <button onClick={onBack} className="mb-6 text-slate-500 hover:text-slate-800 flex items-center font-medium">
        <ArrowRight className="rotate-180 mr-2" size={18} /> Back to Projects
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{project.title}</h1>
            <p className="text-slate-500 text-lg mb-4">{project.summary}</p>
            {project.references && (
              <div className="flex flex-wrap gap-2 mt-4">
                {project.references.map((ref, idx) => (
                  <a key={idx} href={ref.url} className="flex items-center space-x-1.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 px-3 py-1.5 rounded-lg transition" target="_blank" rel="noreferrer">
                    <LinkIcon size={14} /><span>{ref.title}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Select Blueprint Version</h3>
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {project.versions.map((v, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedVersionIndex(idx)}
                className={`flex-shrink-0 px-5 py-3 rounded-lg border-2 transition-all text-left min-w-[200px] ${idx === selectedVersionIndex ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-lg font-bold ${idx === selectedVersionIndex ? 'text-blue-700' : 'text-slate-700'}`}>V{v.versionNumber}</span>
                  {idx === selectedVersionIndex && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                </div>
                <p className="text-xs text-slate-500 font-medium">{v.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-slate-800">Engineering Artifacts</h2>
            <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">V{currentVersion.versionNumber} Scope</span>
          </div>

          {currentVersion.artifacts.map(art => (
            <ArtifactViewer
              key={art.id}
              artifact={art}
              isOwner={isOwner}
              onAction={() => setEditingArtifact(art)}
              onUpdateStructuredSection={(updated) => handleUpdateStructuredSection(art, updated)}
            />
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <div className="bg-slate-900 text-slate-100 rounded-xl p-6 shadow-lg">
              <div className="flex items-center space-x-2 mb-4 text-blue-300">
                <Code2 size={24} />
                <h3 className="text-lg font-bold">Implementations</h3>
              </div>
              <p className="text-sm text-slate-400 mb-6">Community implementations for this spec.</p>
              {currentVersion.implementations.length > 0 ? (
                <div className="space-y-3">
                  {currentVersion.implementations.map((impl, idx) => (
                    <a key={idx} href={impl.repoUrl} className="block bg-slate-800 hover:bg-slate-700 p-3 rounded-lg border border-slate-700 hover:border-blue-500 transition group">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-white group-hover:text-blue-300">{impl.language}</span>
                        <ExternalLink size={14} className="text-slate-500 group-hover:text-white" />
                      </div>
                      <p className="text-xs text-slate-400 truncate">{impl.description}</p>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-slate-800 rounded-lg border border-dashed border-slate-700">
                  <p className="text-slate-400 text-sm mb-2">No implementations yet</p>
                  <button onClick={onLoginRequest} className="text-blue-400 text-sm font-medium hover:underline">Submit implementation</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CreateRequestFormData {
  title: string;
  version: string;
  problem: string;
  goal: string;
  inScope: string[];
  outScope: string[];
  users: string[];
  systemActors: string[];
  features: string[];
  userStories: string[];
  performance: string;
  security: string;
  reliability: string;
  techConstraints: string[];
  bizConstraints: string[];
  assumptions: string[];
  dependencies: string[];
  definitionOfDone: string[];
}

const SectionHeader = ({ num, title, icon, activeSection, setActiveSection }: { num: number, title: string, icon: React.ReactNode, activeSection: number, setActiveSection: (num: number) => void }) => (
  <div
    onClick={() => setActiveSection(num)}
    className={`flex items-center justify-between p-4 cursor-pointer transition ${activeSection === num ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-white hover:bg-slate-50 border-l-4 border-transparent'}`}
  >
    <div className="flex items-center space-x-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${activeSection === num ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
        {num}
      </div>
      <div className="flex flex-col">
        <span className={`text-sm font-bold ${activeSection === num ? 'text-blue-800' : 'text-slate-700'}`}>{title}</span>
      </div>
    </div>
    <div className="text-slate-400">
      {icon}
    </div>
  </div>
);

const CreateRequest = ({ onCancel, user, onSubmit }: { onCancel: () => void; user: UserProfile | null; onSubmit: (data: CreateRequestFormData) => void }) => {
  const [formData, setFormData] = useState<CreateRequestFormData>({
    title: '',
    version: '0.1',
    problem: '',
    goal: '',
    inScope: [''],
    outScope: [''],
    users: [''],
    systemActors: [''],
    features: [''],
    userStories: [''],
    performance: '',
    security: '',
    reliability: '',
    techConstraints: [''],
    bizConstraints: [''],
    assumptions: [''],
    dependencies: [''],
    definitionOfDone: [''],
  });

  const [activeSection, setActiveSection] = useState(1);

  // Helper to handle array inputs
  const handleArrayChange = (field: keyof typeof formData, idx: number, value: string) => {
    const arr = [...(formData[field] as string[])];
    arr[idx] = value;
    setFormData({ ...formData, [field]: arr });
  };

  const addArrayItem = (field: keyof typeof formData) => {
    setFormData({ ...formData, [field]: [...(formData[field] as string[]), ''] });
  };

  const removeArrayItem = (field: keyof typeof formData, idx: number) => {
    const arr = [...(formData[field] as string[])];
    arr.splice(idx, 1);
    setFormData({ ...formData, [field]: arr });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.problem) {
      alert('Please fill in at least the Project Name and Problem Statement.');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Create New Requirement</h1>
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-800"><X size={24} /></button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-200">
          <SectionHeader num={1} title="Project Info" icon={<BookOpen size={16} />} activeSection={activeSection} setActiveSection={setActiveSection} />
          <SectionHeader num={2} title="Problem & Goal" icon={<AlertCircle size={16} />} activeSection={activeSection} setActiveSection={setActiveSection} />
          <SectionHeader num={3} title="Scope" icon={<Target size={16} />} activeSection={activeSection} setActiveSection={setActiveSection} />
          <SectionHeader num={4} title="Stakeholders" icon={<Users size={16} />} activeSection={activeSection} setActiveSection={setActiveSection} />
          <SectionHeader num={5} title="Functional Reqs" icon={<Zap size={16} />} activeSection={activeSection} setActiveSection={setActiveSection} />
          <SectionHeader num={6} title="Non-Functional" icon={<Shield size={16} />} activeSection={activeSection} setActiveSection={setActiveSection} />
          <SectionHeader num={7} title="Constraints" icon={<Lock size={16} />} activeSection={activeSection} setActiveSection={setActiveSection} />
          <SectionHeader num={8} title="Assumptions" icon={<Box size={16} />} activeSection={activeSection} setActiveSection={setActiveSection} />
          <SectionHeader num={9} title="Acceptance" icon={<CheckCircle size={16} />} activeSection={activeSection} setActiveSection={setActiveSection} />
        </div>

        {/* Form Content */}
        <div className="w-full md:w-2/3 p-6 max-h-[600px] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1 */}
            {activeSection === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="font-bold text-lg text-slate-800 mb-4">1. Project Information</h3>
                <div>
                  <label className="label">Project Name *</label>
                  <input type="text" className="input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Smart Queue" autoFocus />
                </div>
                <div>
                  <label className="label">Version</label>
                  <input type="text" className="input" value={formData.version} onChange={e => setFormData({ ...formData, version: e.target.value })} />
                </div>
              </div>
            )}

            {/* Section 2 */}
            {activeSection === 2 && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="font-bold text-lg text-slate-800 mb-4">2. Problem Statement</h3>
                <div>
                  <label className="label">Current Problem *</label>
                  <textarea className="textarea h-32" value={formData.problem} onChange={e => setFormData({ ...formData, problem: e.target.value })} placeholder="What is the pain point?" />
                </div>
                <div>
                  <label className="label">Business Goal</label>
                  <textarea className="textarea" value={formData.goal} onChange={e => setFormData({ ...formData, goal: e.target.value })} placeholder="What is the objective?" />
                </div>
              </div>
            )}

            {/* Section 3 - Scope */}
            {activeSection === 3 && (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="font-bold text-lg text-slate-800 mb-4">3. Project Scope</h3>
                <div>
                  <label className="label">In-Scope (What we will do)</label>
                  {formData.inScope.map((item, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input type="text" className="input" value={item} onChange={e => handleArrayChange('inScope', i, e.target.value)} />
                      <button type="button" onClick={() => removeArrayItem('inScope', i)}><Trash2 size={16} className="text-slate-400" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addArrayItem('inScope')} className="text-blue-600 text-sm font-medium">+ Add Item</button>
                </div>
                <div>
                  <label className="label">Out-of-Scope (What we won`t do)</label>
                  {formData.outScope.map((item, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input type="text" className="input" value={item} onChange={e => handleArrayChange('outScope', i, e.target.value)} />
                      <button type="button" onClick={() => removeArrayItem('outScope', i)}><Trash2 size={16} className="text-slate-400" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addArrayItem('outScope')} className="text-blue-600 text-sm font-medium">+ Add Item</button>
                </div>
              </div>
            )}

            {/* Section 4 - Stakeholders */}
            {activeSection === 4 && (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="font-bold text-lg text-slate-800 mb-4">4. Stakeholders</h3>
                <div>
                  <label className="label">User Personas</label>
                  {formData.users.map((item, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input type="text" className="input" value={item} onChange={e => handleArrayChange('users', i, e.target.value)} placeholder="e.g. Admin, Customer" />
                      <button type="button" onClick={() => removeArrayItem('users', i)}><Trash2 size={16} className="text-slate-400" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addArrayItem('users')} className="text-blue-600 text-sm font-medium">+ Add Persona</button>
                </div>
              </div>
            )}

            {/* Section 5 - Functional */}
            {activeSection === 5 && (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="font-bold text-lg text-slate-800 mb-4">5. Functional Requirements</h3>
                <div>
                  <label className="label">Features List</label>
                  {formData.features.map((item, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input type="text" className="input" value={item} onChange={e => handleArrayChange('features', i, e.target.value)} placeholder="e.g. User Login" />
                      <button type="button" onClick={() => removeArrayItem('features', i)}><Trash2 size={16} className="text-slate-400" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addArrayItem('features')} className="text-blue-600 text-sm font-medium">+ Add Feature</button>
                </div>
              </div>
            )}

            {/* Section 6 - NFRs */}
            {activeSection === 6 && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="font-bold text-lg text-slate-800 mb-4">6. Non-Functional Requirements</h3>
                <div>
                  <label className="label">Performance</label>
                  <input type="text" className="input" value={formData.performance} onChange={e => setFormData({ ...formData, performance: e.target.value })} placeholder="e.g. < 1s latency" />
                </div>
                <div>
                  <label className="label">Security</label>
                  <input type="text" className="input" value={formData.security} onChange={e => setFormData({ ...formData, security: e.target.value })} placeholder="e.g. AES-256 Encryption" />
                </div>
                <div>
                  <label className="label">Reliability</label>
                  <input type="text" className="input" value={formData.reliability} onChange={e => setFormData({ ...formData, reliability: e.target.value })} placeholder="e.g. 99.9% Uptime" />
                </div>
              </div>
            )}

            {/* Section 7 - Constraints */}
            {activeSection === 7 && (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="font-bold text-lg text-slate-800 mb-4">7. Constraints</h3>
                <div>
                  <label className="label">Technical Constraints</label>
                  {formData.techConstraints.map((item, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input type="text" className="input" value={item} onChange={e => handleArrayChange('techConstraints', i, e.target.value)} placeholder="e.g. Must use React" />
                      <button type="button" onClick={() => removeArrayItem('techConstraints', i)}><Trash2 size={16} className="text-slate-400" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addArrayItem('techConstraints')} className="text-blue-600 text-sm font-medium">+ Add Item</button>
                </div>
              </div>
            )}

            {/* Section 8 - Assumptions */}
            {activeSection === 8 && (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="font-bold text-lg text-slate-800 mb-4">8. Assumptions</h3>
                <div>
                  <label className="label">Assumptions</label>
                  {formData.assumptions.map((item, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input type="text" className="input" value={item} onChange={e => handleArrayChange('assumptions', i, e.target.value)} placeholder="e.g. Users have internet" />
                      <button type="button" onClick={() => removeArrayItem('assumptions', i)}><Trash2 size={16} className="text-slate-400" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addArrayItem('assumptions')} className="text-blue-600 text-sm font-medium">+ Add Item</button>
                </div>
              </div>
            )}

            {/* Section 9 - Acceptance */}
            {activeSection === 9 && (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="font-bold text-lg text-slate-800 mb-4">9. Acceptance Criteria</h3>
                <div>
                  <label className="label">Definition of Done</label>
                  {formData.definitionOfDone.map((item, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input type="text" className="input" value={item} onChange={e => handleArrayChange('definitionOfDone', i, e.target.value)} placeholder="e.g. All tests passed" />
                      <button type="button" onClick={() => removeArrayItem('definitionOfDone', i)}><Trash2 size={16} className="text-slate-400" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addArrayItem('definitionOfDone')} className="text-blue-600 text-sm font-medium">+ Add Criteria</button>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveSection(Math.max(1, activeSection - 1))}
                className={`px-4 py-2 rounded text-slate-600 font-medium ${activeSection === 1 ? 'invisible' : ''}`}
              >
                Previous
              </button>

              {activeSection < 9 ? (
                <button
                  type="button"
                  onClick={() => setActiveSection(Math.min(9, activeSection + 1))}
                  className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 shadow-lg"
                >
                  Create Blueprint
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* CSS Helper for compact inputs */}
      <style>{`
            .label { display: block; font-size: 0.875rem; font-weight: 600; color: #334155; margin-bottom: 0.5rem; }
            .input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; outline: none; transition: all; font-size: 0.875rem; }
            .input:focus { border-color: #3b82f6; ring: 2px solid #3b82f6; }
            .textarea { width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; outline: none; transition: all; font-size: 0.875rem; min-height: 80px; }
            .textarea:focus { border-color: #3b82f6; }
        `}</style>
    </div>
  );
};

// --- Main App Container ---

export default function App() {
  const [view, setView] = useState<'home' | 'project' | 'request' | 'profile'>('home');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // MOCK LOGIN: Forced to be 'Blueprint_Core_Team' to enable editing on demo project
  const handleLogin = (provider: 'google' | 'github') => {
    const mockUser: UserProfile = {
      id: 'u1',
      name: 'Blueprint_Core_Team', // Changed to match owner for editing test
      role: provider === 'google' ? 'student' : 'volunteer',
      provider: provider,
      joinedDate: 'Oct 15, 2023',
      avatar: `https://ui-avatars.com/api/?name=${provider === 'google' ? 'Alex' : 'Sarah'}&background=random`
    };
    setCurrentUser(mockUser);
    setIsLoginModalOpen(false);
  };

  const handleUpdateArtifact = (updatedArtifact: Artifact) => {
    if (!selectedProject) return;
    const updatedProjects = projects.map(p => {
      if (p.id === selectedProject.id) {
        const updatedVersions = p.versions.map(v => ({
          ...v,
          artifacts: v.artifacts.map(a => a.id === updatedArtifact.id ? updatedArtifact : a)
        }));
        return { ...p, versions: updatedVersions };
      }
      return p;
    });
    setProjects(updatedProjects);
    const updatedSelection = updatedProjects.find(p => p.id === selectedProject.id) || null;
    setSelectedProject(updatedSelection);
  };

  const handleCreateProject = (data: CreateRequestFormData) => {
    if (!currentUser) return;

    const standardSections = generateStandardSections(data);

    const newProject: Project = {
      id: Date.now().toString(),
      title: data.title,
      summary: data.problem,
      author: currentUser.name,
      tags: ['Idea Phase', 'Draft'],
      versions: [
        {
          versionNumber: data.version || '0.1',
          label: 'Idea Draft',
          description: 'Initial concept',
          artifacts: [
            {
              id: `req-${Date.now()}`,
              type: 'requirement',
              title: 'Standard Software Requirement Specification (SRS)',
              content: '',
              contentFormat: 'structured',
              structuredContent: standardSections
            }
          ],
          implementations: []
        }
      ]
    };

    setProjects([newProject, ...projects]);
    setView('home');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
      <Navbar
        onViewChange={(view: 'home' | 'project' | 'request' | 'profile') => setView(view)}
        user={currentUser}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onLogoutClick={() => { setCurrentUser(null); setView('home'); }}
      />

      <main className="container mx-auto py-8 px-4">
        {view === 'home' && (
          <div className="animate-in fade-in duration-500">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
                The Blueprint <span className="text-blue-600">Hub</span>
              </h1>
              <p className="text-lg text-slate-600">
                แหล่งรวม Software Architecture & Requirements สำหรับผู้เรียนและอาสาสมัคร
              </p>

              <div className="mt-8 relative max-w-lg mx-auto">
                <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-full bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search blueprints..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <ProjectCard key={project.id} project={project} onClick={() => { setSelectedProject(project); setView('project'); }} />
              ))}

              <div
                onClick={() => currentUser ? setView('request') : setIsLoginModalOpen(true)}
                className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition cursor-pointer h-full min-h-[250px]"
              >
                <PlusCircle size={48} className="mb-4 opacity-50" />
                <span className="font-semibold">Request New Blueprint</span>
                <span className="text-sm mt-1">{currentUser ? 'Share your idea' : 'Login to post idea'}</span>
              </div>
            </div>
          </div>
        )}

        {view === 'project' && selectedProject && (
          <BlueprintDetail
            project={selectedProject}
            onBack={() => setView('home')}
            user={currentUser}
            onLoginRequest={() => setIsLoginModalOpen(true)}
            onUpdateArtifact={handleUpdateArtifact}
          />
        )}

        {view === 'request' && (
          <CreateRequest
            onCancel={() => setView('home')}
            user={currentUser}
            onSubmit={handleCreateProject}
          />
        )}

        {view === 'profile' && currentUser && (
          <UserProfileView
            user={currentUser}
            projects={projects}
            onBack={() => setView('home')}
          />
        )}
      </main>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}