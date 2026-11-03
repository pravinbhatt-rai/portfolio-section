import { skillGroups } from "./lib/skills-catalog";

export function SkillsBento() {
  return <section className="skills-bento-section section-pad" id="skills">
    <div className="skills-bento-inner">
      <div className="section-index reveal"><span>02 / THE TOOLKIT</span><span>TOOLS I BUILD WITH</span></div>
      <div className="skills-bento-heading reveal"><div><p className="eyebrow">A TOOLKIT IN CONSTANT MOTION</p><h2>Skills in<br/><em>the making.</em></h2></div><p>One view across the tools I use to build, ship, and support software.</p></div>
      <div className="skills-bento-grid" aria-label="Skills, grouped by discipline">
        {skillGroups.map((group, groupIndex) => <section className={`skill-bento-group skill-group-${groupIndex}`} key={group.slug} aria-label={group.name}>
          <h3 className="skill-group-label">{group.name}</h3>
          <div className="skill-bento-items">
            {group.skills.map(skill => <div className="skill-bento-icon" key={skill.slug} title={skill.name} aria-label={skill.name} role="img">
              {skill.icon ? <svg viewBox="0 0 24 24" aria-hidden="true"><path fill={`#${skill.icon.hex}`} d={skill.icon.path}/></svg> : <span aria-hidden="true">{skill.mark}</span>}
            </div>)}
          </div>
        </section>)}
      </div>
    </div>
  </section>;
}
