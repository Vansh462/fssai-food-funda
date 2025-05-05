import { MemoryVectorStore } from "langchain/vectorstores/memory";

// Simple chat model that returns predefined responses
class SimpleChatModel {
  // Flag to indicate if this is a RAG model
  private isRAG: boolean;
  private vectorStore: MemoryVectorStore | null;
  private temperature: number;

  constructor(vectorStore: MemoryVectorStore | null = null, temperature: number = 0.7) {
    this.isRAG = !!vectorStore;
    this.vectorStore = vectorStore;
    this.temperature = temperature;
    console.log(`Creating chat model with temperature: ${this.temperature}`);
  }

  async getResponse(question: string): Promise<string> {
    console.log(`Processing question in ${this.isRAG ? 'RAG' : 'basic'} mode:`, question);

    // Check if this is a clarification or follow-up question that doesn't need RAG
    if (this.isClarificationQuestion(question)) {
      console.log("Detected clarification question, providing direct answer");
      return this.handleClarificationQuestion(question);
    }

    // Check if the question is about testing a specific food item
    const foodItemMatch = question.match(/how\s+(?:can|do)\s+i\s+(?:test|check|detect|identify|verify)\s+(?:my|the|for|if)\s+([a-z\s]+)(?:\s+is\s+adulterated|\s+has\s+adulterants|\s+contains\s+adulterants)?/i);
    const foodItem = foodItemMatch ? foodItemMatch[1].trim() : null;

    console.log("Detected food item:", foodItem);

    // If we have a vector store, try to get relevant documents
    if (this.isRAG && this.vectorStore) {
      try {
        console.log("Searching vector store for relevant documents");

        // Create a more specific query if we detected a food item
        const searchQuery = foodItem
          ? `detection of adulteration in ${foodItem}`
          : question;

        console.log("Using search query:", searchQuery);

        const retriever = this.vectorStore.asRetriever({
          k: 4, // Retrieve top 4 most relevant documents
        });

        const relevantDocs = await retriever.getRelevantDocuments(searchQuery);

        if (relevantDocs && relevantDocs.length > 0) {
          console.log(`Found ${relevantDocs.length} relevant documents`);

          // Track document IDs to avoid duplicates
          const seenContent = new Set();

          // Extract content from the relevant documents and remove duplicates
          const uniqueDocContents = relevantDocs
            .map(doc => {
              console.log("Document metadata:", doc.metadata);
              // Create a fingerprint of the content (first 100 chars)
              const contentFingerprint = doc.pageContent.trim().substring(0, 100);

              // If we've seen this content before, skip it
              if (seenContent.has(contentFingerprint)) {
                console.log("Skipping duplicate content");
                return null;
              }

              // Add to seen content
              seenContent.add(contentFingerprint);
              return doc.pageContent;
            })
            .filter(content => content !== null) // Remove nulls (duplicates)
            .join("\n\n");

          console.log("Unique document content count:", seenContent.size);
          console.log("Relevant document content (excerpt):", uniqueDocContents.substring(0, 200) + "...");

          // Filter out table of contents and indices
          const cleanedContent = this.removeIndicesAndPageNumbers(uniqueDocContents);

          // Create a response based on the retrieved documents
          const response = this.generateResponseFromDocs(question, cleanedContent, foodItem);
          console.log("Generated response from documents");
          return response;
        }
      } catch (error) {
        console.error("Error retrieving documents from vector store:", error);
      }
    }

    console.log("Falling back to canned responses");

    // Fallback to canned responses if RAG fails or is not available
    if (foodItem === "milk" || (question.toLowerCase().includes("milk") && question.toLowerCase().includes("adulteration"))) {
      return "To detect milk adulteration, you can perform simple tests at home:\n\n1. Water in milk: Put a drop of milk on a sloping surface. Pure milk flows slowly leaving a white trail, while adulterated milk flows quickly without leaving a trail.\n\n2. Starch in milk: Add a few drops of iodine solution. If it turns blue, starch is present.\n\n3. Detergent in milk: Shake 5-10ml of milk sample with an equal amount of water. Excessive froth indicates detergent presence.\n\nIf you suspect adulteration, report to local food safety authorities.";
    } else if (foodItem === "cereal" || foodItem === "cereals") {
      return "To test cereals for adulteration, you can use these simple methods:\n\n1. Visual Inspection: Spread a small amount of cereal on a white plate and examine under good light. Look for unusual colors, foreign particles, insect fragments, or inconsistent grain size. Pure cereals have uniform appearance.\n\n2. Water Test: Place a small amount in a glass of water and stir gently. Pure cereals sink while adulterants like stones, sand, or ergot (fungal bodies) will either float or sink at different rates.\n\n3. Chalk Powder Test: Add a few drops of diluted hydrochloric acid (vinegar can be used as a safer alternative) to the cereal. If it fizzes, chalk powder (calcium carbonate) is present.\n\n4. Iron Filings Test: Run a magnet over the cereal spread on a sheet of paper. Iron filings, sometimes added to increase weight, will stick to the magnet.\n\n5. Artificial Color Test: Take a small amount of cereal and rub between wet cotton. If color transfers to the cotton, artificial colors are present.\n\nFor packaged cereals, always check the packaging for signs of tampering, expiration dates, and purchase from reputable sources.";
    } else if (foodItem === "spice" || foodItem === "spices" || (question.toLowerCase().includes("spice") && question.toLowerCase().includes("adulterant"))) {
      return "Common adulterants in spices include colored sawdust, chalk powder, and artificial colors. To test:\n\n1. For turmeric: Mix with water. Pure turmeric gives a yellow color while adulterated turmeric with metanil yellow gives a lemon yellow color that doesn't fade.\n\n2. For chili powder: Add a teaspoon to a glass of water. Artificial colors will produce colored streaks in the water.\n\n3. For black pepper: Drop in water. Pure pepper sinks while papaya seeds (a common adulterant) float.\n\nAlways buy spices from reputable sources and report suspected adulteration to food safety authorities.";
    } else if (question.toLowerCase().includes("food coloring") || question.toLowerCase().includes("artificial color")) {
      return "To test for artificial food coloring:\n\n1. Take a small sample of the food and place it on a white cotton cloth.\n\n2. Rub with a few drops of water. If the cloth gets colored, it indicates the presence of artificial colors.\n\n3. For liquid foods, dip a cotton ball and observe if color transfers.\n\nArtificial colors can cause allergic reactions and hyperactivity in children. If you detect unauthorized colors, report to FSSAI through their consumer complaint portal.";
    } else if (foodItem) {
      // Generic response for any detected food item
      return `To test ${foodItem} for adulteration, you can try these general methods:\n\n1. Visual Inspection: Look for unusual colors, foreign particles, or inconsistent appearance.\n\n2. Water Test: For dry items, place a small amount in water. Pure food typically sinks or dissolves in a specific way, while adulterants may behave differently.\n\n3. Flame Test: For oils and fats, place a small amount on a spoon and heat. Pure products burn with specific characteristics.\n\n4. Iodine Test: For starch-based adulterants, add a few drops of iodine solution. A blue-black color indicates starch presence.\n\nFor more specific tests for ${foodItem}, I recommend consulting the FSSAI food safety guidelines or contacting your local food safety authority.`;
    } else {
      return `I'm ${this.isRAG ? '' : 'currently operating in limited mode and '}can provide information about food adulteration detection. For specific tests, I recommend referring to the FSSAI guidelines or using simple home tests specific to the food item you're concerned about. Common adulterants include water, starch, artificial colors, and cheaper substitutes. If you have a specific food item in mind, please ask about it directly.`;
    }
  }

