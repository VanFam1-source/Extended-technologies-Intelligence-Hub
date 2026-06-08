import pptxgen from "pptxgenjs";
import { NewsArticle, StrategicAnalysis } from "../types";

export type SlideLayoutType = 'executive' | 'visual' | 'detail';

export const generatePowerPoint = async (
  article: NewsArticle,
  analysis: StrategicAnalysis,
  imageBase64: string,
  layout: SlideLayoutType = 'executive'
) => {
  try {
    const pres = new pptxgen();

    // Safe Access: Ensure arrays exist even if API returned null/undefined parts
    const safeAnalysis: StrategicAnalysis = {
        detailedTalkingPoints: Array.isArray(analysis?.detailedTalkingPoints) ? analysis.detailedTalkingPoints : ["No detailed points available."],
        slideHighlights: Array.isArray(analysis?.slideHighlights) ? analysis.slideHighlights : ["No highlights available."]
    };

    // Set Meta Data
    pres.author = "Extended Technologies Hub";
    pres.company = "Partner Sales";
    pres.title = article.title;

    // Define Colors (Slate Palette)
    const BG_COLOR = "020617"; // Slate 950
    const ACCENT_COLOR = "3b82f6"; // Blue 500
    const TEXT_MAIN = "f8fafc"; // Slate 50
    const TEXT_MUTED = "94a3b8"; // Slate 400
    const CARD_BG = "1e293b"; // Slate 800

    // 1. Add Master Slide Definition
    pres.defineSlideMaster({
      title: "MASTER_SLIDE",
      background: { color: BG_COLOR },
      objects: [
        {
          rect: { x: 0, y: 0, w: "100%", h: 0.75, fill: { color: CARD_BG } } // Header Bar
        },
        {
            text: {
                text: "PARTNER INTELLIGENCE BRIEF",
                options: { x: 0.3, y: 0.2, w: 5, h: 0.4, fontFace: "Arial", fontSize: 10, color: TEXT_MUTED, bold: true, charSpacing: 3 }
            }
        },
        {
            line: { x: 0.3, y: 5.2, w: 9.4, h: 0, line: { color: ACCENT_COLOR, width: 2 } } // Blue Accent Line (Footer)
        },
        {
             text: {
                text: `Source: ${article.partnerName} | ${article.publishedDate}`,
                options: { x: 0.3, y: 5.3, w: 8, h: 0.3, fontFace: "Arial", fontSize: 9, color: "64748b" }
            }
        }
      ],
    });

    const slide = pres.addSlide({ masterName: "MASTER_SLIDE" });

    // *** KEY CHANGE: ADD SPEAKER NOTES ***
    // We put the full summary and detailed talking points here, keeping the slide clean.
    const speakerNotes = `
EXECUTIVE SUMMARY:
${article.summary}

DETAILED TALKING POINTS:
${safeAnalysis.detailedTalkingPoints.map(p => `- ${p}`).join('\n')}
    `.trim();

    slide.addNotes(speakerNotes);


    // Common Headline (Consistent across layouts, though position might tweak slightly)
    slide.addText(article.title, {
      x: 0.3,
      y: 0.5,
      w: 9.4,
      h: 0.8,
      fontSize: 22,
      fontFace: "Arial",
      color: TEXT_MAIN,
      bold: true,
      valign: "middle"
    });

    // Use BRIEF Highlights for the Slide visuals
    const slideBullets = safeAnalysis.slideHighlights;

    // --- LAYOUT LOGIC ---

    if (layout === 'visual') {
        // LAYOUT: VISUAL IMPACT
        // Large Image Center, Brief points horizontal at bottom
        
        if (imageBase64) {
            slide.addImage({
                data: imageBase64,
                x: 0.5,
                y: 1.4,
                w: 8.9,
                h: 2.8, 
                sizing: { type: "contain", w: 8.9, h: 2.8 }
            });
        }

        // Talking points container
        slide.addShape(pres.ShapeType.rect, { x: 0.3, y: 4.3, w: 9.4, h: 0.8, fill: { color: "0f172a" }, line: { color: "1e293b" } });

        // Add concise talking points in columns or a flowing list
        const shortPoints = slideBullets.slice(0, 3).map(p => "• " + p).join("   ");
        slide.addText(shortPoints, {
            x: 0.4,
            y: 4.3,
            w: 9.2,
            h: 0.8,
            fontSize: 12, // Slightly larger for impact
            color: TEXT_MAIN,
            valign: "middle",
            align: "center"
        });

    } else if (layout === 'detail') {
        // LAYOUT: DEEP DIVE
        // Image Small Left, Summary Text Top Right, Points Bottom Right
        
        // Smaller Image
        if (imageBase64) {
            slide.addImage({
                data: imageBase64,
                x: 0.3,
                y: 1.5,
                w: 3.0,
                h: 3.0,
                sizing: { type: "contain", w: 3.0, h: 3.0 }
            });
        }

        // Section Header: Summary
        slide.addText("KEY HIGHLIGHTS", { x: 3.5, y: 1.5, w: 6, h: 0.3, fontSize: 10, color: ACCENT_COLOR, bold: true, charSpacing: 2 });
        
        // Bullet Points (Use the brief ones for readability, even in detail view)
        const bulletPoints = slideBullets.map(tp => ({ text: tp, options: { breakLine: true } }));
        slide.addText(bulletPoints, {
            x: 3.5,
            y: 1.8,
            w: 6.0,
            h: 2.0,
            fontSize: 14,
            color: TEXT_MAIN,
            bullet: { type: "number", color: ACCENT_COLOR },
            paraSpaceAfter: 10,
        });

        // Note: In "Deep Dive", users might expect more text, but we put the heavy text in Speaker Notes
        // to enforce the "Clean Slide" rule requested.
        slide.addText("See Speaker Notes for full analysis.", { 
            x: 3.5, y: 4.0, w: 6, h: 0.3, fontSize: 9, color: "64748b", italic: true 
        });

    } else {
        // LAYOUT: EXECUTIVE BRIEF (Default)
        // Image Left (Medium), Points Right (Large)

        if (imageBase64) {
            slide.addImage({
                data: imageBase64,
                x: 0.3,
                y: 1.6,
                w: 4.5,
                h: 3.5,
                sizing: { type: "contain", w: 4.5, h: 3.5 }
            });
        }

        // Header
        slide.addText("STRATEGIC SUMMARY", {
            x: 5,
            y: 1.6,
            w: 4.5,
            h: 0.3,
            fontSize: 10,
            color: ACCENT_COLOR, 
            bold: true,
            charSpacing: 2
        });

        // Content - Using the brief bullets
        const bulletPoints = slideBullets.map(tp => ({ text: tp, options: { breakLine: true } }));
        
        slide.addText(bulletPoints, {
            x: 5,
            y: 2.0,
            w: 4.7,
            h: 3,
            fontSize: 16, // Larger font for readability
            color: TEXT_MAIN,
            bullet: { type: "number", color: ACCENT_COLOR },
            paraSpaceAfter: 15,
            lineSpacing: 20
        });
    }

    // Save the Presentation
    const safeTitle = article.title.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
    await pres.writeFile({ fileName: `Brief_${article.partnerName}_${safeTitle}.pptx` });
    
  } catch (error) {
    console.error("Error generating PowerPoint:", error);
    throw new Error("Failed to generate PowerPoint slide.");
  }
};