import { useNavigate } from 'react-router-dom';

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Connecticut Flood Risk Survey
        </h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Thank you for participating in this research study. This survey will
          ask you a few questions about your experience with natural disasters
          and then show you pairs of images to compare. It should take about 5
          minutes to complete.
        </p>
        <button
          onClick={() => navigate('/survey/demographic')}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Begin Survey
        </button>
      </div>
    </div>
  );
}
