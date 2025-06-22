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
 * @param {React.RefObject} props.iframeRef - Ref object to attach to the iframe.
 */
const HtmlPreview = ({ htmlContent, iframeRef }) => {
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
          src={htmlUrl}
          className="w-full h-[500px] rounded-lg border-0"
          sandbox="allow-scripts allow-same-origin"
          ref={iframeRef} // Assign the ref here
        ></iframe>
      </div>
    </div>
  );
};

export default HtmlPreview;
