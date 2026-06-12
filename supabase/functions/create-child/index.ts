import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: '未授权' }), { status: 401, headers: corsHeaders })
    }

    // Verify caller is a parent using their JWT
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: authError } = await anonClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: '认证失败' }), { status: 401, headers: corsHeaders })
    }

    const { data: parentProfile, error: profileError } = await anonClient
      .from('profiles')
      .select('role, family_id')
      .eq('id', user.id)
      .single()

    if (profileError || parentProfile?.role !== 'parent') {
      return new Response(JSON.stringify({ error: '仅家长可创建孩子账号' }), { status: 403, headers: corsHeaders })
    }

    const { email, password, display_name, avatar_emoji } = await req.json()

    if (!email || !password || !display_name) {
      return new Response(JSON.stringify({ error: '缺少必填字段' }), { status: 400, headers: corsHeaders })
    }

    // Use admin client to create the new user
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: corsHeaders })
    }

    const { error: insertError } = await adminClient.from('profiles').insert({
      id: newUser.user.id,
      family_id: parentProfile.family_id,
      role: 'child',
      display_name: display_name.trim(),
      avatar_emoji: avatar_emoji ?? '🐼',
    })

    if (insertError) {
      // Roll back: delete the auth user so we don't leave an orphan
      await adminClient.auth.admin.deleteUser(newUser.user.id)
      return new Response(JSON.stringify({ error: insertError.message }), { status: 500, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})
