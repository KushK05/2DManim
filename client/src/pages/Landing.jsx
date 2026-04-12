import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './landing.css';
  
const CORE_FEATURES = [
  {
    title: 'PROMPT TO MOTION',
    copy: 'Create full animation scaffolds from one instruction with deterministic layout and timing.',
  },
  {
    title: 'CUSTOM SCENE EDIT',
    copy: 'Generated Manim code stays editable so you can fine-tune camera moves and transitions.',
  },
  {
    title: 'LOSSLESS EXPORT',
    copy: 'Ship MP4 outputs with production-safe defaults and optional high-quality render pipeline.',
  },
];

const STEPS = [
  {
    title: '1. TYPE PROMPT',
    copy: 'Describe the concept and visual flow.',
  },
  {
    title: '2. GENERATE SCENE',
    copy: 'Gemini produces structured Manim code.',
  },
  {
    title: '3. EXPORT VIDEO',
    copy: 'Render in your environment and publish.',
  },
];

export default function Landing() {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const scrollTarget = location.state?.scrollTarget || location.hash.replace('#', '');

    if (!scrollTarget) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const target = document.getElementById(scrollTarget);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash, location.state]);

  return (
    <div className="landing-page">
      <header className="landing-topbar">
        <div className="landing-container">
          <Link to="/" className="landing-brand">
            <span className="landing-brand-dot" />
            <span>2DManim</span>
          </Link>
          <nav className="landing-nav">
            <Link to="/#core">Features</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/#workflow">Showcase</Link>
            <Link to="/#workflow">Docs</Link>
          </nav>
          <Link to={user ? '/studio' : '/login'} className="landing-secondary-btn">
            Login
          </Link>
          <Link to={user ? '/studio' : '/register'} className="landing-primary-btn">
            Get Started
          </Link>
        </div>
      </header>

      <section className="landing-container landing-hero">
        <h1>
          ANIMATE YOUR
          <br />
          IDEAS WITH
          <br />
          PRECISION
        </h1>
        <p>
          The high-performance motion engine for creators.
          <br />
          Generate professional 2D visuals from simple descriptions.
        </p>
        <div className="landing-hero-actions">
          <Link to={user ? '/studio' : '/register'} className="landing-primary-btn">START CREATING NOW</Link>
          <Link to="/#workflow" className="landing-secondary-btn">View Showcase</Link>
        </div>
      </section>

      <section className="landing-container landing-stats">
        <div>
          <strong>2.5M+</strong>
          <span>Generated scenes</span>
        </div>
        <div>
          <strong>150K</strong>
          <span>Creators</span>
        </div>
        <div>
          <strong>&lt;30s</strong>
          <span>Average draft time</span>
        </div>
        <div>
          <strong>99.9%</strong>
          <span>Runtime reliability</span>
        </div>
      </section>

      <section id="core" className="landing-container landing-section">
        <h2 className="landing-heading">CORE ENGINE</h2>
        <div className="landing-grid">
          {CORE_FEATURES.map((item) => (
            <article key={item.title} className="landing-card">
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="landing-container landing-section">
        <h2 className="landing-heading center">HOW IT WORKS</h2>
        <div className="landing-steps">
          {STEPS.map((step) => (
            <article key={step.title} className="landing-step">
              <span className="landing-step-icon" />
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <h2>READY TO MOVE?</h2>
        <p>Join thousands of teams building motion visuals with confidence.</p>
        <div className="landing-hero-actions">
          <Link to={user ? '/studio' : '/register'} className="landing-primary-btn">CREATE YOUR FIRST ANIMATION</Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container">
          <span>© 2026 2DManim</span>
          <div className="landing-footer-nav">
            <Link to="/#workflow">PRODUCT</Link>
            <Link to="/#workflow">SUPPORT</Link>
            <Link to="/#workflow">COMPANY</Link>
            <Link to="/#workflow">LEGAL</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
