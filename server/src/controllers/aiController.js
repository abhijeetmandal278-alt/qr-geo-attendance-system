// @desc    Generate an AI event description using Google Gemini
// @route   POST /api/ai/generate-description
// @access  Private (organizer only)
async function generateEventDescription(req, res) {
  try {
    const { name, venue, date, time } = req.body;

    if (!name || !venue) {
      return res.status(400).json({ error: "Event name and venue are required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "AI service is not configured" });
    }

    const prompt = `Write a short, engaging event description (2-3 sentences, no more than 60 words) for the following event. Do not use markdown formatting, just plain text.

Event Name: ${name}
Venue: ${venue}
Date: ${date || "TBD"}
Time: ${time || "TBD"}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      return res.status(502).json({ error: "AI generation failed. Try again." });
    }

    const data = await response.json();
    const description = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!description) {
      return res.status(502).json({ error: "AI returned an empty response. Try again." });
    }

    return res.status(200).json({ description });
  } catch (err) {
    console.error("AI description error:", err.message);
    return res.status(500).json({ error: "Server error during AI generation" });
  }
}

module.exports = { generateEventDescription };