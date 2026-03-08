import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Models to try in order: best first, then fallback
const MODELS = ["gemini-3-preview", "gemini-2.5-flash"];

const MASTER_PROMPT = `You are an AI system that verifies student activity documents based on the official activity points table of GPC Kothamangalam.

When a user uploads a document (certificate, letter, appreciation letter, or proof document), you must:

1. Extract the following:
   - Program Title
   - Category (must be one of: ncc, nss, disaster_management, sports, cultural, online_courses, competitions, conferences, paper_presentation, leadership, entrepreneurship, custom)
   - Level (must be one of: college, zonal, district, state, national, international)
   - Type of Participation (e.g., Participation / First Prize / Second Prize / Third Prize / Volunteer / Coordinator etc.)
   - Position (must be one of: first, second, third, participant, organizer, coordinator, sub_coordinator, volunteer, chairman, secretary, council_member, class_representative, or empty string if not applicable)
   - Duration (if mentioned)
   - Issuing Authority / Organization name
   - Start date (if visible, in YYYY-MM-DD format)
   - End date (if visible, in YYYY-MM-DD format)
   - Whether document appears valid (Yes/No)

2. Match the extracted data with the official activity marks table:

   NCC: Level I (Eligible for B Exam) = 30, Level II (B Certificate) = 10, Level III (C Certificate) = 10, Level IV (NIC/National Trekking/Pre-RD) = 10, Level V (Republic Day Parade/International) = 20. Max 50, Min 2 years.
   NSS: Level I (Certificate) = 30, Level II (Regional Camp) = 10, Level III (State Camp) = 10, Level IV (National Integration/Pre-RD) = 10, Level V (RD Parade/International) = 20. Max 50, Min 2 years.
   Disaster Management: Social Service (Rescue, Rehabilitation) = 20, Min 40 hours.
   Sports & Games: Participation = 2 per level (max 30). Prize: First = 5/5/6/8/10, Second = 4/4/5/6/8, Third = 3/3/4/4/6 across levels I-V.
   Cultural: Same as Sports prizes. Max 30.
   Online Courses (NPTEL, SWAYAM, Coursera): 30 marks.
   Competitions (IEEE, IET, ISTE): Level I=5, II=8, III=10, IV=15, V=20. Max 20.
   Conferences/Seminars: State=10, National=20, International=30.
   Paper/Poster Presentation: State=20, National=30, International=40.
   Leadership - Student Societies (2yr): Core Coordinator=15, Sub Coordinator=10, Volunteer=10.
   Leadership - College Association: Core=15, Sub=10, Volunteer=5.
   Leadership - Elected: Chairman=20, Secretary=15, Council Member=10, Class Rep=5.
   Entrepreneurship: IEDC Participation=10, Winning Competition=10-40, Hackathon=10-40, Innovation Certificate=40, Product Award=30, Tech Used by Industry=30, Venture Capital=30.

3. Return ONLY valid JSON in this exact format (no markdown, no explanation, no code fences):

{
  "title": "",
  "category": "",
  "level": "",
  "participation_type": "",
  "position": "",
  "duration": "",
  "issuing_authority": "",
  "start_date": "",
  "end_date": "",
  "verified": true,
  "marks_awarded": 0,
  "max_allowed_marks": 0,
  "remarks": ""
}

Rules:
- If required data is missing, set "verified": false and add explanation in remarks.
- If activity does not match approved categories, set category to "custom".
- Follow official mark distribution strictly.
- Do not return any explanation, only clean JSON.
- Output must be parseable JSON only, no wrapping.`;

/**
 * Extract activity details from a document image using Gemini Vision
 * Tries the best model first, falls back to secondary model on error.
 * @param {string} base64Data - Full data URL (data:image/png;base64,...)
 * @returns {object} Parsed JSON with extracted activity data
 */
export async function extractActivityFromDocument(base64Data) {
    // Parse the base64 data URL
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
        throw new Error("Invalid document format. Please upload a valid image or PDF.");
    }

    const mimeType = matches[1];
    const imageData = matches[2];

    let lastError = null;

    for (const modelName of MODELS) {
        try {
            console.log(`[Gemini] Trying model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const result = await model.generateContent([
                MASTER_PROMPT,
                {
                    inlineData: {
                        mimeType,
                        data: imageData,
                    },
                },
            ]);

            const response = result.response;
            const text = response.text().trim();

            // Clean up response: remove code fences if present
            let jsonText = text;
            if (jsonText.startsWith("```")) {
                jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
            }

            const parsed = JSON.parse(jsonText);
            console.log(`[Gemini] Successfully extracted using model: ${modelName}`);
            return parsed;
        } catch (error) {
            console.error(`[Gemini] Model ${modelName} failed:`, error.message);
            lastError = error;
            // Continue to next model
        }
    }

    // All models failed — throw a clean error
    const errorMsg = lastError?.message || "Unknown error";

    if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("rate")) {
        throw new Error("AI service is temporarily rate-limited. Please try again in a few minutes.");
    }
    if (errorMsg.includes("403") || errorMsg.includes("permission")) {
        throw new Error("AI service access denied. Please contact the administrator.");
    }
    if (errorMsg.includes("JSON") || errorMsg.includes("parse")) {
        throw new Error("AI could not parse the document. Please upload a clearer image.");
    }

    throw new Error("AI extraction service is temporarily unavailable. Please try again later or fill the form manually.");
}
