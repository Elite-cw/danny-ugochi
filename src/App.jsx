import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowUp, ArrowDown, Atom, Sparkles, Square, Circle, X, Pause, Play } from 'lucide-react';

const projects = [
  { title: 'Digital experiences', category: 'WEB DESIGN / DEVELOPMENT', image: '/assets/img/work-nordwell.jpg', description: 'A space for your website projects. We will replace this sample image and description with your actual work.' },
  { title: 'Visual identities', category: 'BRANDING / ART DIRECTION', image: '/assets/img/work-aurelia.jpg', description: 'A space for your visual design projects. This is sample content from the saved template.' },
  { title: 'Creative experiments', category: 'EXPLORATION / INTERACTION', image: '/assets/img/work-kinetic.jpg', description: 'A space for the things you make out of curiosity. Your experiments and interactive projects will live here.' },
];

function Label({ children, extra }) {
  return <div className="label"><span><Square className="label-marker" size={6} fill="currentColor" strokeWidth={0} />{children}</span>{extra}</div>;
}

function Mark({ small = false }) {
  return <svg className={small ? 'mark small' : 'mark'} viewBox="0 0 160 130" fill="none" aria-hidden="true"><path d="M15 8H53L84 55L64 84L15 8ZM107 8H146L63 123H24L107 8ZM99 70L136 123H97L79 98L99 70Z" fill="currentColor"/></svg>;
}