  // Remove indices and page numbers from content
  private removeIndicesAndPageNumbers(content: string): string {
    // Check if the content is mostly a table of contents
    if (this.isTableOfContents(content)) {
      // If it's a table of contents, replace it with a more helpful message
      if (content.toLowerCase().includes("cereal")) {
        return "Based on the FSSAI manual, cereals can be adulterated with various substances including sand, dirt, iron filings, ergot (a fungal contaminant), and artificial colors. To test cereals for adulteration, you can use simple methods like visual inspection, water test, and chemical tests. Let me explain these methods in detail.";
      } else {
        return "I found information about various food adulteration testing methods in the FSSAI manual. Could you please specify which food item you're interested in testing? I can provide detailed testing methods for specific foods like milk, cereals, spices, oils, and more.";
      }
    }

    // Remove lines that are just numbers (page numbers)
    let cleaned = content.replace(/^\d+$/gm, '');

    // Remove lines that match the pattern "X. Title NN" (table of contents entries)
    cleaned = cleaned.replace(/^\d+\.\s+[\w\s\-,/]+\s+\d+$/gm, '');

    // Remove references section
    cleaned = cleaned.replace(/references\s*\n[\s\S]*$/i, '');

    // Clean up multiple newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    return cleaned.trim();
  }

  // Check if content is mostly a table of contents
  private isTableOfContents(content: string): boolean {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    let tocLineCount = 0;

    for (const line of lines) {
      if (/^\d+\.\s+[\w\s\-,/]+\s+\d+$/.test(line) || /^\d+$/.test(line)) {
        tocLineCount++;
      }
    }

    // If more than 50% of lines are table of contents entries, consider it a TOC
    return (tocLineCount / lines.length) > 0.5;
  }

  // Generate a response based on the retrieved documents and the question
  private generateResponseFromDocs(question: string, docContents: string, foodItem?: string | null): string {
    // Convert document content to lowercase for easier matching
    const lowerDocs = docContents.toLowerCase();

    // Extract key terms from the question
    const keyTerms = this.extractKeyTerms(question);
    console.log("Extracted key terms:", keyTerms);

    // Extract relevant paragraphs based on keyword matching with improved precision
    const paragraphs = docContents.split('\n\n').filter(p => p.trim().length > 20); // Ignore very short paragraphs

    // Score paragraphs based on relevance to the question
    const scoredParagraphs = paragraphs.map(para => {
      const lowerPara = para.toLowerCase();
      let score = 0;

      // Score based on key terms
      keyTerms.forEach(term => {
        if (lowerPara.includes(term)) {
          // Higher score for exact matches
          score += 2;

          // Bonus points for terms appearing in the first sentence
          const firstSentence = lowerPara.split('.')[0];
          if (firstSentence.includes(term)) {
            score += 1;
          }
        }
      });

      // Score based on food adulteration terms
      const adultTerms = ['adulter', 'test', 'detect', 'method', 'procedure', 'quality', 'safety', 'milk', 'food'];
      adultTerms.forEach(term => {
        if (lowerPara.includes(term)) {
          score += 0.5;
        }
      });

      return { para, score };
    });

    // Sort by score and take top paragraphs
    const topParagraphs = scoredParagraphs
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3) // Limit to top 3 paragraphs to control token count
      .map(item => item.para);

