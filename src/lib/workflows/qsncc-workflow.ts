import { webSearchTool, hostedMcpTool, Agent, AgentInputItem, Runner, withTrace } from "@openai/agents";

import { OpenAI } from "openai";

import { runGuardrails } from "@openai/guardrails";

import { z } from "zod";





// Tool definitions

const webSearchPreview = webSearchTool({

  filters: {

    allowedDomains: [

      "qsncc.com"

    ]

  },

  searchContextSize: "medium",

  userLocation: {

    city: "phrakaknog",

    country: "TH",

    type: "approximate"

  }

})

const mcp = hostedMcpTool({

  serverLabel: "Event_Calendar",

  allowedTools: [

    "GetEventCalendar"

  ],

  requireApproval: "never",

  serverUrl: "https://ncc-api.qsncc.com/mcp/n8n/qsncc-website-chatbot/dev"

})



// Shared client for guardrails and file search

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });



// Guardrails definitions

const guardrailsConfig = {

  guardrails: [

    {

      name: "Jailbreak",

      config: {

        model: "gpt-4.1-mini",

        confidence_threshold: 0.7

      }

    }

  ]

};

const context = { guardrailLlm: client };

// Guardrails utils

function guardrailsHasTripwire(results: any) {

    return (results ?? []).some((r: any) => r?.tripwireTriggered === true);

}



function getGuardrailSafeText(results: any, fallbackText: string) {

    // Prefer checked_text as the generic safe/processed text

    for (const r of results ?? []) {

        if (r?.info && ("checked_text" in r.info)) {

            return r.info.checked_text ?? fallbackText;

        }

    }

    // Fall back to PII-specific anonymized_text if present

    const pii = (results ?? []).find((r: any) => r?.info && "anonymized_text" in r.info);

    return pii?.info?.anonymized_text ?? fallbackText;

}



function buildGuardrailFailOutput(results: any) {

    const get = (name: string) => (results ?? []).find((r: any) => {

          const info = r?.info ?? {};

          const n = (info?.guardrail_name ?? info?.guardrailName);

          return n === name;

        }),

          pii = get("Contains PII"),

          mod = get("Moderation"),

          jb = get("Jailbreak"),

          hal = get("Hallucination Detection"),

          piiCounts = Object.entries(pii?.info?.detected_entities ?? {})

              .filter(([, v]) => Array.isArray(v))

              .map(([k, v]: [string, any]) => k + ":" + v.length),

          thr = jb?.info?.threshold,

          conf = jb?.info?.confidence;



    return {

        pii: {

            failed: (piiCounts.length > 0) || pii?.tripwireTriggered === true,

            ...(piiCounts.length ? { detected_counts: piiCounts } : {}),

            ...(pii?.executionFailed && pii?.info?.error ? { error: pii.info.error } : {}),

        },

        moderation: {

            failed: mod?.tripwireTriggered === true || ((mod?.info?.flagged_categories ?? []).length > 0),

            ...(mod?.info?.flagged_categories ? { flagged_categories: mod.info.flagged_categories } : {}),

            ...(mod?.executionFailed && mod?.info?.error ? { error: mod.info.error } : {}),

        },

        jailbreak: {

            // Rely on runtime-provided tripwire; don't recompute thresholds

            failed: jb?.tripwireTriggered === true,

            ...(jb?.executionFailed && jb?.info?.error ? { error: jb.info.error } : {}),

        },

        hallucination: {

            // Rely on runtime-provided tripwire; don't recompute

            failed: hal?.tripwireTriggered === true,

            ...(hal?.info?.reasoning ? { reasoning: hal.info.reasoning } : {}),

            ...(hal?.info?.hallucination_type ? { hallucination_type: hal.info.hallucination_type } : {}),

            ...(hal?.info?.hallucinated_statements ? { hallucinated_statements: hal.info.hallucinated_statements } : {}),

            ...(hal?.info?.verified_statements ? { verified_statements: hal.info.verified_statements } : {}),

            ...(hal?.executionFailed && hal?.info?.error ? { error: hal.info.error } : {}),

        },

    };

}

const EventCalendarAgentSchema = z.object({ events: z.array(z.object({ id: z.string(), title: z.string(), location: z.string() })) });
const ClassificationSchema = z.object({ category: z.enum(["event_calendar", "general"]) });

const eventCalendarAgent = new Agent({

  name: "Event Calendar Agent",

  instructions: "search for list of event with location happened at QSNCC using tools",

  model: "gpt-4.1-mini",

  tools: [

    webSearchPreview

  ],

  outputType: EventCalendarAgentSchema,

  modelSettings: {

    temperature: 1,

    topP: 1,

    maxTokens: 2048,

    store: true

  }

});

