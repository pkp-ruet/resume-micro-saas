// src/components/HtmlPreview.jsx
import React from "react";

/**
 * HtmlPreview Component
 * Renders HTML content within a sandboxed iframe for security and isolation.
 * This component mirrors the exact design for the HTML preview section
 * that was previously in App.jsx.
 *
 * @param {object} props - Component props.
 * @param {string} props.htmlContent - The HTML string to be displayed in the iframe.
 */
const HtmlPreview = ({ htmlContent }) => {
  // If no HTML content is provided, display a placeholder.
  if (!htmlContent) {
    return (
      <div className="mt-8 border-t-2 border-gray-200 pt-6">
        <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">
          CV Preview
        </h2>
        <div className="bg-white border border-gray-300 rounded-lg shadow-inner min-h-[250px] max-h-[500px] flex items-center justify-center">
          <p className="text-gray-500 text-lg">
            Your CV preview will appear here.
          </p>
        </div>
      </div>
    );
  }

  // Create a Blob URL for the HTML content.
  // This is a secure and efficient way to render dynamic HTML in an iframe
  // without relying on data URIs which can have length limitations and security risks.
  const htmlBlob = new Blob([htmlContent], { type: "text/html" });
  const htmlUrl = URL.createObjectURL(htmlBlob);

  return (
    <div className="mt-8 border-t-2 border-gray-200 pt-6">
      <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">
        CV Preview
      </h2>
      <div className="bg-white border border-gray-300 rounded-lg shadow-inner min-h-[250px] max-h-[500px] flex items-center justify-center">
        <iframe
          title="CV Preview"
          src={htmlUrl} // Use the Blob URL as the iframe source
          className="w-full h-[500px] rounded-lg border-0"
          // Sandbox attribute enhances security by restricting what the iframe can do.
          // allow-scripts: Allows JavaScript to run within the iframe.
          // allow-same-origin: Allows content to be treated as being from the same origin,
          //                    important for scripts to function if they expect it.
          sandbox="allow-scripts allow-same-origin"
        ></iframe>
      </div>
    </div>
  );
};

export default HtmlPreview;
