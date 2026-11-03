import {
  siPython, siCplusplus, siJavascript, siTypescript, siPostgresql, siFastapi,
  siNodedotjs, siDocker, siRedis, siLangchain, siReact,
  siMongodb, siJest, siNextdotjs, siTailwindcss, siHtml5, siCss,
  siExpress, siMysql, siFirebase, siQdrant, siAnthropic, siLanggraph,
  siClaude, siSwagger, siOpenapiinitiative, siGithubactions, siVercel,
  siRailway, siWebauthn, siScrumalliance,
} from "simple-icons";
import type { SimpleIcon } from "simple-icons";

export type SkillProject = { slug: string; name: string; summary: string; stack: string };
export type SkillDefinition = { slug: string; name: string; icon?: SimpleIcon; mark: string; projectSlugs: string[] };
export type SkillItem = SkillDefinition & { category: string };
export type SkillGroup = { name: string; slug: string; skills: SkillDefinition[] };

export const skillProjects: SkillProject[] = [
  { slug: "agentic-loan-advisor", name: "Agentic Loan Advisor", summary: "A multi-agent loan advisory system combining research, analysis, and explainable recommendations.", stack: "Python · LangGraph · FastAPI · Claude API · Qdrant · mem0" },
  { slug: "docai-medical-rag-agent", name: "DocAI Medical RAG Agent", summary: "A medical document assistant with ingestion, retrieval, reranking, generation, and tool calling.", stack: "Python · LlamaIndex · ChromaDB · Anthropic API · FastAPI" },
  { slug: "quantpilot-autotrade-core", name: "QuantPilot AutoTrade Core", summary: "A real-time trading backend with streaming market data, strategy execution, and risk controls.", stack: "Python · FastAPI · WebSockets · Redis · PostgreSQL · Next.js" },
  { slug: "sixfinance-ai-rag-platform", name: "SixFinance — AI Financial RAG Platform", summary: "A financial document pipeline connecting vector retrieval and language models to product APIs.", stack: "Python · FastAPI · RAG · Qdrant · PostgreSQL · Next.js" },
];

const project = {
  loan: "agentic-loan-advisor",
  medical: "docai-medical-rag-agent",
  quant: "quantpilot-autotrade-core",
  finance: "sixfinance-ai-rag-platform",
};
const all = Object.values(project);
const ai = [project.loan, project.medical, project.finance];
const web = [project.quant, project.finance];
const foundation = [project.loan, project.quant, project.finance];