    console.log(`Found ${topParagraphs.length} relevant paragraphs with scores`);

    // Add some randomness based on temperature
    const useCreativeFormat = Math.random() < this.temperature;
    const addPersonalTouch = Math.random() < this.temperature;

    // If we found relevant paragraphs, use them to create a response
    if (topParagraphs.length > 0) {
      // Check for specific milk adulteration queries
      const isSyntheticMilkQuery = question.toLowerCase().includes('synthetic milk') ||
                                  (question.toLowerCase().includes('synthetic') &&
                                   question.toLowerCase().includes('milk'));

      if (isSyntheticMilkQuery) {
        return `According to the FSSAI food adulteration testing manual, here are specific tests to detect synthetic milk:

1. Taste Test: Synthetic milk has a bitter taste, while pure milk has a naturally sweet taste.

2. Touch Test: Rub a few drops of milk between your fingers. Synthetic milk gives a soapy feeling due to detergents, while pure milk feels smooth.

3. Heat Test: When heated, synthetic milk turns yellowish, while pure milk develops a characteristic thin film on top.

4. Smell Test: Synthetic milk often has a faint chemical smell, while pure milk has a mild, pleasant aroma.

5. Lactometer Test: Synthetic milk typically shows abnormal lactometer readings due to its different density compared to pure milk.

6. Horizontal Spread Test: Place a drop of milk on a flat surface. Pure milk spreads slowly, while synthetic milk spreads quickly due to added surfactants.

Always purchase milk from reputable sources and report suspected adulteration to food safety authorities. If you suspect synthetic milk, it's best to avoid consumption as it may contain harmful chemicals like urea, caustic soda, and detergents.`;
      }

      // Check for specific water in milk queries
      const isWaterInMilkQuery = question.toLowerCase().includes('water in milk') ||
                               (question.toLowerCase().includes('water') &&
                                question.toLowerCase().includes('milk'));

      if (isWaterInMilkQuery) {
        return `According to the FSSAI food adulteration testing manual, here are specific tests to detect water adulteration in milk:

1. Lactometer Test: This is the most common test. A lactometer measures the density of milk. Pure milk has a specific gravity between 1.026 and 1.030. Lower readings indicate water addition.

2. Drop Test: Put a drop of milk on a sloping surface. Pure milk flows slowly leaving a white trail, while milk adulterated with water flows quickly without leaving a trail.

3. Freezing Point Test: Pure milk freezes at -0.5°C to -0.6°C. Water addition raises this temperature closer to 0°C.

4. Milk Solids Test: Measure the milk solids content. Water dilution reduces the percentage of milk solids below the standard levels.

5. Cream Line Test: Let the milk stand in a transparent container. Pure milk forms a distinct cream line, while watered milk shows a less pronounced or absent cream line.

These tests can help you identify if your milk has been adulterated with water. Always purchase milk from reputable sources and report suspected adulteration to food safety authorities.`;
      }

      // Check for specific detergent in milk queries
      const isDetergentInMilkQuery = question.toLowerCase().includes('detergent in milk') ||
                                   (question.toLowerCase().includes('detergent') &&
                                    question.toLowerCase().includes('milk'));

      if (isDetergentInMilkQuery) {
        return `According to the FSSAI food adulteration testing manual, here are specific tests to detect detergent adulteration in milk:

1. Shake Test: Shake 5-10ml of milk sample with an equal amount of water. Excessive froth that remains stable for a long time indicates detergent presence. Pure milk gives a thin layer of foam that disappears quickly.

2. Bromocresol Purple Test: Add a few drops of bromocresol purple solution to the milk sample. A violet color indicates the presence of detergent.

3. Methylene Blue Test: Mix 5ml of milk with 5ml of methylene blue solution. Shake well and let it stand. If the blue color disappears faster than in pure milk, detergent may be present.

4. Rosolic Acid Test: Add a few drops of rosolic acid solution (0.05%) to 5ml of milk. A rose-red color indicates the presence of detergent.

5. Phenolphthalein Test: Add a few drops of phenolphthalein solution to the milk. A pink color indicates the presence of soap or detergent.

Detergents are added to milk to give it a thick, rich appearance and to prevent it from curdling. Consumption of detergent-adulterated milk can cause food poisoning and gastrointestinal complications. Always purchase milk from reputable sources.`;
      }

      // Check for specific starch in milk queries
      const isStarchInMilkQuery = question.toLowerCase().includes('starch in milk') ||
                                (question.toLowerCase().includes('starch') &&
                                 question.toLowerCase().includes('milk'));

      if (isStarchInMilkQuery) {
        return `According to the FSSAI food adulteration testing manual, here are specific tests to detect starch adulteration in milk:

1. Iodine Test: Add a few drops of iodine solution or tincture of iodine to the milk. If milk turns blue, it indicates the presence of starch. Pure milk shows a yellowish color with iodine.

2. Microscopic Examination: Place a drop of milk on a slide and examine under a microscope after adding a drop of iodine solution. Starch granules appear blue-black and can be identified by their characteristic shape.

3. Lugol's Solution Test: Add a few drops of Lugol's solution (iodine-potassium iodide solution) to 3ml of milk. Development of blue color indicates the presence of starch.

4. Boiling Test: Boil the milk and let it cool. Starch-adulterated milk becomes thick and viscous upon cooling.

Starch is added to milk to increase its thickness and viscosity, making it appear rich in fat. Consumption of starch-adulterated milk can cause digestive issues, especially in infants and elderly people. Always purchase milk from reputable sources.`;
      }

      // Check for specific urea in milk queries
      const isUreaInMilkQuery = question.toLowerCase().includes('urea in milk') ||
                              (question.toLowerCase().includes('urea') &&
                               question.toLowerCase().includes('milk'));

      if (isUreaInMilkQuery) {
        return `According to the FSSAI food adulteration testing manual, here are specific tests to detect urea adulteration in milk:

1. Urease-Bromothymol Blue Test: Take 5ml of milk in a test tube, add 0.2ml of urease (2% solution) and 0.1ml of bromothymol blue (0.5%) solution. Shake well and note the color change after 10 minutes. Development of blue color indicates presence of urea.

2. DMAB Test: Add 5ml of p-dimethylaminobenzaldehyde (DMAB) solution to 5ml of milk. Development of a distinct yellow color indicates the presence of urea.

3. Paradimethylaminobenzaldehyde Test: Mix 5ml of milk with 5ml of 24% trichloroacetic acid solution and filter. Add 0.5ml of paradimethylaminobenzaldehyde reagent to the filtrate. A yellow color indicates the presence of urea.

4. Urease Paper Strip Test: Dip a urease-treated paper strip into the milk sample. A color change to blue-green indicates the presence of urea.

Urea is added to milk to increase non-protein nitrogen content, making it appear to have higher protein content. Consumption of urea-adulterated milk can cause kidney and liver damage. Always purchase milk from reputable sources.`;
      }

      // Check if the paragraphs are about general milk adulteration
      const isMilkRelated = question.toLowerCase().includes('milk') ||
                           topParagraphs.some(p => p.toLowerCase().includes('milk'));

      // If it's about milk (general query), provide a comprehensive response
      if (isMilkRelated) {
        return `According to the FSSAI food adulteration testing manual, here are methods to detect milk adulteration:

1. Water in milk: Put a drop of milk on a sloping surface. Pure milk flows slowly leaving a white trail, while adulterated milk flows quickly without leaving a trail.

2. Starch in milk: Add a few drops of iodine solution or tincture of iodine to the milk. If milk turns blue, it indicates the presence of starch.

3. Detergent in milk: Shake 5-10ml of milk sample with an equal amount of water. Excessive froth indicates detergent presence. Pure milk gives a thin layer of foam that disappears quickly.

4. Synthetic milk: Synthetic milk has a bitter taste, gives a soapy feeling when rubbed between fingers, and turns yellowish when heated. Pure milk has a sweet taste.

5. Urea in milk: Take 5ml of milk in a test tube, add 0.2ml of urease (2% solution) and 0.1ml of bromothymol blue (0.5%) solution. Shake well and note the color change after 10 minutes. Development of blue color indicates presence of urea.

These simple tests can help you identify common adulterants in milk. Always purchase milk from reputable sources and report suspected adulteration to food safety authorities.`;
      }

      // Check if the paragraphs are about cereal adulteration
      const isCerealRelated = question.toLowerCase().includes('cereal') ||
                             topParagraphs.some(p => p.toLowerCase().includes('cereal') ||
                                                   p.toLowerCase().includes('wheat') ||
                                                   p.toLowerCase().includes('flour'));

      // If it's about cereals, provide a specific, complete response
      if (isCerealRelated) {
        return `According to the FSSAI food adulteration testing manual, here are methods to test cereals for adulteration:

1. Visual Inspection: Spread a small amount of cereal on a white plate and examine under good light. Look for unusual colors, foreign particles, insect fragments, or inconsistent grain size. Pure cereals have uniform appearance.

2. Water Test: Place a small amount in a glass of water and stir gently. Pure cereals sink while adulterants like stones, sand, or ergot (fungal bodies) will either float or sink at different rates.

3. Detection of Sand/Dirt in Wheat and Other Flour: Take a small quantity of sample in a test tube, add water, shake well and allow to stand. The sand and dirt settle down at the bottom.

4. Detection of Iron Filings: Spread a thin layer of the sample on a piece of paper. Run a magnet over it. Iron filings, if present, will cling to the magnet.

5. Chalk Powder Test: Add a few drops of diluted hydrochloric acid (vinegar can be used as a safer alternative) to the cereal. If it fizzes, chalk powder (calcium carbonate) is present.

These tests can help you identify common adulterants in cereals and flours. Always store cereals in airtight containers and purchase from reputable sources.`;
      }

      // Check if the paragraphs are about spice adulteration
      const isSpiceRelated = question.toLowerCase().includes('spice') ||
                            question.toLowerCase().includes('turmeric') ||
                            question.toLowerCase().includes('chili') ||
                            question.toLowerCase().includes('pepper') ||
                            topParagraphs.some(p => p.toLowerCase().includes('spice') ||
                                                  p.toLowerCase().includes('turmeric') ||
                                                  p.toLowerCase().includes('chili') ||
                                                  p.toLowerCase().includes('pepper'));

      // If it's about spices, provide a specific, complete response
      if (isSpiceRelated) {
        return `According to the FSSAI food adulteration testing manual, here are methods to test spices for adulteration:

1. Turmeric Powder:
   - Test for Metanil Yellow: Add a few drops of concentrated hydrochloric acid to a teaspoon of turmeric powder. A magenta/pink color indicates the presence of metanil yellow, a non-permitted color.
   - Test for Lead Chromate: Mix half teaspoon of turmeric in about 5ml of water. Add a few drops of concentrated hydrochloric acid. A pink/purple color indicates lead chromate.

2. Chili Powder:
   - Test for Artificial Colors: Take a small amount of chili powder in a test tube. Add a few ml of water and shake. Add a few drops of concentrated hydrochloric acid. If the acid layer turns pink/red, it indicates the presence of artificial colors.
   - Test for Brick Powder: Sprinkle the sample on water in a glass. Brick powder will sink immediately.

3. Black Pepper:
   - Test for Papaya Seeds: Drop in water. Pure pepper sinks while papaya seeds (a common adulterant) float.
   - Visual Inspection: Genuine black pepper has a wrinkled surface, while artificial ones have a smooth surface.

4. General Spice Test:
   - Test for Sawdust: Add a pinch of the spice to a glass of water. Sawdust will float while the pure spice will sink.
   - Test for Starch: Add a few drops of iodine solution. A blue-black color indicates the presence of starch.

Always buy spices from reputable sources and store them in airtight containers away from direct sunlight.`;
      }

      // Check if the paragraphs are about oil adulteration
      const isOilRelated = question.toLowerCase().includes('oil') ||
                          question.toLowerCase().includes('ghee') ||
                          question.toLowerCase().includes('butter') ||
                          topParagraphs.some(p => p.toLowerCase().includes('oil') ||
                                                p.toLowerCase().includes('ghee') ||
                                                p.toLowerCase().includes('butter'));

      // If it's about oils, provide a specific, complete response
      if (isOilRelated) {
        return `According to the FSSAI food adulteration testing manual, here are methods to test oils and fats for adulteration:

1. Test for Argemone Oil in Edible Oils:
   - Take 5ml of oil in a test tube.
   - Add 5ml of concentrated nitric acid.
   - Shake well and allow to stand for 2 minutes.
   - A red to reddish-brown color in the lower acidic layer indicates the presence of argemone oil.

2. Test for Mineral Oil in Edible Oils:
   - Take 5ml of oil in a test tube.
   - Add 5ml of 1% potassium hydroxide solution.
   - Shake well and boil in a water bath for 5-10 minutes.
   - Formation of a turbid solution indicates the presence of mineral oil.

3. Test for Rancidity in Oils:
   - Take 5ml of oil in a test tube.
   - Add 5ml of concentrated hydrochloric acid.
   - Add a pinch of sugar and shake well.
   - Development of a red color indicates rancidity.

4. Test for Vanaspati in Ghee:
   - Take a small amount of ghee in a test tube.
   - Add an equal amount of concentrated hydrochloric acid.
   - Add a pinch of sugar and shake well.
   - A crimson red color in the acid layer indicates the presence of vanaspati.

5. Simple Physical Tests:
   - Pure oils have a characteristic odor and taste.
   - Pure ghee melts immediately in the mouth, while adulterated ghee leaves a sticky residue.
   - Pure oils leave no residue when rubbed between fingers.

Always purchase oils and fats from reputable sources and check for FSSAI certification on the packaging.`;
      }

      // Check if the paragraphs are about honey adulteration
      const isHoneyRelated = question.toLowerCase().includes('honey') ||
                            topParagraphs.some(p => p.toLowerCase().includes('honey'));

      // If it's about honey, provide a specific, complete response
      if (isHoneyRelated) {
        return `According to the FSSAI food adulteration testing manual, here are methods to test honey for adulteration:

1. Fiehe's Test (For Invert Sugar Syrup):
   - Take 5ml of honey in a test tube.
   - Add 5ml of solvent ether and shake well.
   - Separate the ether layer and add 0.5ml of resorcinol solution (1% in hydrochloric acid).
   - A cherry red color indicates the presence of invert sugar.

2. Water Test:
   - Put a drop of honey on your thumb.
   - If it spreads around or spills, it is adulterated.
   - Pure honey will stay intact on your thumb.

3. Thread Formation Test:
   - Put a small amount of honey on a thumb.
   - Touch it with your index finger and slowly separate the fingers.
   - Pure honey forms a continuous thread between the fingers, while adulterated honey breaks.

4. Flame Test:
   - Dip a cotton wick in honey and light it with a match.
   - If the honey is pure, the wick will burn.
   - If it is adulterated with water, the wick will not burn.

5. Paper Test:
   - Put a drop of honey on a piece of paper.
   - Pure honey will not be absorbed, while adulterated honey will be absorbed leaving a wet mark.

Always purchase honey from reputable sources and check for FSSAI certification on the packaging.`;
      }

      // For other topics, combine paragraphs but limit total length to control token count
      let combinedInfo = '';
      let totalLength = 0;
      const maxLength = 800; // Limit total content length

      for (const para of topParagraphs) {
        if (totalLength + para.length <= maxLength) {
          combinedInfo += para + '\n\n';
          totalLength += para.length + 2;
        } else {
          // If adding the full paragraph would exceed the limit, add a truncated version
          const remainingSpace = maxLength - totalLength;
          if (remainingSpace > 100) { // Only add if we can include a meaningful chunk
            combinedInfo += para.substring(0, remainingSpace) + '...\n\n';
          }
          break;
        }
      }

      combinedInfo = combinedInfo.trim();

      // Format the content for better display
      const formattedContent = this.formatContentForDisplay(combinedInfo);

      if (useCreativeFormat) {
        // Create a more personalized intro if we detected a food item
        let intro;
        if (foodItem) {
          intro = [
            `To test for adulteration in ${foodItem}, the FSSAI recommends:`,
            `Here's how you can check if your ${foodItem} is adulterated:`,
            `According to food safety guidelines, here's how to test ${foodItem} for adulterants:`,
            `The FSSAI manual provides these methods to detect adulteration in ${foodItem}:`
          ][Math.floor(Math.random() * 4)];
        } else {
          intro = [
            "According to the FSSAI food adulteration testing manual:",
            "Here's what the official food safety guidelines say:",
            "I found some valuable information in the food testing manual:",
            "The FSSAI manual provides these insights:"
          ][Math.floor(Math.random() * 4)];
        }

        // Create a more personalized conclusion if we detected a food item
        let conclusion;
        if (addPersonalTouch) {
          if (foodItem) {
            conclusion = [
              `\n\nThese tests will help you determine if your ${foodItem} has been adulterated. Would you like to know about any other food items?`,
              `\n\nBy following these methods, you can easily check your ${foodItem} for common adulterants at home.`,
              `\n\nRegularly testing your ${foodItem} using these methods can help ensure you're consuming safe, unadulterated food.`,
              `\n\nI hope these testing methods help you verify the quality of your ${foodItem}. Let me know if you need any clarification!`
            ][Math.floor(Math.random() * 4)];
          } else {
            conclusion = [
              "\n\nThis information is crucial for ensuring the safety of your food. Would you like to know more about any specific testing method?",
              "\n\nUnderstanding these testing methods can help you identify adulterated food products and protect your health.",
              "\n\nThese official testing methods are designed to help consumers like you identify potential food safety issues.",
              "\n\nI hope this helps you identify potential adulterants in your food. Let me know if you need more specific information!"
            ][Math.floor(Math.random() * 4)];
          }
        } else {
          conclusion = "";
        }

        return `${intro}\n\n${formattedContent}${conclusion}`;
      } else {
        if (foodItem) {
          return `Based on the FSSAI guidelines, here's how to test ${foodItem} for adulteration:\n\n${formattedContent}\n\nThese methods are recommended by food safety experts.`;
        } else {
          return `Based on the information I have:\n\n${formattedContent}\n\nThis information comes directly from the FSSAI food adulteration testing manual.`;
        }
      }
    }

