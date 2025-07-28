import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!
    
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting AI-powered debate topic generation...')

    // Generate 6 diverse topics using Gemini AI
    const prompt = `You are a debate topic generator. Generate exactly 6 diverse, engaging debate topics for today (${new Date().toLocaleDateString()}). Each topic should be:
    - Relevant to current times and trending issues
    - Thought-provoking and balanced (allowing for multiple viewpoints)
    - Accessible to a general audience
    - Cover different domains (technology, society, environment, ethics, economics, politics, culture)
    
    Return ONLY a JSON array with exactly 6 objects, each containing:
    - title: A catchy, short title (max 25 characters)
    - topic: The debate question (clear, specific question)
    - description: Brief explanation of the debate context (1-2 sentences)
    
    Example format:
    [
      {
        "title": "AI in Healthcare",
        "topic": "Should AI diagnosis replace human doctors in routine medical care?",
        "description": "The growing capability of AI to diagnose diseases faster and more accurately than humans."
      }
    ]
    
    Generate 6 fresh, diverse debate topics now:`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2048,
        }
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const generatedContent = data.candidates[0].content.parts[0].text

    console.log('Raw AI response:', generatedContent)

    // Parse the AI response
    let topics
    try {
      topics = JSON.parse(generatedContent)
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      throw new Error('Invalid AI response format')
    }

    if (!Array.isArray(topics) || topics.length !== 6) {
      throw new Error('AI did not generate exactly 6 topics')
    }

    // Validate topic structure
    for (const topic of topics) {
      if (!topic.title || !topic.topic || !topic.description) {
        throw new Error('Invalid topic structure from AI')
      }
    }

    console.log('Generated topics:', topics.map(t => t.title))

    // Step 1: Deactivate all current debate rooms
    const { error: deactivateError } = await supabase
      .from('debate_rooms')
      .update({ is_active: false })
      .eq('is_active', true)

    if (deactivateError) {
      console.error('Error deactivating rooms:', deactivateError)
      throw deactivateError
    }

    console.log('Deactivated current debate rooms')

    // Step 2: Create new debate rooms with AI-generated topics
    const newRooms = topics.map(topic => ({
      title: topic.title,
      topic: topic.topic,
      description: topic.description,
      is_active: true,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
    }))

    const { data: createdRooms, error: createError } = await supabase
      .from('debate_rooms')
      .insert(newRooms)
      .select()

    if (createError) {
      console.error('Error creating rooms:', createError)
      throw createError
    }

    console.log(`Successfully created ${createdRooms?.length} new AI-generated debate rooms`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${createdRooms?.length} new AI-powered debate topics for ${new Date().toLocaleDateString()}`,
        topics: topics.map(t => ({ title: t.title, topic: t.topic })),
        generated_at: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in generate-daily-topics function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})