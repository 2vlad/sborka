import { BrowserRouter, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SessionPage from "./pages/SessionPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/session/:sessionId" element={<SessionPage />} />
      </Routes>
    </BrowserRouter>
  );
}
