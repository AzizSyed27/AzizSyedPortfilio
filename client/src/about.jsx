// about.jsx

import React from 'react';
import Picture from '../src/person-pics/aziz_top_shot.jpeg';
import Resume from '../src/person-pics/AzizSyedResume.pdf';

export default function About() {
  return (
    <main className="container section">
      <header className="section-header">
        <h1 className="section-title">
          About <span className="highlight">Me</span>
        </h1>
        <p className="section-subtitle">
          A Software Engineering Technology student with a strong focus on full-stack development,
          cloud platforms, and modern engineering practices.
        </p>
      </header>

      <div className="about-grid">
       

        <div className="hero-photo-card">
          <img src={Picture} alt="Aziz Syed" className="hero-photo" />
        </div>

        <div className="about-content">
          <p>
            I’m currently enrolled in the{' '}
            <strong>Software Engineering Technology program</strong> at{' '}
            <span className="highlight-college">Centennial College</span> (Jan 2023 – Dec 2025),
            where I’ve maintained a <strong>4.3/4.5 GPA</strong>. My coursework and projects have
            given me hands-on experience with full-stack development, APIs, and cloud computing.
          </p>

          <p>
            I’ve worked with technologies such as <strong>React, Angular, Node.js, Spring Boot,
            ASP.NET Core, GraphQL, MongoDB,</strong> and relational databases. I enjoy building
            applications that are both technically solid and user-focused, and I’m comfortable
            working across the stack, from UI to database and deployment.
          </p>

          <p>
            I’ve also gained exposure to modern engineering practices, including Agile/Scrum, CI/CD,
            containerization with <strong>Docker/Kubernetes</strong>, and infrastructure tools like{' '}
            <strong>Terraform</strong>. These experiences have helped me understand how reliable,
            scalable systems are built and maintained in real environments.
          </p>

          <p>
            Outside of academics, I stay involved as a <strong>peer mentor</strong>, a member of the
            <strong> Software Engineering Club</strong>, and an active participant in hackathons and
            coding competitions. I also volunteer as a sports coach and event organizer, which helps
            me strengthen teamwork, leadership, and communication skills.
          </p>

          <div className="about-actions">
            <a
              href={Resume}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              Download My Updated Resume (PDF)
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
