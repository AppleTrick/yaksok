import Image from "next/image";
import "./page.css";

export default function Home() {
  return (
    <div className="home-container">
      {/* Background Gradients */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <main className="main-content">
        <div className="logo-container">
          <Image
            className="app-icon"
            src="/icons/icon-512x512.png"
            alt="yaksok Icon"
            width={128}
            height={128}
            priority
          />
        </div>

        <h1 className="title">yaksok</h1>

        <p className="description">
          The smarter way to manage your appointments.<br />
          Installable, offline-first, and beautifully fast.
        </p>

        <div className="button-group">
          <button className="btn btn-primary">Start Planning</button>
          <button className="btn btn-secondary">Install App</button>
        </div>

        <div className="features-grid">
          {[
            { title: "Smart Scheduling", desc: "Intuitive interface for all your appointments." },
            { title: "Desktop & Mobile", desc: "Seamless experience across all your devices." },
            { title: "Stay Notified", desc: "Get push updates for your upcoming meetings." },
          ].map((feature, i) => (
            <div key={i} className="feature-card">
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
