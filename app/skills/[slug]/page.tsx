import Link from "next/link";
import { notFound } from "next/navigation";
import { PageFrame } from "../../inner-page";
import { allSkills, getSkill, getSkillProjects } from "../../lib/skills-catalog";

export function generateStaticParams() { return allSkills.map(({ slug }) => ({ slug })); }

export default async function SkillPage({ params }: PageProps<"/skills/[slug]">) {
  const { slug } = await params;
  const skill = getSkill(slug);
  if (!skill) notFound();
  const related = getSkillProjects(skill);
  return <PageFrame number="02" label={skill.category.toUpperCase()} title={<>Used in<br/><em>{skill.name}.</em></>}>
    <div className="skill-detail-intro reveal"><Link href="/#skills">← BACK TO SKILLS</Link><p>{skill.category} · This is where {skill.name} shows up across my project work.</p></div>
    <section className="skill-detail-projects" aria-label={`Projects using ${skill.name}`}>
      {related.map((project, index) => <Link href={`/projects/${project.slug}`} className="skill-detail-project reveal" key={project.slug}>
        <span className="skill-detail-project-index">{String(index + 1).padStart(2, "0")}</span>
        <div><small>PROJECT · {project.stack}</small><h2>{project.name}</h2><p>{project.summary}</p></div>
        <span className="project-arrow">↗</span>
      </Link>)}
      {!related.length && <p className="skill-detail-empty">This skill is part of my engineering toolkit and is not tied to a published case study yet.</p>}
    </section>
    <div className="skill-detail-footer"><Link className="button button-dark" href="/projects">Explore all projects <span>↗</span></Link><Link className="under-link" href="/contact">Ask me about this skill <span>↗</span></Link></div>
  </PageFrame>;
}
