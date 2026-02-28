import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { email, username, password, nom, prenoms, role, telephone } = await req.json();

    if (!email || !username || !password || !nom || !role) {
      throw new Error("Missing required fields");
    }

    // Check if user exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
        user_metadata: { username, nom, prenoms: prenoms || "" },
      });
      await supabaseAdmin.from("profiles").upsert({
        id: userId, username, nom, prenoms: prenoms || "", email, telephone: telephone || "", status: "actif",
      });
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username, nom, prenoms: prenoms || "", telephone: telephone || "" },
      });
      if (createError) throw createError;
      userId = newUser.user.id;
      await supabaseAdmin.from("profiles").update({ status: "actif" }).eq("id", userId);
    }

    // Assign role (upsert)
    await supabaseAdmin.from("user_roles").upsert(
      { user_id: userId, role },
      { onConflict: "user_id,role" }
    );

    return new Response(
      JSON.stringify({ success: true, userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
