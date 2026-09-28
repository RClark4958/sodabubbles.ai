import './Hero.css';

export function Hero() {
  return (
    <header className="hero">
      <h1 className="hero__title">sodabubbles.ai</h1>
      <p className="hero__tagline">
        Projects exploring emergent AI technologies — RAG, vector search, computer vision, tool use, and more
      </p>
      <p className="hero__byline">by Rick Clark</p>
    </header>
  );
}