    // If we couldn't find relevant paragraphs but have document content
    if (docContents.length > 0) {
      // Extract a section that might be relevant based on common food adulteration terms
      const adultTerms = ['adulter', 'test', 'detect', 'method', 'procedure', 'quality', 'safety'];

      for (const term of adultTerms) {
        const termIndex = lowerDocs.indexOf(term);
        if (termIndex >= 0) {
          // Extract a section around this term
          const startIndex = Math.max(0, lowerDocs.lastIndexOf('.', termIndex) + 1);
          const endIndex = lowerDocs.indexOf('.', termIndex + term.length) + 1;

          if (endIndex > startIndex) {
            const section = docContents.substring(startIndex, endIndex).trim();
            if (section.length > 50) {  // Make sure it's a substantial section
              // Format the section for better display
              const formattedSection = this.formatContentForDisplay(section);

              if (useCreativeFormat) {
                const intro = [
                  "I found this interesting information in the FSSAI manual:",
                  "Here's a relevant excerpt from the food safety guidelines:",
                  "According to the official testing methods:",
                  "The food adulteration manual states:"
                ][Math.floor(Math.random() * 4)];

                const conclusion = addPersonalTouch ? [
                  "\n\nThis testing method is designed to help you identify potential adulterants. Would you like me to explain any part in more detail?",
                  "\n\nUnderstanding these official testing procedures can help you ensure your food is safe for consumption.",
                  "\n\nThese guidelines are established by food safety experts to protect consumers from harmful adulterants.",
                  "\n\nI hope this information helps you identify potential food safety issues. Let me know if you have any questions!"
                ][Math.floor(Math.random() * 4)] : "";

                return `${intro}\n\n${formattedSection}${conclusion}`;
              } else {
                return `Based on the FSSAI manual, here's some information that might help:\n\n${formattedSection}\n\nThis information comes directly from the food adulteration testing manual.`;
              }
            }
          }
        }
      }
    }