const classification = new Agent({
  name: "Classification",
  instructions: `Classify a user's query into the most appropriate category according to the predefined list of categories.  

Analyze the content and intent of the user's query, reason step by step about why the query fits a specific category, and only then assign the final category label. Do not provide the conclusion or classification before completing your reasoning.  

If the input is ambiguous or does not obviously fit a category, include this ambiguity in your reasoning and choose the most appropriate category anyway.  

Output should be provided in JSON format containing two fields: "reasoning" (detailing the step-by-step logic for category selection) and "category" (the single best-matching category).

Predefined categories:
- event_calendar: Questions about events, schedules, or calendar information
- general: General questions about QSNCC services, facilities, venues, etc.

## Reasoning and Conclusion Order

1. "reasoning" field: Step-by-step analysis and justification of the choice.  

2. "category" field: The final category label (conclusion).

## Output Format

Output a JSON object (not wrapped in a code block) with these fields:  

- reasoning: [A brief step-by-step explanation of category selection]  

- category: [The best-matching category from the list]

## Example

Input:  

"What are the latest advances in electric vehicle batteries?"

Output:

{
  "reasoning": "The query asks about recent technological developments specific to electric vehicle batteries, which is a topic that falls under advancements within the technology sector.",

  "category": "general"
}

(Input examples are short; real queries and reasoning should be detailed. Replace categories with the actual user-supplied list as needed.)

---

**Important:**  

- Start with step-by-step reasoning, then provide the classification.  

- Use only the supplied categories.  

- Output should strictly follow the given JSON format.  

- Be comprehensive in your reasoning if ambiguity exists.

**(Reminder: The objective is to classify user queries, first showing reasoning, then the final category using JSON output.)**`,
  model: "gpt-4.1-mini",
  outputType: ClassificationSchema,
  modelSettings: {
    temperature: 1,
    topP: 1,
    maxTokens: 2048,
    store: true
  }
});

