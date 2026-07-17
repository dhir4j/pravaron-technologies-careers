import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { JobBrowser } from "@/components/job-browser";

const buildAreas = [
  {
    number: "01",
    title: "Agentic AI products",
    body: "Systems that plan, act, and coordinate work across real business operations.",
  },
  {
    number: "02",
    title: "Automation platforms",
    body: "Reliable workflows that connect teams, data, tools, and decisions.",
  },
  {
    number: "03",
    title: "Decision intelligence",
    body: "Operational software that turns fragmented signals into useful action.",
  },
  {
    number: "04",
    title: "Internal AI tools",
    body: "Focused products that make expert teams faster without hiding the work.",
  },
];

export default function CareersHome() {
  return (
    <main>
      <section className="career-hero">
        <div className="career-hero-media" aria-hidden="true">
          <Image
            src="/images/systems/agentic-ai-products.webp"
            alt=""
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="career-hero-copy">
          <p className="eyebrow">Careers at Pravaron Technologies</p>
          <h1>
            <span>Build the future of</span>
            <span>intelligent systems.</span>
          </h1>
          <p>
            Work on agentic AI, automation, and software that changes how businesses operate.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/jobs">
              Explore roles
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className="button button-secondary" href="/jobs?type=Internship">
              View internships
            </Link>
          </div>
        </div>
      </section>

      <section className="section-shell build-section">
        <div className="section-heading">
          <p className="eyebrow">What we build</p>
          <h2>Systems that make intelligence operational.</h2>
          <p>
            Pravaron Technologies builds products and platforms where software, automation, and AI reasoning work as one connected operating layer.
          </p>
        </div>
        <div className="build-grid">
          {buildAreas.map(({ number, title, body }) => (
            <article className="build-item" key={title}>
              <div className="build-item-copy">
                <span className="build-item-index">{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="culture-section">
        <div className="culture-inner">
          <div className="culture-image">
            <Image
              src="/images/systems/decision-intelligence.webp"
              alt="Decision intelligence system by Pravaron Technologies"
              fill
              sizes="(max-width: 768px) 100vw, 52vw"
            />
          </div>
          <div className="culture-copy">
            <p className="eyebrow">How we work</p>
            <h2>High ownership. Direct impact.</h2>
            <p>
              Work close to the problem, collaborate across disciplines, and see your decisions reach production.
            </p>
            <div className="culture-points">
              <div>
                <UsersRound size={21} />
                <span>
                  <strong>Small, focused teams</strong>
                  Clear ownership and fast feedback.
                </span>
              </div>
              <div>
                <ShieldCheck size={21} />
                <span>
                  <strong>Production-minded work</strong>
                  Reliability, privacy, and outcomes matter.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell open-roles-section" id="roles">
        <div className="section-heading">
          <h2>Open roles</h2>
          <p>Find a role where your strengths can shape the systems we are building.</p>
        </div>
        <JobBrowser compact />
        <Link className="text-link" href="/jobs">
          View every open role
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </section>

      <section className="final-cta">
        <div>
          <h2>Build what comes next.</h2>
          <p>Explore the roles open today, or create a profile for future opportunities.</p>
        </div>
        <Link className="button button-light" href="/jobs">
          Explore roles
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
