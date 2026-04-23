import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getPublishedSpecs } from '@/app/api/published-specs/route';
import { POST as postSaveSpec } from '@/app/api/specs-save/route';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    projectSpec: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

type ProjectSpecMock = {
  findMany: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
};

const mockPrisma = prisma as unknown as { projectSpec: ProjectSpecMock };

describe('API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/published-specs', () => {
    it('should return empty array when no published specs exist', async () => {
      mockPrisma.projectSpec.findMany.mockResolvedValue([]);

      const response = await getPublishedSpecs();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it('should return published specs with correct transformation', async () => {
      const mockSpecs = [
        {
          id: 'spec-1',
          projectName: 'Test Project',
          problemStatement: 'Need to build an app',
          solutionOverview: 'Use Next.js',
          functionalRequirements: ['Auth', 'Dashboard'],
          nonFunctionalRequirements: ['Fast', 'Scalable'],
          techStackRecommendation: ['Next.js', 'PostgreSQL'],
          status: 'Draft',
          isPublished: true,
          createdAt: new Date('2026-03-01'),
          updatedAt: new Date('2026-03-01'),
          artifactId: 'artifact-1',
          user: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      mockPrisma.projectSpec.findMany.mockResolvedValue(mockSpecs);

      const response = await getPublishedSpecs();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject({
        id: 'spec-1',
        title: 'Test Project',
        summary: 'Need to build an app',
        author: 'John Doe',
        isPublished: true,
      });
      expect(data[0].versions).toHaveLength(1);
      expect(data[0].versions[0].artifacts).toHaveLength(1);
    });

    it('should clean tech stack tags correctly', async () => {
      const mockSpecs = [
        {
          id: 'spec-2',
          projectName: 'Tech Stack Test',
          problemStatement: 'Test',
          solutionOverview: 'Test',
          functionalRequirements: [],
          nonFunctionalRequirements: [],
          techStackRecommendation: [
            '**Backend: Node.js (for API development)',
            'Frontend: React (UI)',
            'Database: PostgreSQL',
            'A very long technology name that should be filtered out because it exceeds maximum length',
          ],
          status: 'Draft',
          isPublished: true,
          createdAt: new Date('2026-03-01'),
          updatedAt: new Date('2026-03-01'),
          artifactId: null,
          user: { name: 'Jane Smith', email: 'jane@example.com' },
        },
      ];

      mockPrisma.projectSpec.findMany.mockResolvedValue(mockSpecs);

      const response = await getPublishedSpecs();
      const data = await response.json();

      const tags = data[0].tags;
      expect(tags).toContain('Node.js');
      expect(tags).toContain('React');
      expect(tags).toContain('PostgreSQL');
      // Long tags should be filtered
      expect(tags.every((tag: string) => tag.length < 30)).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.projectSpec.findMany.mockRejectedValue(new Error('Database error'));

      const response = await getPublishedSpecs();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should filter by isPublished true only', async () => {
      mockPrisma.projectSpec.findMany.mockResolvedValue([]);

      await getPublishedSpecs();

      expect(mockPrisma.projectSpec.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isPublished: true },
        })
      );
    });

    it('should order specs by most recent first', async () => {
      mockPrisma.projectSpec.findMany.mockResolvedValue([]);

      await getPublishedSpecs();

      expect(mockPrisma.projectSpec.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    // Regression test for schema drift protection
    it('should use explicit select to avoid schema drift failures', async () => {
      mockPrisma.projectSpec.findMany.mockResolvedValue([]);

      await getPublishedSpecs();

      // Verify that findMany is called with explicit 'select' (not implicit fetch all)
      const callArgs = mockPrisma.projectSpec.findMany.mock.calls[0][0];
      expect(callArgs).toHaveProperty('select');
      expect(callArgs.select).toHaveProperty('id');
      expect(callArgs.select).toHaveProperty('projectName');
      expect(callArgs.select).toHaveProperty('user');
      expect(callArgs.select.user).toHaveProperty('select');
    });

    it('should handle P2022 missing column errors gracefully', async () => {
      // Simulate Prisma P2022 error (column doesn't exist)
      const p2022Error = new Error('The column `ProjectSpec.someNewColumn` does not exist in the current database.');
      (p2022Error as any).code = 'P2022';

      mockPrisma.projectSpec.findMany.mockRejectedValue(p2022Error);

      const response = await getPublishedSpecs();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch published specs');
      // Error should be logged but not crash the route
    });

    it('should handle database connection errors with proper status', async () => {
      const connectionError = new Error('P1001: Can\'t reach database server');
      mockPrisma.projectSpec.findMany.mockRejectedValue(connectionError);

      const response = await getPublishedSpecs();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });

  describe('POST /api/specs-save', () => {
    it('should save spec with all required fields', async () => {
      const mockRequest = new Request('http://localhost:3000/api/specs-save', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            project_name: 'New Project',
            problem_statement: 'Problem description',
            solution_overview: 'Solution overview',
            functional_requirements: ['Req1', 'Req2'],
            non_functional_requirements: ['NFR1'],
            tech_stack_recommendation: ['Tech1', 'Tech2'],
            status: 'Draft',
          },
          userId: 'user-123',
          isPublished: false,
        }),
      });

      const mockCreatedSpec = {
        id: 'spec-new-1',
        isPublished: false,
      };

      mockPrisma.projectSpec.create.mockResolvedValue(mockCreatedSpec);

      const response = await postSaveSpec(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Spec saved successfully');
      expect(data.id).toBe('spec-new-1');
      expect(data.isPublished).toBe(false);
    });

    it('should return 400 when data is missing', async () => {
      const mockRequest = new Request('http://localhost:3000/api/specs-save', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-123',
          isPublished: false,
        }),
      });

      const response = await postSaveSpec(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should return 400 when userId is missing', async () => {
      const mockRequest = new Request('http://localhost:3000/api/specs-save', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            project_name: 'Test',
            problem_statement: 'Test',
            solution_overview: 'Test',
            functional_requirements: [],
            non_functional_requirements: [],
            tech_stack_recommendation: [],
          },
          isPublished: false,
        }),
      });

      const response = await postSaveSpec(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should handle database connection errors with 503 status', async () => {
      const mockRequest = new Request('http://localhost:3000/api/specs-save', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            project_name: 'Test',
            problem_statement: 'Test',
            solution_overview: 'Test',
            functional_requirements: [],
            non_functional_requirements: [],
            tech_stack_recommendation: [],
          },
          userId: 'user-123',
          isPublished: false,
        }),
      });

      const connectionError = new Error('P1001: Can\'t reach database server');
      mockPrisma.projectSpec.create.mockRejectedValue(connectionError);

      const response = await postSaveSpec(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.code).toBe('DATABASE_UNAVAILABLE');
      expect(data.error).toContain('temporarily unavailable');
    });

    it('should handle unknown database errors with 500 status', async () => {
      const mockRequest = new Request('http://localhost:3000/api/specs-save', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            project_name: 'Test',
            problem_statement: 'Test',
            solution_overview: 'Test',
            functional_requirements: [],
            non_functional_requirements: [],
            tech_stack_recommendation: [],
          },
          userId: 'user-123',
          isPublished: false,
        }),
      });

      const unknownError = new Error('Some unknown error');
      mockPrisma.projectSpec.create.mockRejectedValue(unknownError);

      const response = await postSaveSpec(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to save spec');
    });

    it('should set default values for optional fields', async () => {
      const mockRequest = new Request('http://localhost:3000/api/specs-save', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            project_name: 'Minimal Project',
            problem_statement: 'Problem',
            solution_overview: 'Solution',
            // No optional fields
          },
          userId: 'user-456',
          isPublished: true,
        }),
      });

      mockPrisma.projectSpec.create.mockResolvedValue({
        id: 'spec-minimal',
        isPublished: true,
      });

      await postSaveSpec(mockRequest);

      expect(mockPrisma.projectSpec.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            functionalRequirements: [],
            nonFunctionalRequirements: [],
            techStackRecommendation: [],
            status: 'Draft',
          }),
        })
      );
    });

    it('should preserve published status', async () => {
      const mockRequest = new Request('http://localhost:3000/api/specs-save', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            project_name: 'Published Project',
            problem_statement: 'Problem',
            solution_overview: 'Solution',
            functional_requirements: ['Req1'],
            non_functional_requirements: [],
            tech_stack_recommendation: [],
            status: 'Published',
          },
          userId: 'user-789',
          isPublished: true,
        }),
      });

      mockPrisma.projectSpec.create.mockResolvedValue({
        id: 'spec-published',
        isPublished: true,
      });

      const response = await postSaveSpec(mockRequest);
      const data = await response.json();

      expect(data.isPublished).toBe(true);
      expect(mockPrisma.projectSpec.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isPublished: true,
            status: 'Published',
          }),
        })
      );
    });
  });
});