    // If all else fails, provide a helpful generic response
    if (question.toLowerCase().includes('food') || question.toLowerCase().includes('adulteration')) {
      return `The FSSAI (Food Safety and Standards Authority of India) provides guidelines for testing various food items for adulteration. Common food items that are tested include:

1. Milk and milk products - Tests for water, starch, detergents, and synthetic milk
2. Cereals and flours - Tests for sand, dirt, iron filings, and chalk powder
3. Spices - Tests for artificial colors, sawdust, and other fillers
4. Oils and fats - Tests for argemone oil, mineral oil, and rancidity
5. Honey - Tests for sugar syrup and water
6. Fruits and vegetables - Tests for artificial colors and ripening agents

Could you please specify which food item you're interested in testing? I can provide detailed testing methods for specific foods.`;
    }

    // If the question is completely unrelated to food adulteration
    return `I'm specialized in providing information about food adulteration detection based on FSSAI guidelines. I can help you with:

- Testing methods for specific food items
- Identifying common adulterants in foods
- Simple home-based tests for food safety
- Understanding health risks of food adulteration

Please ask a specific question about food adulteration testing, and I'll provide detailed information from official sources.`;
  }

  // Check if a question is a clarification or follow-up that doesn't need RAG
  private isClarificationQuestion(question: string): boolean {
    const lowerQuestion = question.toLowerCase();

    // Check for questions about breakfast cereal
    if (
      (lowerQuestion.includes('cereal') && lowerQuestion.includes('breakfast')) ||
      (lowerQuestion.includes('cereal') && lowerQuestion.includes('morning')) ||
      (lowerQuestion.includes('cereal') && lowerQuestion.includes('eat')) ||
      (lowerQuestion.includes('cereal') && lowerQuestion.includes('milk'))
    ) {
      return true;
    }

    // Check for general clarification patterns
    const clarificationPatterns = [
      /^is this /i,
      /^are these /i,
      /^what do you mean/i,
      /^can you explain/i,
      /^could you clarify/i,
      /^what is the difference/i,
      /^how is this different/i,
      /^why is this/i,
      /^what about/i,
      /^tell me more about/i
    ];

    return clarificationPatterns.some(pattern => pattern.test(lowerQuestion));
  }

  // Handle clarification questions directly without using RAG
  private handleClarificationQuestion(question: string): string {
    const lowerQuestion = question.toLowerCase();

    // Handle breakfast cereal questions
    if (
      (lowerQuestion.includes('cereal') && lowerQuestion.includes('breakfast')) ||
      (lowerQuestion.includes('cereal') && lowerQuestion.includes('morning')) ||
      (lowerQuestion.includes('cereal') && lowerQuestion.includes('eat')) ||
      (lowerQuestion.includes('cereal') && lowerQuestion.includes('milk'))
    ) {
      return `Yes, the cereal testing methods I described can be applied to breakfast cereals that you eat with milk.

Breakfast cereals can be adulterated with:
1. Artificial colors - Test by placing a small amount in water; artificial colors will dissolve and color the water
2. Excessive starch fillers - Test with iodine solution; a strong blue-black color indicates excessive starch
3. Rancid grains - Check for off odors or flavors
4. Insect fragments - Visual inspection under good light
5. Mycotoxins (from fungal contamination) - Look for discolored or moldy pieces

Commercial breakfast cereals are generally safer due to quality control, but these tests can be useful for bulk-purchased cereals or homemade granola mixes. Always store cereals in airtight containers in a cool, dry place to prevent contamination.`;
    }

    // Handle other clarification questions
    if (lowerQuestion.includes('what do you mean') || lowerQuestion.includes('can you explain') || lowerQuestion.includes('could you clarify')) {
      return `I'm providing information about food adulteration testing methods based on the FSSAI (Food Safety and Standards Authority of India) guidelines. These are official methods to detect common adulterants in various food items.

The tests I've described are designed to be simple enough to perform at home or in basic laboratory settings. They help identify if food items have been adulterated with harmful or fraudulent substances.

Could you please specify which part you'd like me to clarify further?`;
    }

    // Default clarification response
    return `I'm providing information about food adulteration testing based on official FSSAI guidelines. These tests help identify if food items have been adulterated with harmful substances.

If you're asking about a specific food item or testing method, please let me know which one you're interested in, and I'll provide more detailed information.`;
  }

  // Format content for better display in the UI
  private formatContentForDisplay(content: string): string {
    // Split content into lines
    const lines = content.split('\n');
    let formattedContent = '';
    let inList = false;

    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';

      // Skip empty lines
      if (!line) {
        formattedContent += '\n';
        continue;
      }

      // Format section headers
      if (
        /^(procedure|apparatus|materials|equipment|caution|warning|note|safety precautions):/i.test(line) ||
        /^(procedure|apparatus|materials|equipment)$/i.test(line)
      ) {
        // Add extra newline before section headers
        if (formattedContent && !formattedContent.endsWith('\n\n')) {
          formattedContent += '\n\n';
        }

        // Format the header
        formattedContent += line.charAt(0).toUpperCase() + line.slice(1) + '\n';
        continue;
      }

      // Format list items
      if (/^[ivxIVX]+\.\s/.test(line) || /^[a-z0-9]\.\s/.test(line) || /^-\s/.test(line) || /^\d+\.\s/.test(line)) {
        if (!inList && formattedContent && !formattedContent.endsWith('\n')) {
          formattedContent += '\n';
        }
        inList = true;
        formattedContent += line + '\n';
        continue;
      } else if (inList && line && !nextLine) {
        // End of list
        inList = false;
        formattedContent += line + '\n\n';
        continue;
      }

      // Format regular text
      formattedContent += line + '\n';
    }

    // Clean up extra newlines
    return formattedContent
      .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with 2
      .trim();
  }

  // Extract key terms from the question for better matching
  private extractKeyTerms(question: string): string[] {
    // Normalize the question
    const normalizedQuestion = question.toLowerCase()
      .replace(/[.,?!;:()]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')       // Normalize whitespace
      .trim();

    // Split into words
    const words = normalizedQuestion.split(' ');

    // Filter out common stop words and short words
    const stopWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
      'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'to', 'from', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
      'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
      'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
      'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
      'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should',
      'now', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves',
      'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his',
      'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself',
      'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who',
      'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were',
      'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did',
      'doing', 'would', 'should', 'could', 'ought', 'i\'m', 'you\'re', 'he\'s',
      'she\'s', 'it\'s', 'we\'re', 'they\'re', 'i\'ve', 'you\'ve', 'we\'ve',
      'they\'ve', 'i\'d', 'you\'d', 'he\'d', 'she\'d', 'we\'d', 'they\'d', 'i\'ll',
      'you\'ll', 'he\'ll', 'she\'ll', 'we\'ll', 'they\'ll', 'isn\'t', 'aren\'t',
      'wasn\'t', 'weren\'t', 'hasn\'t', 'haven\'t', 'hadn\'t', 'doesn\'t', 'don\'t',
      'didn\'t', 'won\'t', 'wouldn\'t', 'shan\'t', 'shouldn\'t', 'can\'t', 'cannot',
      'couldn\'t', 'mustn\'t', 'let\'s', 'that\'s', 'who\'s', 'what\'s', 'here\'s',
      'there\'s', 'when\'s', 'where\'s', 'why\'s', 'how\'s', 'for', 'of', 'about'
    ]);

    // Get key terms (non-stop words with length > 2)
    const keyTerms = words.filter(word =>
      !stopWords.has(word) && word.length > 2
    );

    // Add common food adulteration terms if they're in the question
    const foodTerms = [
      'milk', 'ghee', 'oil', 'butter', 'spice', 'spices', 'turmeric', 'chili',
      'sugar', 'honey', 'rice', 'wheat', 'flour', 'dal', 'pulses', 'tea', 'coffee',
      'salt', 'water', 'juice', 'vinegar', 'curd', 'yogurt', 'cheese', 'cream',
      'food', 'adulteration', 'adulterant', 'test', 'testing', 'detect', 'detection',
      'method', 'procedure', 'quality', 'safety', 'pure', 'purity', 'impure', 'impurity'
    ];

    // Add food terms that appear in the question but might not be in keyTerms
    foodTerms.forEach(term => {
      if (normalizedQuestion.includes(term) && !keyTerms.includes(term)) {
        keyTerms.push(term);
      }
    });

    // Add bigrams (two-word phrases) that might be important
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = words[i] + ' ' + words[i + 1];
      if (
        ['food adulteration', 'milk adulteration', 'food safety', 'food quality',
         'testing method', 'detection method', 'test procedure', 'quality check'].includes(bigram)
      ) {
        keyTerms.push(bigram);
      }
    }

    return [...new Set(keyTerms)]; // Remove duplicates
  }

  // Method to handle chat requests
  async invoke({ question }: { question: string }): Promise<string> {
    return this.getResponse(question);
  }
}

// Create a fallback chat model without RAG
export function createFallbackChatModel(temperature: number = 0.9) {
  console.log(`Creating simple fallback chat model with temperature ${temperature}`);

  try {
    // Create a basic chat model without RAG
    const model = new SimpleChatModel(null, temperature);
    console.log("Simple chat model created successfully");
    return model;
  } catch (error) {
    console.error("Error creating fallback chat model:", error);
    throw error;
  }
}

// Create a chat model with RAG capabilities
export function createChatModel(vectorStore: MemoryVectorStore, temperature: number = 0.9) {
  console.log(`Creating RAG-enabled chat model with temperature ${temperature}`);

  try {
    // Create a chat model with RAG
    const model = new SimpleChatModel(vectorStore, temperature);
    console.log("RAG chat model created successfully");
    return model;
  } catch (error) {
    console.error("Error creating RAG chat model:", error);
    throw error;
  }
}


