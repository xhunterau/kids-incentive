import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

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

    // Verify caller is a parent
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
      return new Response(JSON.stringify({ error: '仅家长可设置 PIN' }), { status: 403, headers: corsHeaders })
    }

    const { child_id, pin } = await req.json()

    if (!child_id || !pin) {
      return new Response(JSON.stringify({ error: '缺少必填字段' }), { status: 400, headers: corsHeaders })
    }

    if (!/^\d{4}$/.test(pin)) {
      return new Response(JSON.stringify({ error: 'PIN 必须是 4 位数字' }), { status: 400, headers: corsHeaders })
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify the target child belongs to the same family
    const { data: childProfile, error: childError } = await adminClient
      .from('profiles')
      .select('id, family_id, role')
      .eq('id', child_id)
      .single()

    if (childError || !childProfile || childProfile.role !== 'child' || childProfile.family_id !== parentProfile.family_id) {
      return new Response(JSON.stringify({ error: '无权操作该孩子账号' }), { status: 403, headers: corsHeaders })
    }

    // Hash PIN and upsert into child_pins (DB-side bcrypt via pgcrypto)
    const { error: pinError } = await adminClient.rpc('upsert_child_pin', {
      p_child_id: child_id,
      p_pin: pin,
    })

    if (pinError) {
      return new Response(JSON.stringify({ error: pinError.message }), { status: 500, headers: corsHeaders })
    }

    // Randomise the child's Auth password so email+password login is blocked
    const { error: pwError } = await adminClient.auth.admin.updateUserById(child_id, {
      password: crypto.randomUUID(),
    })

    if (pwError) {
      return new Response(JSON.stringify({ error: pwError.message }), { status: 500, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
