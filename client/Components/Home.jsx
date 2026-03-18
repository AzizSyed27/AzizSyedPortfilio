// Home.jsx

import React from 'react';
import Picture from '../src/person-pics/aziz_top_shot_2.jpeg';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-text">
            <p className="hero-kicker">Software Engineering Technology · Scarborough, ON</p>
            <h1 className="hero-title">
              Building practical, reliable, and user-focused software.
            </h1>
            <p className="hero-subtitle">
              I’m <span className="highlight">Aziz Syed</span>, a Computer Science student chading their Bacherlor of Sceince (Honours) at The University of Ontario Institute of Technology. 
              I'm also a Software Engineering Technology
              graduate from <span className="highlight-college">Centennial College</span>. I’ve built
              hands-on experience in full-stack development, cloud computing, and emerging web
              technologies. I enjoy turning real-world problems into scalable, maintainable software
              solutions.
            </p>

            <div className="hero-actions">
              <Link to="/projects" className="btn btn-primary">
                View Projects
              </Link>
              <Link to="/contact" className="btn btn-ghost">
                Contact Me
              </Link>
            </div>

            <div className="hero-metrics">
              <div className="metric">
                <span className="metric-value">Full-stack</span>
                <span className="metric-label">React, Angular, Spring Boot</span>
              </div>
              <div className="metric">
                <span className="metric-value">Cloud</span>
                <span className="metric-label">AWS, Azure, GCP</span>
              </div>
              <div className="metric">
                <span className="metric-value">DevOps</span>
                <span className="metric-label">Docker, Kubernetes, Terraform</span>
              </div>
            </div>
          </div>

          <div className="hero-photo-wrapper">
             <div className="about-photo-wrapper">
                <img src={Picture} alt="Aziz Syed" className="about-photo" />
              </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-header">
          <h2 className="section-title">What I focus on</h2>
          <p className="section-subtitle">
            I like to understand how systems work end-to-end and build software that is both
            technically sound and easy to use.
          </p>
        </div>

        <div className="feature-grid">
          <article className="feature-card">
            <h3>Engineering Mindset</h3>
            <p>
              I prioritize clarity, testability, and scalability, using clean architecture and modern
              development practices to build code that teams can understand and extend.
            </p>
          </article>
          <article className="feature-card">
            <h3>Real-World Applications</h3>
            <p>
              From Gym websites, member and admin portals, to cloud-hosted streaming platforms and restaurant management systems,
               I focus on solving practical problems with full-stack solutions.
            </p>
          </article>
          <article className="feature-card">
            <h3>Continuous Growth</h3>
            <p>
              I stay active through coursework, peer mentoring, coding competitions, and team
              projects, always looking for opportunities to learn new tools and techniques.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
