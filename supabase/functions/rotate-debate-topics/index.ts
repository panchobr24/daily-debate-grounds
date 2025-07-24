import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Predefined debate topics pool
const DEBATE_TOPICS = [
  {
    title: 'AI and Employment',
    topic: 'Will artificial intelligence create more jobs than it destroys?',
    description: 'The impact of AI automation on the future job market and human employment.'
  },
  {
    title: 'Climate Action',
    topic: 'Should governments prioritize economic growth or environmental protection?',
    description: 'Balancing economic development with urgent climate change mitigation.'
  },
  {
    title: 'Social Media Regulation',
    topic: 'Should social media platforms be regulated like traditional media?',
    description: 'The debate over content moderation, free speech, and platform responsibility.'
  },
  {
    title: 'Universal Basic Income',
    topic: 'Is universal basic income a solution to poverty and inequality?',
    description: 'Exploring the potential benefits and drawbacks of guaranteed income for all.'
  },
  {
    title: 'Privacy vs Security',
    topic: 'Should personal privacy be sacrificed for national security?',
    description: 'The ongoing tension between protecting citizens and protecting privacy.'
  },
  {
    title: 'Space Exploration',
    topic: 'Should we focus on fixing Earth before exploring space?',
    description: 'Resource allocation between terrestrial problems and space advancement.'
  },
  {
    title: 'Digital Education',
    topic: 'Is online learning as effective as traditional classroom education?',
    description: 'The future of education in an increasingly digital world.'
  },
  {
    title: 'Cryptocurrency Future',
    topic: 'Will cryptocurrencies replace traditional banking systems?',
    description: 'The potential and limitations of decentralized digital currencies.'
  },
  {
    title: 'Work-Life Balance',
    topic: 'Should companies implement a four-day work week?',
    description: 'Exploring productivity, wellbeing, and economic impacts of shorter work weeks.'
  },
  {
    title: 'Gene Editing Ethics',
    topic: 'Should genetic engineering be used to enhance human capabilities?',
    description: 'The ethical implications of CRISPR and human genetic modification.'
  },
  {
    title: 'Nuclear Energy',
    topic: 'Is nuclear power essential for clean energy transition?',
    description: 'Weighing the risks and benefits of nuclear energy for climate goals.'
  },
  {
    title: 'Autonomous Vehicles',
    topic: 'Should self-driving cars be prioritized over public transportation?',
    description: 'The future of urban mobility and transportation infrastructure.'
  },
  {
    title: 'Mental Health',
    topic: 'Should mental health education be mandatory in schools?',
    description: 'Addressing the youth mental health crisis through education.'
  },
  {
    title: 'Food Technology',
    topic: 'Can lab-grown meat solve environmental and ethical food problems?',
    description: 'The future of sustainable and ethical food production.'
  },
  {
    title: 'Digital Democracy',
    topic: 'Should voting be conducted entirely online?',
    description: 'Balancing accessibility, security, and trust in democratic processes.'
  }
];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting debate topic rotation...')

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

    // Step 2: Select 6 random topics from the pool
    const shuffled = [...DEBATE_TOPICS].sort(() => 0.5 - Math.random())
    const selectedTopics = shuffled.slice(0, 6)

    console.log('Selected topics:', selectedTopics.map(t => t.title))

    // Step 3: Create new debate rooms
    const newRooms = selectedTopics.map(topic => ({
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

    console.log(`Successfully created ${createdRooms?.length} new debate rooms`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Rotated debate topics successfully. Created ${createdRooms?.length} new rooms.`,
        topics: selectedTopics.map(t => t.title)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in rotate-debate-topics function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})