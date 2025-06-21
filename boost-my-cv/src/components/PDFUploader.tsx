import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
// FIX: Use 'type' for type-only imports when verbatimModuleSyntax is enabled
import type {
  TextItem,
  TextMarkedContent,
} from "pdfjs-dist/types/src/display/api";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PDFUploader = () => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const extractText = async (file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async function () {
      const typedarray = new Uint8Array(this.result as ArrayBuffer);
      const pdf = await pdfjsLib.getDocument(typedarray).promise;

      let finalText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        const pageText = content.items
          .map((item: TextItem | TextMarkedContent) => {
            if ("str" in item) {
              return item.str;
            }
            return "";
          })
          .join(" ");

        finalText += pageText + "\n\n";
      }

      setText(finalText);
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      extractText(file);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
         file:rounded-full file:border-0 file:text-sm file:font-semibold
         file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {loading ? (
        <p className="text-gray-600">Extracting text, please wait...</p>
      ) : (
        <div className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-[60vh] overflow-y-auto">
          {text || "Upload a PDF to see the extracted text here."}
        </div>
      )}
    </div>
  );
};

export default PDFUploader;
