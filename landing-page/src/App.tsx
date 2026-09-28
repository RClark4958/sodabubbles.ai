import { Hero } from './components/Hero/Hero';
import { ProjectGrid } from './components/ProjectGrid/ProjectGrid';
import { Footer } from './components/Footer/Footer';
import './App.css';

export function App() {
  return (
    <div className="app">
      <div className="bg-blob bg-blob--purple" />
      <div className="bg-blob bg-blob--blue" />
      <Hero />
      <ProjectGrid />
      <Footer />
    </div>
  );
}
