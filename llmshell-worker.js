// llmshell.matijar.info - Cloudflare Worker

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Restrict to your domains in production
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

    try {
      const { command, cwd, vfs_snapshot, meta_context } = await request.json();

      const systemPrompt = `
You are the computation kernel for a simulated Linux OS on Matija Radeljak's portfolio website.
The user input is a terminal command.
Your job is to read the command, check the file system state, and return a STRICT JSON object.

CURRENT STATE:
- User: guest
- CWD: ${cwd}
- File System Snapshot: ${JSON.stringify(vfs_snapshot)}
- Meta Context: ${meta_context || "None"}

RULES:
1. Respond ONLY with valid JSON. Do not wrap in markdown \`\`\` blocks.
2. Maintain a slightly cynical, hyper-competent sysadmin tone if generating errors or meta-commentary.
3. If the command modifies files, populate 'vfs_mutations'.
4. If the command should open a graphical app (e.g., viewing a video, opening a PDF), populate 'ui_events'.

JSON SCHEMA:
{
  "stdout": "string (terminal output)",
  "stderr": "string (error output)",
  "vfs_mutations": [{"action": "create"|"delete", "path": "string"}],
  "ui_events": [{"type": "OPEN_APP"|"PLAY_MEDIA", "payload": "string"}]
}
`;

      const aiResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: command }
        ],
        stream: false // Explicitly prevent ReadableStream returns
      });

      // 1. Robust Extraction (Protects against Cloudflare SDK object/array mutations)
      let rawText = "";
      if (aiResponse && typeof aiResponse.response === 'string') {
        rawText = aiResponse.response;
      } else if (typeof aiResponse === 'string') {
        rawText = aiResponse;
      } else {
        // Fallback if the SDK returned an array, tool_call, or unexpected object
        rawText = JSON.stringify(aiResponse.response || aiResponse);
      }

      // 2. Aggressive String Sanitization
      rawText = typeof rawText === 'string' ? rawText.trim() : String(rawText);
      if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```(json)?\n?/i, '').replace(/\n?```$/i, '');
      }

      // 3. Guaranteed JSON Response (Protects frontend from LLM formatting hallucinations)
      let finalOutput;
      try {
        finalOutput = JSON.parse(rawText);
      } catch (parseError) {
        // If Llama ignores instructions and spits out raw text, package it nicely
        finalOutput = {
          stdout: rawText,
          stderr: "",
          vfs_mutations: [],
          ui_events: []
        };
      }

      return new Response(JSON.stringify(finalOutput), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });

    } catch (error) {
      return new Response(JSON.stringify({ 
        stdout: "", 
        stderr: `Kernel Panic (0x000000LLM): ${error.message}` 
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }
};