export const skillGroups: SkillGroup[] = [
  { name: "Programming languages", slug: "languages", skills: [
    { slug: "python", name: "Python", icon: siPython, mark: "Py", projectSlugs: all },
    { slug: "cpp", name: "C++", icon: siCplusplus, mark: "C++", projectSlugs: foundation },
    { slug: "javascript", name: "JavaScript", icon: siJavascript, mark: "JS", projectSlugs: web },
    { slug: "typescript", name: "TypeScript", icon: siTypescript, mark: "TS", projectSlugs: web },
    { slug: "sql", name: "SQL", icon: siPostgresql, mark: "SQL", projectSlugs: [project.quant, project.finance] },
  ] },
  { name: "Frontend", slug: "frontend", skills: [
    { slug: "react", name: "React.js", icon: siReact, mark: "Re", projectSlugs: web },
    { slug: "nextjs", name: "Next.js", icon: siNextdotjs, mark: "N", projectSlugs: web },
    { slug: "tailwind-css", name: "Tailwind CSS", icon: siTailwindcss, mark: "Tw", projectSlugs: web },
    { slug: "html", name: "HTML", icon: siHtml5, mark: "5", projectSlugs: web },
    { slug: "css", name: "CSS", icon: siCss, mark: "#", projectSlugs: web },
    { slug: "websockets", name: "WebSockets", mark: "↔", projectSlugs: [project.quant] },
    { slug: "jwt-authentication", name: "JWT authentication", mark: "JWT", projectSlugs: web },
  ] },
  { name: "Backend & APIs", slug: "backend", skills: [
    { slug: "nodejs", name: "Node.js", icon: siNodedotjs, mark: "Node", projectSlugs: web },
    { slug: "expressjs", name: "Express.js", icon: siExpress, mark: "Ex", projectSlugs: web },
    { slug: "fastapi", name: "FastAPI", icon: siFastapi, mark: "Fa", projectSlugs: all },
    { slug: "rest-apis", name: "REST APIs", mark: "API", projectSlugs: all },
    { slug: "microservices", name: "Microservices", mark: "μs", projectSlugs: [project.quant, project.finance] },
    { slug: "authentication", name: "Authentication", icon: siWebauthn, mark: "Au", projectSlugs: web },
    { slug: "authorization", name: "Authorization", mark: "Az", projectSlugs: web },
    { slug: "api-integration", name: "API integration", mark: "↗", projectSlugs: all },
    { slug: "swagger", name: "Swagger", icon: siSwagger, mark: "Sw", projectSlugs: [project.quant, project.finance] },
    { slug: "openapi", name: "OpenAPI", icon: siOpenapiinitiative, mark: "O", projectSlugs: all },
  ] },
  { name: "Databases & search", slug: "data", skills: [
    { slug: "postgresql", name: "PostgreSQL", icon: siPostgresql, mark: "Pg", projectSlugs: [project.quant, project.finance] },
    { slug: "mongodb", name: "MongoDB", icon: siMongodb, mark: "Mg", projectSlugs: web },
    { slug: "mysql", name: "MySQL", icon: siMysql, mark: "My", projectSlugs: [project.quant, project.finance] },
    { slug: "redis", name: "Redis", icon: siRedis, mark: "R", projectSlugs: [project.quant] },
    { slug: "firebase", name: "Firebase", icon: siFirebase, mark: "Fi", projectSlugs: web },
    { slug: "qdrant", name: "Qdrant", icon: siQdrant, mark: "Q", projectSlugs: [project.loan, project.finance] },
    { slug: "chromadb", name: "ChromaDB", mark: "Ch", projectSlugs: [project.medical] },
    { slug: "pgvector", name: "pgvector", icon: siPostgresql, mark: "V", projectSlugs: [project.finance] },
  ] },
  { name: "Generative AI", slug: "generative-ai", skills: [
    { slug: "llms", name: "LLMs", mark: "AI", projectSlugs: ai },
    { slug: "rag", name: "RAG", mark: "RAG", projectSlugs: ai },
    { slug: "agentic-ai", name: "Agentic AI", icon: siLanggraph, mark: "Ag", projectSlugs: [project.loan] },
    { slug: "langchain", name: "LangChain", icon: siLangchain, mark: "Lc", projectSlugs: ai },
    { slug: "langgraph", name: "LangGraph", icon: siLanggraph, mark: "Lg", projectSlugs: [project.loan] },
    { slug: "llamaindex", name: "LlamaIndex", mark: "Li", projectSlugs: [project.medical] },
    { slug: "prompt-engineering", name: "Prompt engineering", mark: "✳", projectSlugs: ai },
    { slug: "tool-calling", name: "Tool calling", mark: "⚙", projectSlugs: ai },
    { slug: "function-calling", name: "Function calling", mark: "ƒ", projectSlugs: ai },
    { slug: "ai-memory", name: "AI memory", mark: "◉", projectSlugs: [project.loan] },
    { slug: "mem0", name: "mem0", mark: "m0", projectSlugs: [project.loan] },
    { slug: "claude-api", name: "Claude API", icon: siClaude, mark: "Cl", projectSlugs: [project.loan, project.medical] },
    { slug: "openai-api", name: "OpenAI API", mark: "OAI", projectSlugs: [project.medical, project.finance] },
  ] },
  { name: "AI engineering & evaluation", slug: "ai-engineering", skills: [
    { slug: "embeddings", name: "Embeddings", mark: "∴", projectSlugs: ai },
    { slug: "semantic-search", name: "Semantic search", mark: "⌕", projectSlugs: ai },
    { slug: "vector-search", name: "Vector search", icon: siQdrant, mark: "↗", projectSlugs: ai },
    { slug: "document-chunking", name: "Document chunking", mark: "▤", projectSlugs: [project.medical, project.finance] },
    { slug: "cross-encoder-reranking", name: "Cross-encoder reranking", mark: "⇅", projectSlugs: [project.medical] },
    { slug: "ragas", name: "RAGAS", mark: "Rg", projectSlugs: [project.medical] },
    { slug: "deepeval", name: "DeepEval", mark: "De", projectSlugs: [project.loan] },
    { slug: "langsmith", name: "LangSmith", icon: siLangchain, mark: "Ls", projectSlugs: ai },
  ] },
  { name: "Cloud & operations", slug: "cloud-operations", skills: [
    { slug: "docker", name: "Docker", icon: siDocker, mark: "D", projectSlugs: all },
    { slug: "aws-ec2", name: "AWS EC2", mark: "EC2", projectSlugs: web },
    { slug: "amazon-s3", name: "Amazon S3", mark: "S3", projectSlugs: web },
    { slug: "github-actions", name: "GitHub Actions", icon: siGithubactions, mark: "GA", projectSlugs: all },
    { slug: "ci-cd", name: "CI/CD", icon: siGithubactions, mark: "CI", projectSlugs: all },
    { slug: "railway", name: "Railway", icon: siRailway, mark: "Rw", projectSlugs: web },
    { slug: "vercel", name: "Vercel", icon: siVercel, mark: "Ve", projectSlugs: web },
    { slug: "application-logging", name: "Application logging", mark: "≋", projectSlugs: all },
    { slug: "health-checks", name: "Health checks", mark: "♥", projectSlugs: all },
    { slug: "performance-monitoring", name: "Performance monitoring", mark: "⌁", projectSlugs: all },
    { slug: "metrics", name: "Metrics", mark: "▥", projectSlugs: all },
    { slug: "alerting", name: "Alerting", mark: "♧", projectSlugs: all },
  ] },
  { name: "CS & engineering practice", slug: "foundations", skills: [
    { slug: "data-structures-algorithms", name: "Data structures & algorithms", mark: "◇", projectSlugs: foundation },
    { slug: "object-oriented-programming", name: "OOP", mark: "◎", projectSlugs: all },
    { slug: "dbms", name: "DBMS", mark: "DB", projectSlugs: [project.quant, project.finance] },
    { slug: "operating-systems", name: "Operating systems", mark: "OS", projectSlugs: foundation },
    { slug: "computer-networks", name: "Computer networks", mark: "⌘", projectSlugs: [project.quant] },
    { slug: "system-design", name: "System design", mark: "▦", projectSlugs: all },
    { slug: "design-patterns", name: "Design patterns", mark: "⌬", projectSlugs: all },
    { slug: "debugging", name: "Debugging", mark: "⌕", projectSlugs: all },
    { slug: "testing", name: "Testing", icon: siJest, mark: "Te", projectSlugs: all },
    { slug: "agile", name: "Agile", icon: siScrumalliance, mark: "Ag", projectSlugs: all },
    { slug: "scrum", name: "Scrum", icon: siScrumalliance, mark: "Sc", projectSlugs: all },
  ] },
];

export const allSkills: SkillItem[] = skillGroups.flatMap((group) => group.skills.map((skill) => ({ ...skill, category: group.name })));
export function getSkill(slug: string) { return allSkills.find((skill) => skill.slug === slug); }
export function getSkillProjects(skill: SkillItem) { return skillProjects.filter((item) => skill.projectSlugs.includes(item.slug)); }
