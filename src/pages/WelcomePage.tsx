import { useNavigate } from 'react-router-dom';

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Environmental Risk Perception in New England
        </h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Thank you for participating in this research study. This survey will
          show you pairs of street view images and ask questions about
          environmental risk, then ask you about your background and perceived
          stress. It should take about 10-15 minutes to complete.
        </p>
        <button
          onClick={() => navigate('/survey/identifier')}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Begin Survey
        </button>
      </div>
    </div>
  );
}
