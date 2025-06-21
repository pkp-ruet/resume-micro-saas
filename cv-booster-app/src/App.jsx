// src/App.jsx
import React, { useState, useCallback } from "react";
import pdfToText from "react-pdftotext";
import HtmlPreview from "./components/HtmlPreview"; // Import the new HtmlPreview component
import { fillHtmlTemplate } from "./utils/cvGenerator"; // Import the utility function for template filling

// Import the prompt content for the single LLM call (JSON output)
import initialLlmPromptText from "./initial-llm-prompt.txt?raw";

function App() {
  // State for file handling
  const [fileName, setFileName] = useState("");
  const [pdfError, setPdfError] = useState("");

  // States for loading and errors
  const [loading, setLoading] = useState(false); // Combined loading for all steps
  const [llmError, setLlmError] = useState("");

  // States for data
  const [initialLlmResponseText, setInitialLlmResponseText] = useState(""); // Raw JSON string from LLM
  const [llmHtmlOutput, setLlmHtmlOutput] = useState(""); // Final HTML string after template filling

  // Gemini API configuration
  // IMPORTANT: Keep this empty. Canvas environment injects the key securely at runtime.
  const apiKey = "AIzaSyD0kc9_eP5oNGF2sKZKQF5rp0_s7Hej9oY";
  const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  /**
   * Copies the initial LLM (JSON) response text to the clipboard.
   */
  const copyInitialLlmResponse = useCallback(() => {
    if (initialLlmResponseText) {
      const textarea = document.createElement("textarea");
      textarea.value = initialLlmResponseText;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        alert("LLM JSON Output copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy text:", err);
        alert("Failed to copy text. Please try again.");
      }
      document.body.removeChild(textarea);
    }
  }, [initialLlmResponseText]);

  /**
   * Sends the extracted text to the Gemini API to get structured JSON data.
   */
  const getStructuredDataFromLlm = useCallback(
    async (pdfText) => {
      setLlmError(""); // Clear previous errors
      if (!pdfText) {
        setLlmError("No PDF text to send to LLM for processing.");
        return null;
      }

      try {
        const chatHistory = [
          {
            role: "user",
            parts: [
              {
                text: `${initialLlmPromptText}\n\nRaw CV Text to Process:\n\`\`\`\n${pdfText}\n\`\`\``,
              },
            ],
          },
        ];
        const payload = { contents: chatHistory };

        const response = await fetch(geminiApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `HTTP error! Status: ${response.status}, Details: ${
              errorData.error || "Unknown error"
            }`
          );
        }

        const result = await response.json();
        let jsonString = "";

        if (
          result.candidates &&
          result.candidates.length > 0 &&
          result.candidates[0].content &&
          result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0
        ) {
          jsonString = result.candidates[0].content.parts[0].text;

          console.log("--- LLM Raw JSON Output ---");
          console.log(jsonString.trim()); // Log raw JSON to console

          setInitialLlmResponseText(jsonString.trim()); // Store for display

          // Attempt to parse JSON. Handle cases where LLM might wrap JSON in markdown code block.
          let parsedData;
          try {
            if (
              jsonString.startsWith("```json") &&
              jsonString.endsWith("```")
            ) {
              parsedData = JSON.parse(
                jsonString.substring(7, jsonString.length - 3).trim()
              );
            } else {
              parsedData = JSON.parse(jsonString);
            }
            return parsedData;
          } catch (parseError) {
            console.error("Failed to parse LLM JSON output:", parseError);
            setLlmError(
              "LLM provided invalid JSON. Please refine the prompt for structured output."
            );
            return null;
          }
        } else {
          throw new Error(
            "Unexpected response format from LLM or no content generated."
          );
        }
      } catch (err) {
        console.error("Error calling LLM:", err);
        setLlmError(`Failed to get response from LLM. Error: ${err.message}`);
        return null;
      }
    },
    [geminiApiUrl, initialLlmPromptText]
  );

  /**
   * Handles the file input change event.
   * Extracts text from PDF, sends it to LLM for JSON, then fills HTML template.
   */
  const handleFileChange = useCallback(
    async (event) => {
      const file = event.target.files[0];

      // Reset all states for a new file upload
      setFileName(file ? file.name : "");
      setPdfError("");
      setLlmError("");
      setInitialLlmResponseText("");
      setLlmHtmlOutput("");
      setLoading(false); // Reset overall loading

      if (!file) return;

      if (file.type !== "application/pdf") {
        setPdfError("Please upload a PDF file.");
        return;
      }

      setLoading(true); // Start overall loading indicator

      try {
        const text = await pdfToText(file);
        const trimmedText = text.trim();

        console.log("--- Extracted Text from PDF ---");
        console.log(trimmedText); // Log extracted text to console

        // Get structured JSON data from LLM (Stage 1)
        const cvData = await getStructuredDataFromLlm(trimmedText);

        if (cvData) {
          // Fill the HTML template with the received JSON data (Client-side)
          const generatedHtml = fillHtmlTemplate(cvData);
          setLlmHtmlOutput(generatedHtml);
        }
      } catch (err) {
        console.error("An error occurred during processing:", err);
        setLlmError(
          `Processing failed: ${err.message}. Please check console for details.`
        );
      } finally {
        setLoading(false); // End overall loading indicator
      }
    },
    [getStructuredDataFromLlm, fillHtmlTemplate]
  );

  return (
    // Main container for the application
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      {/* Central content card */}
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-5xl transform transition-all duration-300 hover:scale-[1.01] hover:shadow-3xl">
        {/* Application Title */}
        <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-6 tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            CV Booster
          </span>
          <br />
          <span className="text-xl text-gray-500 font-semibold block mt-2">
            Generate Elegant CVs from PDFs
          </span>
        </h1>

        {/* File Upload Section */}
        <div className="mb-8 border-b-2 border-gray-200 pb-6">
          <label
            htmlFor="pdf-upload"
            className="w-full flex justify-center items-center px-4 py-3 border border-dashed border-purple-400 rounded-lg cursor-pointer bg-purple-50 hover:bg-purple-100 transition duration-300 ease-in-out text-purple-700 font-medium text-lg shadow-sm hover:shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            {fileName ? `File Selected: ${fileName}` : "Click to Upload PDF"}
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf" // Restrict file selection to PDF files only
              onChange={handleFileChange} // Call handler when file changes
              className="hidden"
            />
          </label>
          {pdfError && (
            <p className="mt-4 text-center text-red-600 text-sm font-semibold p-2 bg-red-50 border border-red-200 rounded-md">
              {pdfError}
            </p>
          )}
        </div>

        {/* Loading Indicator for all stages */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500"></div>
            <p className="ml-4 text-gray-600 text-lg font-medium">
              Processing your CV...
            </p>
          </div>
        )}

        {/* LLM Raw JSON Output Display 
        {initialLlmResponseText && !loading && (
          <div className="mt-6 border-t-2 border-gray-200 pt-6">
            <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center flex items-center justify-center">
              LLM Structured Data Output
              {initialLlmResponseText && (
                <button
                  onClick={copyInitialLlmResponse}
                  className="ml-3 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold py-1 px-3 rounded-full transition duration-150 ease-in-out"
                  title="Copy LLM structured data"
                >
                  Copy
                </button>
              )}
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 min-h-[250px] max-h-[500px] overflow-y-auto shadow-inner text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
              {initialLlmResponseText}
            </div>
          </div>
        )}
          */}

        {/* Render the HtmlPreview component */}
        {llmHtmlOutput && <HtmlPreview htmlContent={llmHtmlOutput} />}

        {/* LLM Error Display */}
        {llmError && (
          <p className="mt-4 text-center text-red-600 text-sm font-semibold p-2 bg-red-50 border border-red-200 rounded-md">
            {llmError}
          </p>
        )}

        {/* Initial Prompt Message (when nothing is loaded/displayed) */}
        {!loading && !fileName && !llmHtmlOutput && !initialLlmResponseText && (
          <div className="text-center text-gray-500 py-10">
            <p className="text-lg">Upload your CV to see the magic!</p>
            <p className="text-sm mt-2">
              Your structured data and elegant HTML CV will appear here after
              processing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
