import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as getUserSpecs } from '@/app/api/user-specs/route';
import { DELETE as deleteUserSpec, PATCH as patchUserSpec } from '@/app/api/user-specs/[id]/route';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    projectSpec: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/app/auth', () => ({
  auth: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { auth } from '@/app/auth';

type ProjectSpecRouteMock = {
  findMany: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

const mockPrisma = prisma as unknown as { projectSpec: ProjectSpecRouteMock };
const mockAuth = vi.mocked(auth);

describe('User Specs API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/user-specs', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const response = await getUserSpecs();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('returns formatted specs for authenticated user', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1' } } as Awaited<ReturnType<typeof auth>>);
      mockPrisma.projectSpec.findMany.mockResolvedValue([
        {
          id: 'spec-1',
          projectName: 'Project A',
          problemStatement: 'Problem A',
          solutionOverview: 'Solution A',
          functionalRequirements: ['Req1'],
          nonFunctionalRequirements: ['NFR1'],
          techStackRecommendation: ['React'],
          status: 'Draft',
          isPublished: false,
          createdAt: new Date('2026-03-03T10:00:00.000Z'),
        },
      ]);

      const response = await getUserSpecs();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject({
        id: 'spec-1',
        filename: 'spec-1',
        project_name: 'Project A',
        status: 'Draft',
        isPublished: false,
      });
      expect(mockPrisma.projectSpec.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'u1' },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('returns 503 for prisma connection errors', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1' } } as Awaited<ReturnType<typeof auth>>);
      mockPrisma.projectSpec.findMany.mockRejectedValue(new Error("P1001: Can't reach database server"));

      const response = await getUserSpecs();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.code).toBe('DATABASE_UNAVAILABLE');
    });

    it('returns 500 for unknown errors', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1' } } as Awaited<ReturnType<typeof auth>>);
      mockPrisma.projectSpec.findMany.mockRejectedValue(new Error('Unknown failure'));

      const response = await getUserSpecs();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch specs');
    });
  });

  describe('DELETE /api/user-specs/[id]', () => {
    it('returns 401 when unauthenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const response = await deleteUserSpec(new Request('http://localhost/api/user-specs/spec-1', { method: 'DELETE' }), {
        params: Promise.resolve({ id: 'spec-1' }),
      });

      expect(response.status).toBe(401);
    });

    it('returns 404 when spec is not found', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1' } } as Awaited<ReturnType<typeof auth>>);
      mockPrisma.projectSpec.findUnique.mockResolvedValue(null);

      const response = await deleteUserSpec(new Request('http://localhost/api/user-specs/spec-1', { method: 'DELETE' }), {
        params: Promise.resolve({ id: 'spec-1' }),
      });

      expect(response.status).toBe(404);
    });

    it('returns 403 when user does not own spec', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1' } } as Awaited<ReturnType<typeof auth>>);
      mockPrisma.projectSpec.findUnique.mockResolvedValue({ id: 'spec-1', userId: 'u2' });

      const response = await deleteUserSpec(new Request('http://localhost/api/user-specs/spec-1', { method: 'DELETE' }), {
        params: Promise.resolve({ id: 'spec-1' }),
      });

      expect(response.status).toBe(403);
    });

    it('deletes owned spec successfully', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1' } } as Awaited<ReturnType<typeof auth>>);
      mockPrisma.projectSpec.findUnique.mockResolvedValue({ id: 'spec-1', userId: 'u1' });
      mockPrisma.projectSpec.delete.mockResolvedValue({ id: 'spec-1' });

      const response = await deleteUserSpec(new Request('http://localhost/api/user-specs/spec-1', { method: 'DELETE' }), {
        params: Promise.resolve({ id: 'spec-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Deleted');
      expect(mockPrisma.projectSpec.delete).toHaveBeenCalledWith({ where: { id: 'spec-1' } });
    });
  });

  describe('PATCH /api/user-specs/[id]', () => {
    it('returns 400 when isPublished is not boolean', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1' } } as Awaited<ReturnType<typeof auth>>);

      const response = await patchUserSpec(
        new Request('http://localhost/api/user-specs/spec-1', {
          method: 'PATCH',
          body: JSON.stringify({ isPublished: 'yes' }),
        }),
        { params: Promise.resolve({ id: 'spec-1' }) },
      );

      expect(response.status).toBe(400);
    });

    it('returns 404 when target spec does not exist', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1' } } as Awaited<ReturnType<typeof auth>>);
      mockPrisma.projectSpec.findUnique.mockResolvedValue(null);

      const response = await patchUserSpec(
        new Request('http://localhost/api/user-specs/spec-1', {
          method: 'PATCH',
          body: JSON.stringify({ isPublished: true }),
        }),
        { params: Promise.resolve({ id: 'spec-1' }) },
      );

      expect(response.status).toBe(404);
    });

    it('returns 403 when user does not own target spec', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1' } } as Awaited<ReturnType<typeof auth>>);
      mockPrisma.projectSpec.findUnique.mockResolvedValue({ id: 'spec-1', userId: 'u2' });

      const response = await patchUserSpec(
        new Request('http://localhost/api/user-specs/spec-1', {
          method: 'PATCH',
          body: JSON.stringify({ isPublished: true }),
        }),
        { params: Promise.resolve({ id: 'spec-1' }) },
      );

      expect(response.status).toBe(403);
    });

    it('updates publish status for owned spec', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1' } } as Awaited<ReturnType<typeof auth>>);
      mockPrisma.projectSpec.findUnique.mockResolvedValue({ id: 'spec-1', userId: 'u1' });
      mockPrisma.projectSpec.update.mockResolvedValue({ id: 'spec-1', isPublished: true });

      const response = await patchUserSpec(
        new Request('http://localhost/api/user-specs/spec-1', {
          method: 'PATCH',
          body: JSON.stringify({ isPublished: true }),
        }),
        { params: Promise.resolve({ id: 'spec-1' }) },
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Updated');
      expect(data.spec).toEqual({ id: 'spec-1', isPublished: true });
    });
  });
});
