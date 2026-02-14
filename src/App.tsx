import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SurveyProvider } from './hooks/useSurvey';
import WelcomePage from './pages/WelcomePage';
import DemographicPage from './pages/DemographicPage';
import ImageComparisonPage from './pages/ImageComparisonPage';
import ThankYouPage from './pages/ThankYouPage';

export default function App() {
  return (
    <BrowserRouter>
      <SurveyProvider>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/survey/demographic" element={<DemographicPage />} />
          <Route
            path="/survey/comparison/:index"
            element={<ImageComparisonPage />}
          />
          <Route path="/thank-you" element={<ThankYouPage />} />
        </Routes>
      </SurveyProvider>
    </BrowserRouter>
  );
}
