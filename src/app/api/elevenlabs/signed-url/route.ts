import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { agentId } = await request.json()
    
    const apiKey = process.env.ELEVENLABS_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Eleven Labs API key not configured' },
        { status: 500 }
      )
    }

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    // Call Eleven Labs API to get signed URL
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Eleven Labs API error:', error)
      return NextResponse.json(
        { error: 'Failed to get signed URL from Eleven Labs' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      conversationToken: data.signed_url,
    })
  } catch (error) {
    console.error('Error generating signed URL:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