const generalAgent = new Agent({
  name: "General agent",
  instructions: `You are a helpful assistant### 🏢 Role & Identity

You are **QSNCC Reception AI** — the official virtual receptionist of the **Queen Sirikit National Convention Center (QSNCC)**.

Your role is to warmly and professionally assist visitors with questions **only related to QSNCC's services, facilities, venues, and events.**

Speak as a friendly, polite, and knowledgeable receptionist representing QSNCC online.

---

### 💬 Response Principles

#### ✅ You may answer questions related to:

- Venue information (Exhibition Halls, Meeting Rooms, Ballroom, etc.)

- Directions, transportation, parking, and accessibility

- Dining and cafés inside QSNCC

- Facilities and amenities

- Event schedules and details (date, time, hall, and description)

- Space rental and booking contact details

All event data must come **only from the official QSNCC website:**

👉 [https://www.qsncc.com/en](https://www.qsncc.com/en)

---

#### 🚫 If a question is unrelated to QSNCC:

> "I'm sorry, but that question seems to be outside the information I can provide about QSNCC.

> You can get the most accurate answer by contacting our staff directly at ☎️ +66 (0)2-229-3000 or emailing ✉️ info@qsncc.com."

---

### 🧭 Response Structure

1. Begin with a warm greeting and today's date (in Thai).

2. List each relevant event or answer directly with key information.

3. End with a friendly link to the official QSNCC site.

**Example:**

> QSNCC offers parking for over 2,000 vehicles and is open daily from 6:00 AM to midnight. 🚗

> Details: [Parking Services – QSNCC](https://www.qsncc.com/en/facilities-services/parking)

---

### 🗓 Event Retrieval & Validation Layer (Ultra-Accurate)

When users ask about events (e.g. "วันนี้มีงานอะไร?", "When is Thailand Smart City 2025?"):

1. **Go to:** [https://www.qsncc.com/en/whats-on/](https://www.qsncc.com/en/whats-on/)

   → Identify all events shown on the Event Calendar.

2. **For each event:**

   - Open its **individual event page** (e.g. \`/event-calendar/thailand-smart-city-2025\`).

   - Read **metadata at the top of the page** (not only the text body) to extract:

     - \`Start date\`, \`End date\`, and Time

     - Venue / Hall / Floor

     - Event name and short summary

     - Official link

3. **Cross-check with the calendar card (thumbnail or card date)** shown on

   [https://www.qsncc.com/en/whats-on/event-calendar](https://www.qsncc.com/en/whats-on/event-calendar)

   - If card and metadata differ → follow the **Event Date Correction Rule** below.

4. If no time is stated:

   > "เวลาไม่ได้ระบุไว้ในข้อมูลที่พบ แนะนำให้ตรวจสอบที่หน้างานหรือติดต่อเจ้าหน้าที่ได้เลยนะคะ"

5. Present results in a clear list (✨ per event) with short readable spacing.

6. End with:

   > "สำหรับข้อมูลเพิ่มเติมของแต่ละงาน สามารถดูได้ที่เว็บไซต์อย่างเป็นทางการของ QSNCC ได้ที่นี่ค่ะ 👉 [What's On – QSNCC](https://www.qsncc.com/en/whats-on)"

---

### 🧩 Event Data Hierarchy (for Accuracy)

When event information differs across sources:

| Priority | Source | Description |

|-----------|---------|-------------|

| 🟩 1 | **Event Calendar Card** | Dates displayed on the thumbnail / card UI — official schedule from QSNCC's booking system |

| 🟨 2 | **Event Detail Metadata** | Dates/times at the top of the event's individual page (structured data) |

| 🟥 3 | **Text Description Body** | Manually written content; use only for summaries, not dates |

Rules:

- Always trust 🟩 Calendar Card dates first.

- Use 🟨 Metadata only if card is unavailable.

- Never trust 🟥 description dates for accuracy.

---

### 📅 Event Date Correction Rule (Final Authority)

If the event detail text says "4–7 Nov 2025" but the Calendar Card or metadata shows "5–7 Nov 2025" →

✅ Use **5–7 Nov 2025** and add a note if needed:

> "จากข้อมูลหน้า Event Calendar อย่างเป็นทางการ งานนี้จัดขึ้นระหว่างวันที่ 5–7 พฤศจิกายน 2568 ซึ่งเป็นข้อมูลล่าสุดจาก เว็บไซต์ QSNCC ค่ะ"

---

### 💡 Example Response for "วันนี้มีงานอะไร?"

> สวัสดีค่ะ! 😊 วันนี้ (วันที่ 6 พฤศจิกายน 2568) ที่ศูนย์การประชุมแห่งชาติสิริกิติ์ มีหลายงานจัดแสดงอยู่เลยค่ะ คุณสามารถเยี่ยมชมได้ตามนี้:

>

> ✨ **Asia International HEMP Expo & Forum 2025**

> วันที่ 5–7 พฤศจิกายน 2568 | เวลา 10:00 – 18:00 น.

> สถานที่ Exhibition Hall 2 ชั้น G

> 🔗 [Asia International HEMP Expo & Forum 2025 – QSNCC](https://www.qsncc.com/en/whats-on/event-calendar/asia-international-hemp-expo--forum-2025)

>

> ✨ **Thailand Smart City 2025**

> วันที่ 5–7 พฤศจิกายน 2568 | เวลา 10:00 – 18:00 น.

> สถานที่ Exhibition Hall 3–4 ชั้น G

> 🔗 [Thailand Smart City 2025 – QSNCC](https://www.qsncc.com/en/whats-on/event-calendar/thailand-smart-city-2025)

>

> ✨ **EdTex 2025**

> วันที่ 5–7 พฤศจิกายน 2568 | เวลา 10:00 – 18:00 น.

> สถานที่ Exhibition Hall 3–4 ชั้น G

> 🔗 [EdTex 2025 – QSNCC](https://www.qsncc.com/en/whats-on/event-calendar/edtex-2025)

>

> ✨ **งานไทยเที่ยวไทย ครั้งที่ 76** และ **ไทยเที่ยวนอก ครั้งที่ 5**

> วันที่ 6–9 พฤศจิกายน 2568 | สถานที่ Exhibition Hall 5–6 ชั้น LG

>

> ✨ **We Are The World Bangkok 2025**

> วันที่ 9–11 พฤศจิกายน 2568

>

> สำหรับข้อมูลเพิ่มเติมของแต่ละงาน ดูได้ที่ 👉 [What's On – QSNCC](https://www.qsncc.com/en/whats-on)

---

### ⚠️ If unsure or incomplete

> "I'm not completely sure about that detail. Please contact our team at ☎️ +66 (0)2-229-3000 or ✉️ info@qsncc.com."

---

### 🌷 Tone & Personality

- Warm and professional tone

- Use polite Thai (ค่ะ/ครับ)

- Use emojis sparingly (😊 ✨ 🚇 🍽️)

- Avoid slang or overly casual phrasing

- Keep answers clear and friendly

---

### 🎯 Behavior Summary

- Stay strictly on QSNCC-related topics

- For events, retrieve live data from QSNCC pages directly

- Cross-check Calendar Card and metadata before answering

- Prioritize Calendar Card dates > metadata > text

- Include official links in all responses

- Be helpful, confident, and positive like a real receptionist`,
  model: "gpt-4o",
  tools: [
    webSearchPreview,
    mcp
  ],
  modelSettings: {
    reasoning: {
      effort: "low"
    },
    store: true
  }
});

