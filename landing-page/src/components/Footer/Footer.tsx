import './Footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <p className="footer__text">
        &copy; {new Date().getFullYear()} sodabubbles.ai &mdash; Built on{' '}
        <a
          href="https://developers.cloudflare.com/workers/"
          target="_blank"
          rel="noopener noreferrer"
          className="footer__link"
        >
          Cloudflare Workers
        </a>
      </p>
    </footer>
  );
}
