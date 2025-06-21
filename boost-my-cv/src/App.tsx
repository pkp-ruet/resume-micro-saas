import PDFUploader from "./components/PDFUploader.tsx";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-3xl font-bold mb-4 text-center text-blue-600">
          Boost My CV
        </h1>
        <PDFUploader />
      </div>
    </div>
  );
}

export default App;
