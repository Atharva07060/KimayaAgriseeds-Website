import { withSupabase } from "@supabase/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const allowedEnquiries = new Set([
  "Farmer / product enquiry",
  "Dealer bulk supply",
  "Distributor partnership",
  "Other",
]);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

const submit = withSupabase({ auth: "publishable" }, async (request, context) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return jsonResponse({ error: "Please send a valid enquiry." }, 400);
  }

  // Quietly accept the request without storing it if a bot fills the hidden field.
  if (typeof input.company_website === "string" && input.company_website.trim()) {
    return jsonResponse({ ok: true }, 200);
  }

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const rawPhone = typeof input.phone === "string" ? input.phone.trim() : "";
  const enquiryType = typeof input.enquiry_type === "string" ? input.enquiry_type : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";

  if (name.length < 1 || name.length > 100) {
    return jsonResponse({ error: "Enter a name up to 100 characters." }, 400);
  }
  if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: "Enter a valid email address." }, 400);
  }
  if (rawPhone.length > 30) {
    return jsonResponse({ error: "Phone number must be 30 characters or fewer." }, 400);
  }
  if (!allowedEnquiries.has(enquiryType)) {
    return jsonResponse({ error: "Choose an enquiry type." }, 400);
  }
  if (message.length < 1 || message.length > 2000) {
    return jsonResponse({ error: "Message must be between 1 and 2,000 characters." }, 400);
  }

  const { error } = await context.supabaseAdmin.from("contact_submissions").insert({
    name,
    email,
    phone: rawPhone || null,
    enquiry_type: enquiryType,
    message,
  });

  if (error) {
    console.error("Contact enquiry insert failed:", error.code);
    return jsonResponse({ error: "We could not save your enquiry. Please try again." }, 500);
  }

  return jsonResponse({ ok: true }, 201);
});

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return submit(request);
});
