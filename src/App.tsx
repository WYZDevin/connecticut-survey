import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SurveyProvider } from './hooks/useSurvey';
import SurveyTimer from './components/SurveyTimer';
import WelcomePage from './pages/WelcomePage';
import IdentifierPage from './pages/IdentifierPage';
import DemographicPage from './pages/DemographicPage';
import StressPage from './pages/StressPage';
import ImageComparisonPage from './pages/ImageComparisonPage';
import ThankYouPage from './pages/ThankYouPage';

export default function App() {
  return (
    <BrowserRouter>
      <SurveyProvider>
        <SurveyTimer />
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/survey/identifier" element={<IdentifierPage />} />
          <Route path="/survey/demographics" element={<DemographicPage />} />
          <Route path="/survey/stress" element={<StressPage />} />
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
