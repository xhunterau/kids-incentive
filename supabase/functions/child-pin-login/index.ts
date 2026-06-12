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
    const { child_id, pin } = await req.json()

    if (!child_id || !pin) {
      return new Response(JSON.stringify({ error: '缺少必填字段' }), { status: 400, headers: corsHeaders })
    }

    if (!/^\d{4}$/.test(pin)) {
      return new Response(JSON.stringify({ error: 'PIN 格式错误' }), { status: 400, headers: corsHeaders })
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify PIN entirely inside Postgres — hash never leaves the database
    const { data: valid, error: verifyError } = await adminClient.rpc('verify_child_pin', {
      p_child_id: child_id,
      p_pin: pin,
    })

    if (verifyError) {
      return new Response(JSON.stringify({ error: '验证失败' }), { status: 500, headers: corsHeaders })
    }

    if (!valid) {
      return new Response(JSON.stringify({ error: 'PIN 错误' }), { status: 401, headers: corsHeaders })
    }

    // Get the child's email so we can generate a magic link token
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(child_id)
    if (userError || !userData?.user?.email) {
      return new Response(JSON.stringify({ error: '用户不存在' }), { status: 404, headers: corsHeaders })
    }

    // Generate a one-time magic link token — does NOT send any email
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email,
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      return new Response(JSON.stringify({ error: '登录失败' }), { status: 500, headers: corsHeaders })
    }

    return new Response(
      JSON.stringify({ token_hash: linkData.properties.hashed_token }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
