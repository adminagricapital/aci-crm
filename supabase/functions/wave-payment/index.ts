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

    const { action, paiement_id, beneficiaire_id, montant, type_paiement, telephone, user_id } = await req.json();

    if (action === "initiate") {
      // Create payment record
      const { data: paiement, error } = await supabaseAdmin.from("paiements").insert({
        beneficiaire_id,
        montant: montant || (type_paiement === "paiement_1" ? 1000 : 3000),
        type_paiement: type_paiement || "paiement_1",
        status: "en_attente",
        methode: "wave",
        telephone_payeur: telephone,
        collected_by: user_id,
        reference_wave: `WAVE-SIM-${Date.now()}`,
      }).select().single();

      if (error) throw error;

      // Simulate Wave checkout URL
      const waveCheckoutUrl = `https://pay.wave.com/c/ci/?amount=${paiement.montant}&currency=XOF&merchant=ACI-TEST&ref=${paiement.reference_wave}`;

      return new Response(
        JSON.stringify({
          success: true,
          paiement_id: paiement.id,
          checkout_url: waveCheckoutUrl,
          reference: paiement.reference_wave,
          simulation: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "confirm") {
      // Simulate payment confirmation (in production, Wave webhook would call this)
      const { error } = await supabaseAdmin.from("paiements").update({
        status: "paye",
        paid_at: new Date().toISOString(),
      }).eq("id", paiement_id);

      if (error) throw error;

      // Check if both payments are done, update beneficiaire status
      const { data: paiementData } = await supabaseAdmin
        .from("paiements").select("beneficiaire_id").eq("id", paiement_id).single();
      
      if (paiementData) {
        const { data: allPayments } = await supabaseAdmin
          .from("paiements")
          .select("type_paiement, status")
          .eq("beneficiaire_id", paiementData.beneficiaire_id)
          .eq("status", "paye");

        const hasPaiement1 = allPayments?.some(p => p.type_paiement === "paiement_1");
        const hasPaiement2 = allPayments?.some(p => p.type_paiement === "paiement_2");

        if (hasPaiement1 && hasPaiement2) {
          await supabaseAdmin.from("beneficiaires")
            .update({ status: "en_production" })
            .eq("id", paiementData.beneficiaire_id);
          
          // Create card entry
          await supabaseAdmin.from("cartes").upsert({
            beneficiaire_id: paiementData.beneficiaire_id,
            status: "en_production",
            date_production: new Date().toISOString(),
          }, { onConflict: "beneficiaire_id" });
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "Payment confirmed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "simulate_callback") {
      // Simulate Wave callback - auto-confirm after redirect
      const { data: pendingPayment } = await supabaseAdmin
        .from("paiements")
        .select("*")
        .eq("reference_wave", paiement_id)
        .single();

      if (pendingPayment) {
        await supabaseAdmin.from("paiements").update({
          status: "paye",
          paid_at: new Date().toISOString(),
        }).eq("id", pendingPayment.id);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
