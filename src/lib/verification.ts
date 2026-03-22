import ZAI from 'z-ai-web-dev-sdk';
import { hashContent } from './auth';

interface VerificationResult {
  trustScore: number;
  analysis: string;
  flags: string[];
  contentHash: string;
}

// Analyze text for misinformation
export async function analyzeText(content: string): Promise<VerificationResult> {
  const contentHash = hashContent(content);

  try {
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are TruthLayer, an expert AI system that detects misinformation, fake news, and unreliable content. 

Analyze the given text and provide:
1. A trust score from 0-100 (100 = completely trustworthy, 0 = highly suspicious/misinformation)
2. A detailed analysis explaining your reasoning
3. Warning flags if any are detected

Consider these factors:
- Factual accuracy and verifiability
- Source credibility indicators
- Emotional manipulation language
- Logical fallacies
- Exaggeration or sensationalism
- Missing context
- Potential bias

Respond in this JSON format:
{
  "trustScore": <number 0-100>,
  "analysis": "<detailed explanation>",
  "flags": ["<flag1>", "<flag2>", ...]
}

Common flags: "unverified_claims", "emotional_language", "missing_sources", "sensationalist", "potential_bias", "outdated_info", "clickbait", "conspiracy_theory", "pseudoscience", "cherry_picked_data"`
        },
        {
          role: 'user',
          content: `Analyze this text for misinformation:\n\n${content}`
        }
      ],
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    // Parse JSON response
    let parsed;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      // Fallback if parsing fails
      parsed = {
        trustScore: 50,
        analysis: responseText,
        flags: ['analysis_unavailable']
      };
    }

    return {
      trustScore: Math.min(100, Math.max(0, parsed.trustScore || 50)),
      analysis: parsed.analysis || 'Analysis unavailable',
      flags: parsed.flags || [],
      contentHash
    };

  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      trustScore: 50,
      analysis: 'Unable to perform AI analysis. Please try again later.',
      flags: ['analysis_error'],
      contentHash
    };
  }
}

// Get trust level label
export function getTrustLabel(score: number): { label: string; color: string; description: string } {
  if (score >= 80) {
    return { label: 'Highly Trustworthy', color: 'green', description: 'This content appears reliable and well-sourced.' };
  } else if (score >= 60) {
    return { label: 'Mostly Trustworthy', color: 'lime', description: 'Content is generally reliable with minor concerns.' };
  } else if (score >= 40) {
    return { label: 'Mixed Reliability', color: 'yellow', description: 'Exercise caution. Some claims may be questionable.' };
  } else if (score >= 20) {
    return { label: 'Low Trust', color: 'orange', description: 'Significant concerns detected. Verify from other sources.' };
  } else {
    return { label: 'Untrustworthy', color: 'red', description: 'High likelihood of misinformation. Do not rely on this content.' };
  }
}
