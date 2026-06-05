const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY || '';
let genAI = null;

if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('[AI Client] Gemini API client successfully initialized.');
  } catch (err) {
    console.error(`[AI Client] Error initializing Gemini client: ${err.message}`);
  }
} else {
  console.warn('[AI Client] GEMINI_API_KEY is not set or placeholder. Falling back to dynamic mock engine.');
}

// Resilient generative call helper
const callGemini = async (prompt, systemInstruction = '') => {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        systemInstruction: systemInstruction 
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return text;
    } catch (err) {
      console.error(`[AI Client] Live API call failed: ${err.message}. Invoking simulated engine...`);
      return getSimulatedResponse(prompt);
    }
  } else {
    return getSimulatedResponse(prompt);
  }
};

// High-fidelity fallback engine mimicking Gemini output
function getSimulatedResponse(prompt) {
  const normalized = prompt.toLowerCase();

  // 0. AI Cashback Optimizer advice
  if (normalized.includes('cashback') || normalized.includes('luxe points') || normalized.includes('wallet') || normalized.includes('redeem') || normalized.includes('points')) {
    return "Advising a balanced deployment: Redefine your checkout value by redeeming a portion of your points (e.g. 50-70%) to offset shipping thresholds, while preserving the remaining balance for high-tier category multipliers during next month's curated member event.";
  }

  // 1. Natural Language Search parsing
  if (normalized.includes('search') || normalized.includes('filter') || normalized.includes('under') || normalized.includes('need a')) {
    // Attempt to extract budget
    const priceMatch = normalized.match(/under\s*(?:rs\.?\s*)?(\d+)/i) || normalized.match(/below\s*(?:rs\.?\s*)?(\d+)/i) || normalized.match(/budget\s*(?:of\s*)?(\d+)/i);
    const maxPrice = priceMatch ? parseInt(priceMatch[1], 10) : 100000;
    
    let category = 'Electronics';
    if (normalized.includes('laptop')) category = 'Laptops';
    else if (normalized.includes('shoe') || normalized.includes('sneaker')) category = 'Footwear';
    else if (normalized.includes('phone') || normalized.includes('mobile')) category = 'Mobiles';
    else if (normalized.includes('coat') || normalized.includes('dress') || normalized.includes('trench')) category = 'Apparel';
    
    let textQuery = '';
    if (normalized.includes('gaming')) textQuery = 'gaming';
    else if (normalized.includes('running')) textQuery = 'running';
    else if (normalized.includes('camera')) textQuery = 'camera';

    return JSON.stringify({
      category: category,
      maxPrice: maxPrice,
      query: textQuery,
      tags: textQuery ? [textQuery] : []
    }, null, 2);
  }

  // 2. AI Review Summary
  if (normalized.includes('review') || normalized.includes('pros') || normalized.includes('cons') || normalized.includes('summary')) {
    return JSON.stringify({
      pros: [
        "Premium aesthetic and build quality",
        "Exceptional functional performance matching top-tier benchmarks",
        "Generates rewards points and wallet bonuses instantly"
      ],
      cons: [
        "Slight premium pricing markup",
        "Limited catalog availability in secondary categories"
      ]
    }, null, 2);
  }

  // 3. AI Product Comparison
  if (normalized.includes('compare') || normalized.includes('better for') || normalized.includes('which is')) {
    return JSON.stringify({
      specifications: [
        { feature: "Performance", itemA: "Top Tier (Ultra Fast Core)", itemB: "Mid Tier (Balanced Core)" },
        { feature: "Design Spec", itemA: "Full Metal Frame (Premium)", itemB: "Premium Polymer" },
        { feature: "Value Index", itemA: "Excellent investment", itemB: "Great budget option" }
      ],
      prosA: ["Highest performance limits", "Lifetime warranty inclusion"],
      prosB: ["More portable weight", "Lower price gateway"],
      recommendation: "If coding and AI training represents your primary daily pipeline, Item A stands out as the optimal choice. If lighter weight and general productivity fits your workflow, choose Item B."
    }, null, 2);
  }

  // 4. Smart Budget Shopping
  if (normalized.includes('budget') || normalized.includes('lump sum') || normalized.includes('best possible')) {
    return JSON.stringify({
      strategy: "Optimized for core utility, maximizing free delivery offsets.",
      itemsToSelect: [
        { name: "Premium Accessories Package", estimatePrice: 420 },
        { name: "Sleek Carry Case", estimatePrice: 890 }
      ],
      reasoning: "Configures essential support blocks while reserving the remaining budget for future loyalty points credits."
    }, null, 2);
  }

  // Default fallback text
  return "AI service processed your request successfully under premium sandbox mode.";
}

module.exports = {
  callGemini
};
