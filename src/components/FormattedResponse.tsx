"use client";

import React from "react";

interface FormattedResponseProps {
  content: string;
}

const FormattedResponse: React.FC<FormattedResponseProps> = ({ content }) => {
  // Parse the content to identify different sections
  const sections = parseContent(content);

  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        switch (section.type) {
          case "procedure":
            return <ProcedureBlock key={index} content={section.content} />;
          case "caution":
            return <CautionBlock key={index} content={section.content} />;
          case "apparatus":
            return <ApparatusBlock key={index} content={section.content} />;
          case "text":
          default:
            return <TextBlock key={index} content={section.content} />;
        }
      })}
    </div>
  );
};

// Helper function to parse content into sections
function parseContent(content: string) {
  const sections = [];

  // Check if content contains table-like data with numbers and page references
  if (/\d+\.\s+[\w\s]+\s+\d+(\s*\n|\s*$)/.test(content)) {
    // This looks like an index or table of contents
    return [{
      type: "text",
      content: "I found information about various food adulteration testing methods in the FSSAI manual. Please specify which food item you're interested in testing."
    }];
  }

  // Split content by double newlines to get paragraphs
  const paragraphs = content.split(/\n\n+/);

  let currentSection = {
    type: "text",
    content: "",
  };

  for (const paragraph of paragraphs) {
    const trimmedPara = paragraph.trim();

    // Skip empty paragraphs
    if (!trimmedPara) continue;

    // Skip paragraphs that are just page numbers or indices
    if (/^\d+$/.test(trimmedPara) || /^\d+\.\s+[\w\s]+\s+\d+$/.test(trimmedPara)) {
      continue;
    }

    // Check for section types based on keywords and patterns
    if (
      /^(procedure|steps|method|how to|instructions|test|detection):/i.test(trimmedPara) ||
      /^[ivxIVX]+\.\s/.test(trimmedPara) ||
      /^\d+\.\s/.test(trimmedPara) ||
      trimmedPara.toLowerCase() === "procedure"
    ) {
      // If we have content in the current section, push it
      if (currentSection.content) {
        sections.push({ ...currentSection });
      }
      currentSection = {
        type: "procedure",
        content: trimmedPara,
      };
    } else if (
      /^(caution|warning|note|attention|safety precautions):/i.test(trimmedPara) ||
      trimmedPara.toLowerCase().includes("caution:") ||
      trimmedPara.toLowerCase().includes("warning:") ||
      trimmedPara.toLowerCase().includes("safety precautions")
    ) {
      if (currentSection.content) {
        sections.push({ ...currentSection });
      }
      currentSection = {
        type: "caution",
        content: trimmedPara,
      };
    } else if (
      /^(apparatus|equipment|materials|requirements|you will need):/i.test(trimmedPara) ||
      trimmedPara.toLowerCase() === "apparatus"
    ) {
      if (currentSection.content) {
        sections.push({ ...currentSection });
      }
      currentSection = {
        type: "apparatus",
        content: trimmedPara,
      };
    } else {
      // If this is part of the current section, append it
      if (currentSection.content) {
        currentSection.content += "\n\n" + trimmedPara;
      } else {
        currentSection.content = trimmedPara;
      }
    }
  }

  // Add the last section if it has content
  if (currentSection.content) {
    sections.push(currentSection);
  }

  return sections;
}

// Component for regular text blocks
const TextBlock: React.FC<{ content: string }> = ({ content }) => {
  // Check if the content has bold markers
  const hasBold = content.includes("**");

  if (hasBold) {
    // Replace **text** with <strong>text</strong>
    const formattedContent = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    return (
      <div className="text-gray-800">
        <div dangerouslySetInnerHTML={{ __html: formattedContent.replace(/\n/g, "<br />") }} />
      </div>
    );
  }

  return (
    <div className="text-gray-800">
      {content.split("\n").map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < content.split("\n").length - 1 && <br />}
        </React.Fragment>
      ))}
    </div>
  );
};

// Component for procedure blocks
const ProcedureBlock: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
      <div className="text-blue-900">
        {content.split("\n").map((line, i) => {
          // Check if this is a numbered step
          if (/^\d+\.\s/.test(line)) {
            return (
              <p key={i} className={`${i > 0 ? "mt-2" : ""} font-medium`}>
                {line}
              </p>
            );
          }
          return (
            <p key={i} className={i > 0 ? "mt-2" : ""}>
              {line}
            </p>
          );
        })}
      </div>
    </div>
  );
};

// Component for caution blocks
const CautionBlock: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md">
      <div className="text-amber-900">
        {content.split("\n").map((line, i) => (
          <p key={i} className={i > 0 ? "mt-2" : ""}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
};

// Component for apparatus blocks
const ApparatusBlock: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-md">
      <div className="text-purple-900">
        {content.split("\n").map((line, i) => (
          <p key={i} className={i > 0 ? "mt-2" : ""}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
};



export default FormattedResponse;

