import { exampleJob } from '../src/data/examples';

export default function Home() {
  return <main className="shell">
    <nav className="nav" aria-label="Main navigation"><a className="brand" href="/" aria-label="Career Forge home"><span className="brand-mark">✦</span> Career Forge</a><span className="nav-note">Student-first career momentum</span></nav>
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy"><p className="eyebrow">A clearer path forward</p><h1 id="hero-title">Turn what you’ve learned into what’s next.</h1><p className="lede">Career Forge helps students connect their real skills and experiences to opportunities worth pursuing.</p><a className="button" href="#preview">Explore the foundation <span aria-hidden="true">→</span></a></div>
      <div className="hero-card" id="preview" aria-label="Example opportunity preview"><div className="card-top"><span className="pill">Example opportunity</span><span className="verified">● Unverified</span></div><h2>{exampleJob.title}</h2><p>{exampleJob.company} · {exampleJob.location}</p><div className="card-rule" /><p className="card-foot">Built around your strengths <span aria-hidden="true">↗</span></p></div>
    </section>
    <section className="principles" aria-label="Career Forge principles"><div><strong>Grounded</strong><span>Suggestions trace back to your own facts.</span></div><div><strong>Focused</strong><span>Small steps toward meaningful work.</span></div><div><strong>Yours</strong><span>Your story stays at the center.</span></div></section>
    <footer>Career Forge <span>·</span> Built for students at BYU-Idaho</footer>
  </main>;
}
