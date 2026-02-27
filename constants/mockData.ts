import type { Contribution, Project } from '../types';
import { generateStandardSections } from '../utils/templateGenerator';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: '0',
    title: 'The Blueprint Hub (Official)',
    summary:
      'แพลตฟอร์ม Open Source สำหรับรวบรวม Software Requirements และ Architecture เพื่อแก้ปัญหา "มี Code แต่ไม่มี Docs"',
    author: 'Blueprint_Core_Team',
    tags: ['Platform', 'React', 'Education', 'Social Impact'],
    references: [
      { title: 'Inspiration: GitHub', url: 'https://github.com' },
      { title: 'Concept: Open Design', url: '#' },
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
              problem:
                'Software product ปัจจุบันขาดเอกสาร (Documentation Debt) ทำให้ยากต่อการพัฒนาต่อ และ Source Code มักผูกติดกับภาษาใดภาษาหนึ่งมากเกินไป',
              goal: 'สร้าง Knowledge Base ที่คนรุ่นหลังสามารถนำไปพัฒนาต่อได้ทันที',
              users: ['Student (CS/SE)', 'Volunteer', 'Business Owner'],
              features: [
                'ระบบ Version Control สำหรับเอกสาร',
                'Template มาตรฐานสำหรับ SRS',
                'ระบบ Suggest Edit สำหรับ Volunteers',
              ],
              techConstraints: ['Frontend: React/Next.js', 'Database: Firestore (Mock first)'],
              inScope: ['ระบบเก็บ Document', 'ระบบ Versioning'],
              outScope: ['Code Compiler', 'Project Management (Jira-like features)'],
            }),
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
            contentFormat: 'mermaid',
          },
        ],
        implementations: [
          { language: 'React + TS', repoUrl: '#', description: 'Current Prototype' },
        ],
      },
    ],
  },
];

export const MOCK_CONTRIBUTIONS: Contribution[] = [
  {
    id: 'c1',
    projectTitle: 'E-Commerce Inventory',
    action: 'Refined ER Diagram',
    date: '2023-10-15',
    type: 'artifact',
  },
  {
    id: 'c2',
    projectTitle: 'Basic Calculator',
    action: 'Added Unit Tests',
    date: '2023-10-20',
    type: 'code',
  },
  {
    id: 'c3',
    projectTitle: 'The Blueprint Hub',
    action: 'Added NFRs',
    date: '2023-11-01',
    type: 'review',
  },
];
