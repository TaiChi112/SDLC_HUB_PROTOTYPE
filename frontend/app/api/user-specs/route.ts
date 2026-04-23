import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/app/auth';

function isPrismaConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /P1001|P1002|P1017|Can't reach database server|Connection terminated/i.test(error.message);
}

export async function GET() {
  try {
    // Get current user session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Fetch user's specs (both published and unpublished)
    const userSpecs = await prisma.projectSpec.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        projectName: true,
        problemStatement: true,
        solutionOverview: true,
        functionalRequirements: true,
        nonFunctionalRequirements: true,
        techStackRecommendation: true,
        status: true,
        processDescription: true,
        isPublished: true,
        visualizationProcess: true,
        createdAt: true,
      },
    });

    // Format for frontend
    const formattedSpecs = userSpecs.map((spec) => ({
      id: spec.id,
      filename: spec.id, // Use id as filename
      project_name: spec.projectName,
      created_at: spec.createdAt.toISOString().slice(0, 16).replace('T', ' '),
      status: spec.status,
      isPublished: spec.isPublished,
      content: {
        project_name: spec.projectName,
        problem_statement: spec.problemStatement,
        solution_overview: spec.solutionOverview,
        functional_requirements: spec.functionalRequirements,
        non_functional_requirements: spec.nonFunctionalRequirements,
        tech_stack_recommendation: spec.techStackRecommendation,
        status: spec.status,
        processDescription: spec.processDescription || undefined,
        visualizationProcess: spec.visualizationProcess as Record<string, unknown> | undefined,
      },
    }));

    return NextResponse.json(formattedSpecs);
  } catch (error) {
    console.error('Error fetching user specs:', error);

    if (isPrismaConnectionError(error)) {
      return NextResponse.json(
        { error: 'Database is temporarily unavailable. Please try again shortly.', code: 'DATABASE_UNAVAILABLE' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch specs' },
      { status: 500 }
    );
  }
}
