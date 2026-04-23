import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';

interface GenerateDiagramRequest {
  processDescription: string;
  projectName: string;
}

interface GenerateDiagramResponse {
  mermaidCode: string;
  projectName: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - please sign in' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    let body: GenerateDiagramRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { processDescription, projectName } = body;

    if (!processDescription || typeof processDescription !== 'string' || processDescription.trim().length === 0) {
      return NextResponse.json(
        { error: 'processDescription is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!projectName || typeof projectName !== 'string' || projectName.trim().length === 0) {
      return NextResponse.json(
        { error: 'projectName is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Forward request to backend FastAPI
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000/api';
    const response = await fetch(`${backendUrl}/generate-diagram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        processDescription: processDescription.trim(),
        projectName: projectName.trim(),
        userId: session.user.email
      })
    });

    if (!response.ok) {
      let errorMessage = 'Failed to generate diagram from backend';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = `Backend error: ${response.status} ${response.statusText}`;
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data: GenerateDiagramResponse = await response.json();

    // Validate backend response
    if (!data.mermaidCode) {
      return NextResponse.json(
        { error: 'Backend returned invalid response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      mermaidCode: data.mermaidCode,
      projectName: data.projectName
    });

  } catch (error) {
    console.error('Error generating diagram:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
