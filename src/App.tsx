import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SurveyProvider } from './hooks/useSurvey';
import SurveyTimer from './components/SurveyTimer';
import SiteHeader from './components/SiteHeader';
import ConsentPage from './pages/ConsentPage';
import WelcomePage from './pages/WelcomePage';
import IdentifierPage from './pages/IdentifierPage';
import DemographicPage from './pages/DemographicPage';
import ClimateRiskPage from './pages/ClimateRiskPage';
import StressPage from './pages/StressPage';
import ImageComparisonPage from './pages/ImageComparisonPage';
import ThankYouPage from './pages/ThankYouPage';

export default function App() {
  return (
    <BrowserRouter>
      <SurveyProvider>
        <SurveyTimer />
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <SiteHeader />
          <main className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<IdentifierPage />} />
              <Route path="/consent" element={<ConsentPage />} />
              <Route path="/welcome" element={<WelcomePage />} />
              <Route
                path="/survey/comparison/:index"
                element={<ImageComparisonPage />}
              />
              <Route path="/survey/demographics" element={<DemographicPage />} />
              <Route path="/survey/climate" element={<ClimateRiskPage />} />
              <Route path="/survey/stress" element={<StressPage />} />
              <Route path="/thank-you" element={<ThankYouPage />} />
            </Routes>
          </main>
        </div>
      </SurveyProvider>
    </BrowserRouter>
  );
}