export default function App() {
  const [selected, setSelected] = useState(null);
  const dialog = useRef(null);
  const returnFocus = useRef(null);
  const [active, setActive] = useState('All');
  const canvas = useRef(null);
  const orbitAngle = useRef(0);
  const [motionPaused, setMotionPaused] = useState(false);

  useEffect(() => {
    const stage = canvas.current;
    const cards = [...stage.querySelectorAll('.card')];
    const desktop = window.matchMedia('(min-width: 1101px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame;
    let previousTime;
    let dragging = null;
    const offsets = new Map();
    let width = stage.clientWidth;
    let height = stage.clientHeight;
    // Fixed phases spread the six cards evenly around an elliptical orbit.
    const phases = [-180, -120, -60, 120, 60, 0];
    const resize = new ResizeObserver(() => {
      width = stage.clientWidth;
      height = stage.clientHeight;
    });
    resize.observe(stage);

    function endDrag(event) {
      if (!dragging || (event && event.pointerId !== dragging.pointerId)) return;
      const { card, pointerId } = dragging;
      // Rejoin the current orbital position, which keeps moving during a drag.
      const index = cards.indexOf(card);
      const angle = phases[index] * Math.PI / 180 + orbitAngle.current;
      offsets.set(card, {
        x: parseFloat(card.style.left) - (width * .5 + Math.cos(angle) * width * .33),
        y: parseFloat(card.style.top) - (height * .52 + Math.sin(angle) * height * .27),
      });
      dragging = null;
      card.classList.remove('is-dragging');
      if (card.hasPointerCapture(pointerId)) card.releasePointerCapture(pointerId);
    }
    function startDrag(event) {
      if (!desktop.matches || reduced.matches || selected || dragging || event.button !== 0) return;
      const card = event.target.closest('.card');
      // Preserve native clicks and keyboard access on the card's controls.
      if (!card || event.target.closest('a, button, input, textarea, select')) return;
      const rect = stage.getBoundingClientRect();
      const left = parseFloat(card.style.left);
      const top = parseFloat(card.style.top);
      if (!Number.isFinite(left) || !Number.isFinite(top)) return;
      event.preventDefault();
      dragging = {
        card, pointerId: event.pointerId,
        grabX: event.clientX - rect.left - left,
        grabY: event.clientY - rect.top - top,
      };
      card.classList.add('is-dragging');
      card.setPointerCapture(event.pointerId);
    }
    function moveDrag(event) {
      if (!dragging || event.pointerId !== dragging.pointerId) return;
      const { card, grabX, grabY } = dragging;
      const rect = stage.getBoundingClientRect();
      const halfWidth = card.offsetWidth / 2;
      const halfHeight = card.offsetHeight / 2;
      const x = Math.max(halfWidth + 8, Math.min(width - halfWidth - 8, event.clientX - rect.left - grabX));
      const y = Math.max(halfHeight + 8, Math.min(height - halfHeight - 8, event.clientY - rect.top - grabY));
      const index = cards.indexOf(card);
      const angle = phases[index] * Math.PI / 180 + orbitAngle.current;
      offsets.set(card, {
        x: x - (width * .5 + Math.cos(angle) * width * .33),
        y: y - (height * .52 + Math.sin(angle) * height * .27),
      });
      card.style.left = x + 'px';
      card.style.top = y + 'px';
    }
    stage.addEventListener('pointerdown', startDrag);
    stage.addEventListener('pointermove', moveDrag);
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('lostpointercapture', endDrag);
    const windowBlur = () => endDrag();
    window.addEventListener('blur', windowBlur);
    function animate(time) {
      const elapsed = previousTime === undefined ? 0 : Math.min(time - previousTime, 50);
      previousTime = time;
      const enabled = desktop.matches && !reduced.matches;
      stage.classList.toggle('is-orbiting', enabled);
      if (enabled) {
        if (!motionPaused && !selected && !document.hidden) {
          orbitAngle.current = (orbitAngle.current + elapsed * (Math.PI * 2 / 160000)) % (Math.PI * 2);
        }
        cards.forEach((card, index) => {
          const angle = phases[index] * Math.PI / 180 + orbitAngle.current;
          if (dragging?.card === card) return;
          const offset = offsets.get(card) || { x: 0, y: 0 };
          // Exponential settling smoothly rejoins the moving orbital destination.
          const decay = Math.exp(-elapsed / 190);
          offset.x *= decay;
          offset.y *= decay;
          if (Math.hypot(offset.x, offset.y) < .2) offsets.delete(card);
          else offsets.set(card, offset);
          card.style.left = (width * .5 + Math.cos(angle) * width * .33 + offset.x) + 'px';
          card.style.top = (height * .52 + Math.sin(angle) * height * .27 + offset.y) + 'px';
        });
      } else {
        endDrag();
        offsets.clear();
        cards.forEach(card => { card.style.removeProperty('left'); card.style.removeProperty('top'); });
      }
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      endDrag();
      stage.removeEventListener('pointerdown', startDrag);
      stage.removeEventListener('pointermove', moveDrag);
      stage.removeEventListener('pointerup', endDrag);
      stage.removeEventListener('pointercancel', endDrag);
      stage.removeEventListener('lostpointercapture', endDrag);
      window.removeEventListener('blur', windowBlur);
      stage.classList.remove('is-orbiting');
      cards.forEach(card => { card.style.removeProperty('left'); card.style.removeProperty('top'); });
    };
  }, [motionPaused, selected]);
  useEffect(() => {
    if (selected) dialog.current.showModal();
    else if (dialog.current.open) dialog.current.close();
  }, [selected]);
  function openProject(project, event) { returnFocus.current = event.currentTarget; setSelected(project); }
  function closeProject() { setSelected(null); returnFocus.current?.focus(); }
  return <>
    <a className="skip" href="#work">Skip to work</a>
    <main className="universe" id="home">
      <div className="outer-orbit one" aria-hidden="true" /><div className="outer-orbit two" aria-hidden="true" />
      <section ref={canvas} className="canvas" aria-label="Portfolio introduction">
        <nav className="navigation" aria-label="Main navigation">
          <a className="brand" href="#home"><Mark small /><span>PORTFOLIO</span></a>
          <a href="#work">Work <span className="tiny"><ArrowUpRight className="icon" aria-hidden="true" /></span></a><a href="#about">About</a>
          <a className="nav-contact" href="#contact">Let's talk <span><ArrowUpRight className="icon" aria-hidden="true" /></span></a>
        </nav>
        <button className="orbit-toggle" onClick={() => setMotionPaused(value => !value)} aria-pressed={motionPaused} aria-label={motionPaused ? 'Resume card orbit' : 'Pause card orbit'}>
          {motionPaused ? <Play className="icon" aria-hidden="true" /> : <Pause className="icon" aria-hidden="true" />}
          {motionPaused ? 'Resume orbit' : 'Pause orbit'}
        </button>
        <div className="orbital-system" aria-hidden="true"><div className="globe"/><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="orbit orbit-c"/></div>
        <article className="card intro-card"><h1>Ideas into<br/><em>experiences.</em></h1><p>A creative mind at the intersection of design, code, and a little curiosity.</p><a className="text-link" href="#about">Get to know me <span><ArrowUpRight className="icon" aria-hidden="true" /></span></a><div className="card-bars"><b/><b/><b/><b/><b/><b/></div></article>
        <article className="card note-card"><p>Thoughtfully designed.<br/>Purposefully built.<br/><em>A little unexpected.</em></p></article>
        <div className="identity"><Mark/><h2>YOUR NAME<span>DESIGNER & DEVELOPER</span></h2><span className="identity-note">A world of ideas, connected.</span><div className="identity-links"><a className="identity-link" href="#work">EXPLORE <span><ArrowUpRight className="icon" aria-hidden="true" /></span></a><a className="identity-link" href="#about">ABOUT <span><ArrowUpRight className="icon" aria-hidden="true" /></span></a></div></div>
        <article className="card work-card"><button className="featured" onClick={e=>openProject(projects[0],e)}><img src={projects[0].image} alt="Sample architectural project from the original template"/><span className="image-arrow"><ArrowUpRight className="icon" aria-hidden="true" /></span></button><div className="work-description"><div><h3>Built with intention.</h3><p>Design meets development.</p></div><a href="#work" aria-label="Explore selected work"><ArrowUpRight className="icon" aria-hidden="true" /></a></div></article>
        
        <article className="card toolkit-card"><div className="toolkit"><Atom className="react-icon" aria-hidden="true" strokeWidth={1.3} /><div><h3>Creative by nature.</h3><p>Powered by React.<br/>Made for interaction.</p></div></div><div className="tags"><span>React</span><span>Design</span><span>Development</span></div></article>
        <article className="card about-card"><p>“Curiosity is the starting point.<br/>Making something meaningful<br/>is the destination.”</p><div className="about-foot"><Sparkles className="avatar" aria-hidden="true" strokeWidth={1.4} /><span>YOUR NAME<small>Always exploring</small></span><a href="#about" aria-label="Read about me"><ArrowUpRight className="icon" aria-hidden="true" /></a></div></article>
        <article className="card contact-card"><h3>Let's make<br/><em>something great.</em></h3><a className="dark-button" href="#contact">Start a conversation <span><ArrowUpRight className="icon" aria-hidden="true" /></span></a></article>
        
      </section>
    </main>
    <section className="work-section section" id="work"><div className="section-heading"><h2>Selected <em>work.</em></h2><p>A few windows into my creative world.<br/><span className="sample-note">Sample projects · ready for your real work</span></p></div><div className="filters" aria-label="Filter projects">{['All','Design','Development'].map(filter=><button key={filter} aria-pressed={active===filter} onClick={()=>setActive(filter)}>{filter}</button>)}</div><div className="project-grid">{projects.filter((_,index)=>active==='All'||(active==='Development'?index!==1:index!==0)).map((project)=><button className="project" key={project.title} onClick={e=>openProject(project,e)}><div className="project-image"><img src={project.image} alt={'Sample imagery for '+project.title}/><span>Explore project <ArrowUpRight className="icon" aria-hidden="true" /></span></div><div className="project-title"><h3>{project.title}</h3><span><ArrowUpRight className="icon" aria-hidden="true" /></span></div><p>{project.category}</p></button>)}</div></section>
    <section className="about-section section" id="about"><div className="about-layout"><h2>A curious mind.<br/>An eye for detail.<br/><em>A love for making.</em></h2><div><p>This is where your story goes — who you are, what you enjoy creating, and what drives your work.</p><p>We're building a portfolio that feels like you. The design is the starting point; your story, projects, and personality will bring it to life.</p><div className="tags"><span>Design</span><span>Development</span><span>Creative thinking</span></div></div></div></section>
    <footer className="section contact-section" id="contact"><h2>Have something<br/><em>in mind?</em> <span><ArrowUpRight className="icon" aria-hidden="true" /></span></h2><p>Your contact details and social links will live here.</p><div className="footer-bottom"><a className="brand" href="#home"><Mark small/> PORTFOLIO</a><a href="#home">Back to orbit <ArrowUp className="icon" aria-hidden="true" /></a></div></footer>
    <dialog ref={dialog} onCancel={closeProject} onClick={e=>{if(e.target===e.currentTarget)closeProject();}} onClose={()=>{if(selected)closeProject();}}><button className="close-dialog" onClick={closeProject} aria-label="Close project"><X className="icon" aria-hidden="true" /></button>{selected&&<><img src={selected.image} alt={'Sample imagery for '+selected.title}/><div className="dialog-copy"><Label>{selected.category}</Label><h2>{selected.title}</h2><p>{selected.description}</p><span className="sample-note">PROJECT PLACEHOLDER</span></div></>}</dialog>
  </>;
}
