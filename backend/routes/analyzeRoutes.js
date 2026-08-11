const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    const { language, code } = req.body;
    
    if (!code || code.trim().length === 0) {
        return res.status(400).json({ error: "Code is required" });
    }

    try {
        // Mocking AI analysis for time/space complexity and AI generation detection.
        // In a real application, this would call an LLM (e.g. OpenAI GPT-4 API)
        
        // --- AI Detection Logic ---
        let aiScore = Math.floor(Math.random() * 40) + 10;
        if (code.includes('def solve') || code.includes('class Solution')) aiScore += 20; 
        if (code.length < 50) aiScore += 10;
        if ((code.match(/#/g) || []).length > 3 || (code.match(/\/\//g) || []).length > 3) aiScore -= 20;
        aiScore = Math.max(1, Math.min(99, aiScore));
        const humanScore = 100 - aiScore;

        const isHighAI = aiScore >= 70;
        let confidenceLevel = "Medium";
        if (aiScore > 85 || aiScore < 15) confidenceLevel = "High";
        else if (aiScore > 40 && aiScore < 60) confidenceLevel = "Low";

        const prediction = isHighAI ? "Likely AI Generated" : "Likely Human Written";

        const aiSummary = isHighAI 
            ? "The code is a typical, clean implementation with generic naming and no business context, matching common AI-generated solutions, suggesting it is likely AI-generated."
            : "The code contains unique structural choices, personalized naming, or specific comments that suggest it was likely hand-written by a human.";

        const aiTraits = isHighAI ? [
            { title: "Naming Style", description: "Variable and function names are very generic and commonly used in algorithm examples, lacking custom or business-specific names." },
            { title: "Code Structure", description: "The code is extremely neat, concise, and stylistically uniform without extra comments or complex logic." },
            { title: "Typical AI Traits", description: "The solution follows a standard pattern frequently recommended by AI models; no customization or optimization beyond the known approach." },
            { title: "Business Footprints Missing", description: "No real business logic or domain-specific handling; the code only addresses a classic algorithm problem without exception handling." }
        ] : [
            { title: "Naming Style", description: "Variables have personalized or highly contextual names that deviate from typical boilerplate." },
            { title: "Code Structure", description: "The logic contains human-like idiosyncrasies or non-uniform styling typical of manual problem solving." },
            { title: "Custom Traits", description: "The solution uses a unique or non-standard approach to solve the problem, rather than the statistically most common answer." }
        ];

        // --- Complexity Logic ---
        const loopCount = (code.match(/for |while /g) || []).length;
        let tcAvg = "O(1)", tcBest = "O(1)", tcWorst = "O(1)";
        if (loopCount === 1) { tcAvg = "O(N)"; tcBest = "O(1)"; tcWorst = "O(N)"; }
        else if (loopCount === 2) { tcAvg = "O(N^2)"; tcBest = "O(N)"; tcWorst = "O(N^2)"; }
        else if (loopCount >= 3) { tcAvg = "O(N^3)"; tcBest = "O(N^2)"; tcWorst = "O(N^3)"; }

        let scEst = "O(1)";
        if (code.includes('[]') || code.includes('List') || code.includes('new Array') || code.includes('vector')) scEst = "O(N)";
        if (code.includes('[][]') || code.includes('Matrix') || code.includes('vector<vector')) scEst = "O(N^2)";

        const tcExplanation = `Detected ${loopCount} loops. Operations scale ${loopCount === 0 ? 'constantly' : loopCount === 1 ? 'linearly' : 'quadratically'} with input size.`;
        const scExplanation = scEst === "O(1)" ? "No additional large data structures detected." : "Uses additional array/list structures proportional to input size n.";

        // --- Code Quality Logic ---
        let readability = 100;
        const lines = code.split('\n');
        lines.forEach(line => { if (line.length > 80) readability -= 2; });
        readability = Math.max(10, readability);

        let naming = 100;
        const singleLetterMatches = code.match(/\b[a-zA-Z]\b/g) || [];
        naming -= (singleLetterMatches.length * 2);
        naming = Math.max(10, Math.min(100, naming));

        let functionDesign = 90;
        if (loopCount > 3) functionDesign -= 20;

        let commentQuality = 40;
        const commentCount = (code.match(/#|\/\//g) || []).length;
        commentQuality += (commentCount * 10);
        commentQuality = Math.min(100, commentQuality);

        let modularity = 70;
        const methodCount = (code.match(/def |class |function |public |private /g) || []).length;
        modularity += (methodCount * 10);
        modularity = Math.min(100, modularity);

        const qualityScore = Math.floor((readability + naming + functionDesign + commentQuality + modularity) / 5);

        res.json({
            aiDetection: {
                aiProbability: aiScore,
                humanProbability: humanScore,
                confidenceLevel,
                prediction,
                aiSummary,
                aiTraits
            },
            timeComplexity: {
                bestCase: tcBest,
                averageCase: tcAvg,
                worstCase: tcWorst,
                explanation: tcExplanation
            },
            spaceComplexity: {
                estimate: scEst,
                explanation: scExplanation
            },
            codeQuality: {
                score: qualityScore,
                metrics: {
                    readability,
                    naming,
                    functionDesign,
                    commentQuality,
                    modularity
                }
            }
        });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