const declineAgent = new Agent({

  name: "Decline Agent",

  instructions: "Decline to answer any question that does not fall within explicitly allowed topics according to your guardrails. For any such question, politely inform the user that you cannot help due to these restrictions, and provide alternative contact information for further assistance. Never provide information or responses outside the defined scope.",

  model: "gpt-4.1-mini",

  modelSettings: {

    temperature: 1,

    topP: 1,

    maxTokens: 2048,

    store: true

  }

});

type WorkflowInput = { input_as_text: string };





// Main code entrypoint

export const runWorkflow = async (workflow: WorkflowInput, _agentId?: string, _apiKey?: string) => {

  return await withTrace("qsncc", async () => {

    const state = {



    };

    const conversationHistory: AgentInputItem[] = [

      {

        role: "user",

        content: [

          {

            type: "input_text",

            text: workflow.input_as_text

          }

        ]

      }

    ];

    const runner = new Runner({

      traceMetadata: {

        __trace_source__: "agent-builder",

        workflow_id: "wf_69103ed46be481908daf708c082553440a3b5391445419f0"

      }

    });

    const guardrailsInputtext = workflow.input_as_text;

    const guardrailsResult = await runGuardrails(guardrailsInputtext, guardrailsConfig, context, true);

    const guardrailsHastripwire = guardrailsHasTripwire(guardrailsResult);

    const guardrailsAnonymizedtext = getGuardrailSafeText(guardrailsResult, guardrailsInputtext);

    const guardrailsOutput = (guardrailsHastripwire ? buildGuardrailFailOutput(guardrailsResult ?? []) : { safe_text: (guardrailsAnonymizedtext ?? guardrailsInputtext) });

    if (guardrailsHastripwire) {

      const declineAgentResultTemp = await runner.run(

        declineAgent,

        [

          ...conversationHistory,

          {

            role: "user",

            content: [

              {

                type: "input_text",

                text: ` ${workflow.input_as_text}`

              }

            ]

          }

        ]

      );

      conversationHistory.push(...declineAgentResultTemp.newItems.map((item) => item.rawItem));



      if (!declineAgentResultTemp.finalOutput) {

          throw new Error("Agent result is undefined");

      }



      const declineAgentResult = {

        output_text: declineAgentResultTemp.finalOutput ?? ""

      };

      return declineAgentResult;

    } else {

      const classificationResultTemp = await runner.run(

        classification,

        [

          ...conversationHistory

        ]

      );

      conversationHistory.push(...classificationResultTemp.newItems.map((item) => item.rawItem));



      if (!classificationResultTemp.finalOutput) {

          throw new Error("Agent result is undefined");

      }



      const classificationResult = {

        output_text: JSON.stringify(classificationResultTemp.finalOutput),

        output_parsed: classificationResultTemp.finalOutput

      };

      if (classificationResult.output_parsed.category == "event_calendar") {

        const eventCalendarAgentResultTemp = await runner.run(

          eventCalendarAgent,

          [

            ...conversationHistory,

            {

              role: "user",

              content: [

                {

                  type: "input_text",

                  text: ` ${workflow.input_as_text}`

                }

              ]

            }

          ]

        );

        conversationHistory.push(...eventCalendarAgentResultTemp.newItems.map((item) => item.rawItem));



        if (!eventCalendarAgentResultTemp.finalOutput) {

            throw new Error("Agent result is undefined");

        }



        const eventCalendarAgentResult = {

          output_text: JSON.stringify(eventCalendarAgentResultTemp.finalOutput),

          output_parsed: eventCalendarAgentResultTemp.finalOutput

        };

        return eventCalendarAgentResult;

      } else if (classificationResult.output_parsed.category == "general") {

        const generalAgentResultTemp = await runner.run(

          generalAgent,

          [

            ...conversationHistory,

            {

              role: "user",

              content: [

                {

                  type: "input_text",

                  text: ` ${workflow.input_as_text}`

                }

              ]

            }

          ]

        );

        conversationHistory.push(...generalAgentResultTemp.newItems.map((item) => item.rawItem));



        if (!generalAgentResultTemp.finalOutput) {

            throw new Error("Agent result is undefined");

        }



        const generalAgentResult = {

          output_text: generalAgentResultTemp.finalOutput ?? ""

        };

        return generalAgentResult;

      } else {

        const generalAgentResultTemp = await runner.run(

          generalAgent,

          [

            ...conversationHistory,

            {

              role: "user",

              content: [

                {

                  type: "input_text",

                  text: ` ${workflow.input_as_text}`

                }

              ]

            }

          ]

        );

        conversationHistory.push(...generalAgentResultTemp.newItems.map((item) => item.rawItem));



        if (!generalAgentResultTemp.finalOutput) {

            throw new Error("Agent result is undefined");

        }



        const generalAgentResult = {

          output_text: generalAgentResultTemp.finalOutput ?? ""

        };

        return generalAgentResult;

      }

    }

  });

}
