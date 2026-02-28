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

    const adminEmail = "innocentkoffi1@gmail.com";
    const adminUsername = "admin";
    const adminPassword = "@Massa29012020";

    // Check if user exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === adminEmail);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      // Update password
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: adminPassword,
        user_metadata: { username: adminUsername, nom: "KOFFI", prenoms: "Innocent" },
      });

      // Update profile
      await supabaseAdmin.from("profiles").upsert({
        id: userId,
        username: adminUsername,
        nom: "KOFFI",
        prenoms: "Innocent",
        email: adminEmail,
        status: "actif",
      });
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { username: adminUsername, nom: "KOFFI", prenoms: "Innocent" },
      });

      if (createError) throw createError;
      userId = newUser.user.id;

      // Update profile status
      await supabaseAdmin.from("profiles").update({ status: "actif" }).eq("id", userId);
    }

    // Assign super_admin role (upsert)
    await supabaseAdmin.from("user_roles").upsert(
      { user_id: userId, role: "super_admin" },
      { onConflict: "user_id,role" }
    );

    return new Response(
      JSON.stringify({ success: true, message: "Super admin configured", userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
