/**
 * AiRevl Academy — course content (single source of truth)
 * Rule: zero copy in JSX. All Academy copy lives here.
 *
 * Tier 1 "Automation 101" is free (login-gated).
 * Tier 2 "Automation Fluency" and Tier 3 "Automation Pro" are paid, waitlist-only for now.
 *
 * Written for a beginner audience. Target reading level: a curious 12-year-old
 * can follow it, a busy regulator can respect it.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number; // index into options
  explain: string;
}

export interface RubricItem {
  id: string;
  label: string;       // shown in the feedback checklist
  keywords: string[];  // case-insensitive substring match, any hit = pass
  feedback: string;    // shown when the item is missing
}

export interface SandboxExercise {
  title: string;
  scenario: string;
  task: string;
  placeholder: string;
  rubric: RubricItem[];
  passThreshold: number; // rubric hits needed for the "pass" response
  responses: {
    pass: string;    // simulated AI output for a strong prompt
    partial: string; // simulated AI output for a half-built prompt
    fail: string;    // simulated AI output for a weak prompt
  };
  exampleSolution: string;
}

export type LessonBlock =
  | { type: "text"; body: string }
  | { type: "analogy"; title: string; body: string }
  | { type: "tip"; body: string }
  | { type: "example"; title: string; prompt: string; output: string }
  | { type: "keypoints"; title: string; items: string[] };

export interface CourseModule {
  id: string;
  order: number;
  title: string;
  tagline: string;
  icon: string; // material symbol name
  minutes: number;
  objectives: string[];
  blocks: LessonBlock[];
  sandbox?: SandboxExercise;
  quiz: QuizQuestion[];
}

export interface Tier {
  id: string;
  level: 1 | 2 | 3;
  name: string;
  audience: string;
  price: string;
  status: "free" | "waitlist";
  blurb: string;
  outcomes: string[];
  modulesPreview: string[];
}

// ─── Academy shell copy ───────────────────────────────────────────────────────

export const academy = {
  eyebrow: "AiRevl Academy",
  title: "Learn to automate your work with AI",
  subtitle:
    "A three-tier programme that takes you from your first prompt to production-grade AI workflows. Built for teams in regulated environments: broadcasting, finance, and public institutions.",
  signin: {
    title: "Sign in to start learning",
    body: "We use a passwordless magic link. Enter your email, click the link we send you, and your progress is saved to your account. No password to remember, nothing to leak.",
    email_label: "Work email",
    name_label: "Your name (appears on your certificate)",
    button: "Send me a magic link",
    sent_title: "Check your inbox",
    sent_body: "We sent a sign-in link to your email. Click it and you will land back here, signed in.",
    demo_note: "Demo mode: account service is not configured in this environment, so your progress is saved on this device only.",
    demo_button: "Continue in demo mode",
  },
  course_cta: "Start Automation 101 free",
  resume_cta: "Resume course",
  certificate_cta: "View your certificate",
  waitlist: {
    title: "Join the waitlist",
    body: "Paid tiers open soon. Waitlist members get early access and launch pricing.",
    email_label: "Work email",
    name_label: "Name",
    button: "Join waitlist",
    success: "You are on the list. We will email you when enrolment opens.",
    error: "Something went wrong. Please try again or use the contact page.",
  },
  progress_label: "Course progress",
  locked_label: "Coming soon",
  free_label: "Free",
  quiz_check: "Check answers",
  quiz_retry: "Try again",
  quiz_next: "Continue",
  module_complete: "Mark module complete",
  module_completed: "Module complete",
  next_module: "Next module",
  back_to_course: "Back to course",
};

// ─── Tiers ────────────────────────────────────────────────────────────────────

export const tiers: Tier[] = [
  {
    id: "automation-101",
    level: 1,
    name: "Automation 101",
    audience: "Complete beginners. No technical background needed.",
    price: "Free",
    status: "free",
    blurb:
      "Learn what automation and AI assistants actually are, write your first prompts, automate a boring task end to end, and build the habit of checking AI output before you trust it.",
    outcomes: [
      "Explain what automation and AI assistants do, in plain language",
      "Write clear prompts using the four-part Prompt Recipe",
      "Turn a repetitive document task into a reusable AI workflow",
      "Spot AI mistakes and verify output before acting on it",
    ],
    modulesPreview: [],
  },
  {
    id: "automation-fluency",
    level: 2,
    name: "Automation Fluency",
    audience: "Professionals who finished Automation 101 or already use AI weekly.",
    price: "Paid · pricing at launch",
    status: "waitlist",
    blurb:
      "Structured prompting for real institutional work: compliance analysis, report automation, meeting and transcript intelligence, and multi-step workflows you can hand to a colleague.",
    outcomes: [
      "Design prompt systems for compliance review and monitoring reports",
      "Chain prompts into multi-step document pipelines",
      "Build team prompt libraries with version control",
      "Evaluate AI output with structured checklists and scoring",
    ],
    modulesPreview: [
      "Prompt patterns for analysis and investigation",
      "Automating recurring reports and documentation",
      "Transcript and large-document intelligence",
      "Workflow design for teams and departments",
      "Quality gates: rubrics, spot checks, and sign-off rules",
    ],
  },
  {
    id: "automation-pro",
    level: 3,
    name: "Automation Pro",
    audience: "Power users, engineers, and unit leads deploying AI at institution scale.",
    price: "Paid · pricing at launch",
    status: "waitlist",
    blurb:
      "Agentic workflows, AI governance, and risk control. Covers synthetic media and misinformation tooling, audit trails, model selection, and running AI safely inside a regulated organisation.",
    outcomes: [
      "Build agentic multi-step workflows with human approval gates",
      "Detect and triage synthetic media and misinformation at volume",
      "Design audit trails and governance policies for institutional AI",
      "Select and combine models for cost, quality, and data safety",
    ],
    modulesPreview: [
      "Agents and tool use: beyond single prompts",
      "Synthetic media and misinformation triage",
      "AI governance, audit trails, and policy design",
      "Security: injection, data leakage, and access control",
      "Capstone: an approved AI workflow for your own unit",
    ],
  },
];

// ─── Course: Automation 101 ───────────────────────────────────────────────────

export const course = {
  id: "automation-101",
  title: "Automation 101",
  subtitle:
    "Seven short modules. Each one has a plain-language lesson, a hands-on exercise, and a quick quiz. Finish all seven and earn your certificate.",
  certificate_title: "Certificate of Completion",
  certificate_body:
    "has completed Automation 101, a seven-module programme covering automation fundamentals, prompt engineering, AI-assisted workflows, and output verification.",
};

export const modules: CourseModule[] = [
  // ── Module 1 ────────────────────────────────────────────────────────────────
  {
    id: "what-is-automation",
    order: 1,
    title: "What is automation, really?",
    tagline: "Teaching machines to do the boring parts",
    icon: "smart_toy",
    minutes: 10,
    objectives: [
      "Define automation in one sentence",
      "Recognise automation you already use every day",
      "Explain why clear instructions matter more than clever machines",
    ],
    blocks: [
      {
        type: "text",
        body: "Automation means setting up a machine or a program to do a task for you, the same way, every time, without you standing over it. That is the whole idea. A washing machine automates scrubbing clothes. A spam filter automates sorting your inbox. An alarm clock automates remembering to wake up.",
      },
      {
        type: "analogy",
        title: "The sandwich robot",
        body: "Imagine you own a robot and you ask it to make a sandwich. If you say 'make me a sandwich', the robot freezes. Which bread? Toasted? What filling? Cut in half or not? Now try: 'Take two slices of wheat bread. Spread butter on one side of each. Add one slice of cheese between them. Cut diagonally. Put it on a plate.' The robot nails it every time. Automation is exactly this: the machine supplies the muscle, you supply the instructions. The quality of the result depends on the quality of your instructions.",
      },
      {
        type: "text",
        body: "This matters at work because most jobs contain two kinds of tasks. There are judgement tasks, where a human weighs options and decides. And there are repeat tasks, where you do the same steps on different inputs: renaming files, copying numbers into a weekly report, summarising long documents into short ones. Repeat tasks are where automation shines. Judgement tasks stay with you.",
      },
      {
        type: "example",
        title: "A real example from a broadcast regulator",
        prompt: "A monitoring officer reviews recordings from 40 radio stations every week and writes a summary of anything that may breach the broadcast code.",
        output: "Listening and judging whether something breaches the code is judgement work. Turning 40 pages of notes into a formatted weekly summary table is repeat work. The second part can be automated. The first part should not be.",
      },
      {
        type: "keypoints",
        title: "Remember",
        items: [
          "Automation = a machine doing a defined task the same way every time",
          "You already use automation daily: spam filters, autocorrect, backups",
          "Clear instructions beat clever machines",
          "Automate the repeat work, keep the judgement work",
        ],
      },
    ],
    quiz: [
      {
        q: "Which of these is the best one-sentence definition of automation?",
        options: [
          "Robots replacing all human jobs",
          "A machine or program doing a defined task for you, the same way every time",
          "Anything that uses electricity",
          "Software that thinks like a person",
        ],
        answer: 1,
        explain: "Automation is about defined, repeatable tasks. It does not require thinking machines, and it is not about replacing judgement work.",
      },
      {
        q: "Your sandwich robot keeps making the wrong sandwich. What is the most likely cause?",
        options: [
          "The robot is broken",
          "Robots cannot make sandwiches",
          "Your instructions were vague",
          "The bread was the wrong brand",
        ],
        answer: 2,
        explain: "When automation misbehaves, check the instructions first. Vague input produces unpredictable output.",
      },
      {
        q: "Which task at a broadcasting regulator is the best candidate for automation?",
        options: [
          "Deciding whether a programme breached the broadcast code",
          "Negotiating with a station's management",
          "Reformatting weekly monitoring notes into a standard summary table",
          "Choosing the sanction for a violation",
        ],
        answer: 2,
        explain: "Reformatting notes is repeat work with defined steps. The other three are judgement calls that need a human.",
      },
      {
        q: "Which of these do you already use that counts as automation?",
        options: [
          "An email spam filter",
          "A paper notebook",
          "A handshake",
          "A window",
        ],
        answer: 0,
        explain: "A spam filter sorts every incoming message by rules, without you watching. That is automation working quietly for you already.",
      },
    ],
  },

  // ── Module 2 ────────────────────────────────────────────────────────────────
  {
    id: "meet-your-ai-assistant",
    order: 2,
    title: "Meet your AI assistant",
    tagline: "What an AI model actually is, and is not",
    icon: "neurology",
    minutes: 12,
    objectives: [
      "Explain in plain words how an AI language model works",
      "List three things AI assistants are good at and three things they are bad at",
      "Understand why AI sometimes makes things up",
    ],
    blocks: [
      {
        type: "text",
        body: "An AI assistant like Claude or ChatGPT is powered by a Large Language Model, or LLM. Strip away the mystery and an LLM does one thing: it predicts the next word. It read a huge amount of text during training, and it learned the patterns of how words follow other words. When you type a question, it builds an answer one word at a time, always choosing a likely next word.",
      },
      {
        type: "analogy",
        title: "The well-read parrot with a library card",
        body: "Picture a parrot that has read almost every book, article, and website ever written. Ask it anything and it answers fluently, because it has seen millions of similar sentences. But here is the catch: the parrot is not looking things up when it talks to you. It speaks from pattern memory. Usually the patterns land on the truth. Sometimes they land on something that merely sounds true. The parrot says both with the same confident voice.",
      },
      {
        type: "text",
        body: "That catch has a name: hallucination. When an AI states something false as if it were fact, we call it a hallucination. It happens because the model predicts plausible words rather than checking a database of facts. This is the single most important thing to know about AI at work, and it is why Module 6 of this course is entirely about catching mistakes.",
      },
      {
        type: "keypoints",
        title: "What AI assistants are good at",
        items: [
          "Summarising long documents into short ones",
          "Rewriting text: changing tone, fixing grammar, translating",
          "Drafting first versions of emails, reports, and tables",
          "Explaining concepts at any level you ask for",
          "Finding patterns in text you paste in",
        ],
      },
      {
        type: "keypoints",
        title: "What AI assistants are bad at",
        items: [
          "Precise facts, figures, dates, and citations from memory",
          "Maths with many steps, unless given a calculator tool",
          "Knowing about events after their training ended",
          "Saying 'I do not know' instead of guessing",
          "Keeping secrets: never paste confidential data into public tools",
        ],
      },
      {
        type: "tip",
        body: "A useful rule: treat an AI assistant like a brilliant new intern. Fast, tireless, well-read, eager to please. But you would not let an intern publish a report or quote a law without a senior person checking it first.",
      },
    ],
    quiz: [
      {
        q: "At its core, what does a Large Language Model do?",
        options: [
          "Searches the internet for answers",
          "Predicts the next word based on patterns it learned",
          "Copies answers from a database of facts",
          "Asks a human expert behind the scenes",
        ],
        answer: 1,
        explain: "An LLM generates text by predicting likely next words. It is not doing a live database lookup, which is exactly why it can be confidently wrong.",
      },
      {
        q: "What is a hallucination in AI?",
        options: [
          "When the AI refuses to answer",
          "When the AI responds too slowly",
          "When the AI states something false as if it were fact",
          "When the AI repeats your question back",
        ],
        answer: 2,
        explain: "Hallucination means fluent, confident, wrong. The model produced words that sound right but are not.",
      },
      {
        q: "Which task should you NOT trust an AI assistant to do from memory?",
        options: [
          "Rewrite a paragraph in simpler language",
          "Quote the exact section number of a regulation",
          "Draft a polite email reply",
          "Summarise notes you paste into it",
        ],
        answer: 1,
        explain: "Exact citations, figures, and section numbers are where hallucination bites hardest. Always check them against the source document.",
      },
      {
        q: "The 'brilliant intern' rule means:",
        options: [
          "AI should replace interns",
          "Use AI for speed, but keep human review before anything official",
          "Only interns should use AI",
          "AI output never needs checking",
        ],
        answer: 1,
        explain: "The intern rule keeps the human in charge. AI drafts, humans decide.",
      },
    ],
  },

  // ── Module 3 ────────────────────────────────────────────────────────────────
  {
    id: "your-first-prompt",
    order: 3,
    title: "Your first prompt",
    tagline: "Vague in, vague out. Clear in, gold out.",
    icon: "edit_note",
    minutes: 15,
    objectives: [
      "Write a prompt that states the task, the length, and the audience",
      "See how one vague prompt and one clear prompt produce different results",
      "Practise improving a prompt in the sandbox",
    ],
    blocks: [
      {
        type: "text",
        body: "A prompt is simply the instruction you type to an AI assistant. Remember the sandwich robot from Module 1? A prompt is you talking to that robot. Vague prompts produce vague answers. Specific prompts produce useful answers. This module is one skill only: being specific.",
      },
      {
        type: "example",
        title: "Vague prompt",
        prompt: "Summarize this transcript.",
        output: "The AI returns a long, wandering summary. It might focus on the wrong things, run to 500 words, and use language too technical to forward to your director. Not wrong, just not useful.",
      },
      {
        type: "example",
        title: "Clear prompt",
        prompt: "Summarize this radio transcript in 5 bullet points for a busy manager. Focus only on statements about health products. Use plain English. Under 100 words total.",
        output: "The AI returns exactly five short bullets, all about health product claims, readable in twenty seconds. Same AI, same transcript. The only thing that changed was your prompt.",
      },
      {
        type: "text",
        body: "Notice what the clear prompt contains. It names the task: summarize. It sets the format: 5 bullet points, under 100 words. It names the audience: a busy manager. It sets the focus: health product statements only. Four small decisions, and each one steers the output. You will learn the full recipe in the next module. For now, practise the instinct: before you press enter, ask yourself 'could a stranger follow this instruction without asking me a question?'",
      },
      {
        type: "tip",
        body: "If the first answer is not what you wanted, do not start over. Reply with a correction: 'Shorter. Only the claims about medicine. Number each point.' The AI remembers the conversation and adjusts. Prompting is a dialogue, not a slot machine.",
      },
    ],
    sandbox: {
      title: "Sandbox: fix the vague prompt",
      scenario: "You are a monitoring officer. You have a 12-page transcript of yesterday's morning show on Radio Alpha. Your supervisor needs a quick briefing about any claims made about miracle cures, and she has five minutes between meetings.",
      task: "Write a prompt that would get you a useful briefing. Make sure it says WHAT to do, WHAT TO FOCUS on, HOW LONG the output should be, and WHO it is for.",
      placeholder: "Type your prompt here, e.g. 'Summarize this transcript...'",
      rubric: [
        {
          id: "task",
          label: "Names the task (summarize, list, extract...)",
          keywords: ["summar", "list", "extract", "brief", "identify", "pull out", "find"],
          feedback: "Start with a clear action verb: summarize, list, or extract.",
        },
        {
          id: "focus",
          label: "Sets the focus (miracle cures / health claims)",
          keywords: ["miracle", "cure", "health", "medical", "medicine", "claim"],
          feedback: "Tell the AI what to look for. Here, that is claims about miracle cures.",
        },
        {
          id: "length",
          label: "Limits the length (bullets, word count, 'short')",
          keywords: ["bullet", "words", "short", "brief", "points", "sentences", "under", "concise", "100", "5 ", "five"],
          feedback: "Cap the output: '5 bullet points' or 'under 100 words'.",
        },
        {
          id: "audience",
          label: "Names the audience (supervisor, manager)",
          keywords: ["supervisor", "manager", "director", "boss", "busy", "for a", "for my"],
          feedback: "Say who will read it. 'For my supervisor who has five minutes' shapes the tone.",
        },
      ],
      passThreshold: 4,
      responses: {
        pass: "BRIEFING — Radio Alpha morning show\n• Presenter claimed a herbal tonic 'cures diabetes in 30 days' (no evidence cited).\n• A phone-in guest promoted an unregistered slimming tea as 'approved'.\n• Host repeated the tonic claim twice during ad segments.\n• No disclaimer or balancing statement was aired.\n• Recommend flagging segments at 08:14 and 09:02 for review.\n\nExactly what your supervisor needs. Notice how every part of your prompt shaped this output.",
        partial: "Here is a summary of the transcript: The morning show covered traffic, weather, a music segment, an interview about local football, and several product advertisements including health tonics...\n\nCloser, but it is drifting. The AI summarised everything instead of focusing, because part of your instruction was missing. Check the feedback list and add what is missing.",
        fail: "The transcript covers a three-hour morning broadcast including news, entertainment, listener calls, advertisements, and station identification segments. The show opened with...\n\nThat is a wandering, unfocused summary. Your supervisor has five minutes. Look at the checklist: your prompt is missing most of the four ingredients. Add them and try again.",
      },
      exampleSolution: "Summarize this radio transcript for my supervisor, who has five minutes. Focus only on claims about miracle cures or health products. Give me 5 bullet points, under 100 words total, in plain English, and note the timestamps of the key segments.",
    },
    quiz: [
      {
        q: "What is a prompt?",
        options: [
          "The AI's answer",
          "The instruction you give an AI assistant",
          "A type of computer virus",
          "A paid feature",
        ],
        answer: 1,
        explain: "The prompt is your instruction. Everything the AI produces flows from it.",
      },
      {
        q: "The clear prompt in this module worked better because it:",
        options: [
          "Was longer, and longer is always better",
          "Used technical jargon",
          "Specified task, focus, length, and audience",
          "Was typed in capital letters",
        ],
        answer: 2,
        explain: "Length alone does nothing. The clear prompt worked because each added word was a decision: what, about what, how long, for whom.",
      },
      {
        q: "The AI's first answer misses the point. Best next move?",
        options: [
          "Give up and do it manually",
          "Reply with a specific correction and let it adjust",
          "Type the same prompt again, but angrier",
          "Assume AI cannot do this task",
        ],
        answer: 1,
        explain: "Prompting is a dialogue. A short correction usually gets you there on the second turn.",
      },
      {
        q: "A good self-check before sending a prompt is:",
        options: [
          "Is this under 10 words?",
          "Could a stranger follow this instruction without asking me a question?",
          "Did I say please?",
          "Did I mention AI in the prompt?",
        ],
        answer: 1,
        explain: "If a stranger would need to ask 'how long? about what? for whom?', so will the AI, except it will not ask. It will guess.",
      },
    ],
  },

  // ── Module 4 ────────────────────────────────────────────────────────────────
  {
    id: "the-prompt-recipe",
    order: 4,
    title: "The Prompt Recipe",
    tagline: "Role + Task + Context + Format. Four parts, every time.",
    icon: "receipt_long",
    minutes: 15,
    objectives: [
      "Learn the four-part Prompt Recipe: Role, Task, Context, Format",
      "Build a complete recipe prompt from scratch",
      "Recognise which part is missing when output disappoints",
    ],
    blocks: [
      {
        type: "text",
        body: "Module 3 taught the instinct. This module gives you the recipe you can reuse forever. Every strong prompt has four parts. Role: who the AI should act as. Task: what to do, with a clear action verb. Context: the background it needs, including the text you paste in. Format: what the output should look like. Say them in any order, but say all four.",
      },
      {
        type: "keypoints",
        title: "The Prompt Recipe card",
        items: [
          "ROLE — 'You are an experienced compliance analyst...'",
          "TASK — 'Review the notes below and extract every advertising claim...'",
          "CONTEXT — 'These are monitoring notes from 12 radio stations. Our code bans unverified health claims...'",
          "FORMAT — 'Output a table with columns: Station, Time, Claim, Risk level (High/Medium/Low).'",
        ],
      },
      {
        type: "text",
        body: "Why does Role work? Because it tells the model which patterns to draw on. 'You are a compliance analyst' pulls the answer toward careful, formal, evidence-minded writing. 'You are a friendly teacher explaining to a 12-year-old' pulls it toward simple words and examples. Same question, different role, very different answer. Try it once and you will never skip Role again.",
      },
      {
        type: "example",
        title: "A full recipe prompt",
        prompt: "You are an experienced broadcast compliance analyst. Review the monitoring notes below and extract every advertising claim about health products. Context: our broadcast code prohibits unverified health claims; these notes cover 12 stations from last week. Format: a table with columns Station | Time | Claim | Risk (High/Medium/Low), followed by a two-sentence overall assessment. Notes: [pasted notes]",
        output: "A tidy table you can paste straight into your weekly report, plus a two-sentence summary for the cover email. Ten seconds of reading instead of an hour of formatting.",
      },
      {
        type: "tip",
        body: "Debugging trick: when output disappoints, name the missing ingredient. Rambling and unfocused? Task was fuzzy. Wrong tone? Role was missing. Made wrong assumptions? Context was thin. Messy layout? You never specified Format. Fix that one part and rerun.",
      },
    ],
    sandbox: {
      title: "Sandbox: build a full recipe prompt",
      scenario: "Every Friday you receive rough notes from five field officers about complaints from the public: things like offensive song lyrics aired at noon, misleading adverts, and stations drifting off their licensed frequency. Your director wants one clean weekly table plus a short recommendation paragraph.",
      task: "Write ONE prompt using all four recipe parts: give the AI a Role, state the Task, provide Context about the notes and the rules, and define the output Format (a table plus a recommendation).",
      placeholder: "You are a... Review the... Context: ... Format: ...",
      rubric: [
        {
          id: "role",
          label: "ROLE — tells the AI who to be",
          keywords: ["you are", "act as", "as a", "analyst", "officer", "expert", "assistant,"],
          feedback: "Open with a role: 'You are an experienced complaints analyst at a broadcast regulator.'",
        },
        {
          id: "task",
          label: "TASK — clear action verb",
          keywords: ["review", "extract", "organize", "organise", "compile", "summar", "sort", "classify", "turn", "convert"],
          feedback: "State the action: review, extract, compile, or classify the complaints.",
        },
        {
          id: "context",
          label: "CONTEXT — background about the notes and rules",
          keywords: ["field officer", "complaint", "weekly", "notes", "station", "code", "rules", "public", "these are"],
          feedback: "Give background: where the notes come from, what rules apply, what period they cover.",
        },
        {
          id: "format",
          label: "FORMAT — defines the table and the recommendation",
          keywords: ["table", "column", "format", "paragraph", "recommendation", "rows", "|", "list followed"],
          feedback: "Define the shape: a table with named columns, then a short recommendation paragraph.",
        },
      ],
      passThreshold: 4,
      responses: {
        pass: "WEEKLY COMPLAINTS TABLE\nStation | Date | Complaint | Category | Severity\nRadio Beta | Tue | Explicit lyrics aired 12:40 | Content standards | High\nTV Delta | Wed | 'Win a visa' promo, unverifiable | Misleading advert | High\nRadio Gamma | Thu | Signal drift onto adjacent frequency | Technical licence | Medium\n...\n\nRECOMMENDATION: Two complaints meet the threshold for formal review this week. Suggest prioritising the Radio Beta content case, as it aired within protected daytime hours.\n\nDirector-ready. Every recipe part you wrote shaped a piece of this output.",
        partial: "Here is an organised version of the complaints:\n1. Explicit lyrics on Radio Beta\n2. A misleading advert on TV Delta\n3. A frequency issue at Radio Gamma\n...\n\nUsable, but it is a list, not the table your director asked for, and there is no recommendation. Something in your recipe is missing. Check the feedback list.",
        fail: "The notes mention several complaints from the public about radio and television stations, covering various topics such as music content, advertising, and technical matters...\n\nThat is a paragraph about the notes, not a work product. Your prompt is missing most of the recipe. Add Role, Task, Context, and Format, and run it again.",
      },
      exampleSolution: "You are an experienced complaints analyst at a broadcast regulator. Task: review the field officer notes below and compile every complaint from this week. Context: these are rough notes from five officers; our code covers content standards, misleading advertising, and technical licence conditions. Format: a table with columns Station | Date | Complaint | Category | Severity (High/Medium/Low), then a short paragraph recommending which cases need formal review first. Notes: [paste notes]",
      },
    quiz: [
      {
        q: "What are the four parts of the Prompt Recipe?",
        options: [
          "Role, Task, Context, Format",
          "Question, Answer, Review, Repeat",
          "Speed, Length, Tone, Emoji",
          "Input, Output, Storage, Network",
        ],
        answer: 0,
        explain: "Role, Task, Context, Format. Any order, all four.",
      },
      {
        q: "Why does giving the AI a Role change the output?",
        options: [
          "It unlocks a paid mode",
          "It steers which writing patterns the model draws on",
          "It makes the AI legally responsible",
          "It does not change anything",
        ],
        answer: 1,
        explain: "A role points the model at the right patterns: analyst pulls formal and careful, teacher pulls simple and friendly.",
      },
      {
        q: "Your output has the right content but a messy layout. Which ingredient was missing?",
        options: ["Role", "Task", "Context", "Format"],
        answer: 3,
        explain: "Right content, wrong shape points at Format. Define the table, the columns, the length.",
      },
      {
        q: "The AI made wrong assumptions about your rules. Which ingredient was thin?",
        options: ["Role", "Task", "Context", "Format"],
        answer: 2,
        explain: "Wrong assumptions mean the model lacked background. Feed it the context it could not know.",
      },
    ],
  },

  // ── Module 5 ────────────────────────────────────────────────────────────────
  {
    id: "automate-a-boring-task",
    order: 5,
    title: "Automate a boring task, end to end",
    tagline: "From a pile of notes to a finished report in minutes",
    icon: "task_alt",
    minutes: 18,
    objectives: [
      "Walk through a full real-world automation: raw notes to finished report",
      "Turn a good prompt into a reusable template",
      "Know the checklist for automating any repeat task",
    ],
    blocks: [
      {
        type: "text",
        body: "Time to put the recipe to work on a full task. Meet Ada. Every Monday, Ada receives about 40 pages of raw monitoring notes. Every Monday, she spends three hours turning them into the same weekly report: a summary, a table of incidents, and a list of items needing follow-up. Same steps, different content, every single week. This is a perfect automation target.",
      },
      {
        type: "text",
        body: "Step one: Ada writes a recipe prompt for the whole job and tests it on last week's notes, where she already knows what the right answer looks like. Testing on a week you already finished by hand is the safest way to learn what the AI gets right and wrong. Step two: she compares the AI draft to her own hand-made report. The table is accurate but the summary missed one incident. Step three: she adjusts the prompt, adding 'include every incident, even minor ones, and mark severity'. Second run: complete.",
      },
      {
        type: "text",
        body: "Step four is the one most people skip. Ada saves the final prompt in a document called her prompt library. Next Monday, she opens it, pastes the new notes, and gets her draft in one minute. Her three-hour task is now a twenty-minute task: one minute of generating, nineteen minutes of checking and polishing. The checking stays. It always stays.",
      },
      {
        type: "keypoints",
        title: "The automation checklist",
        items: [
          "1. Pick a task you repeat with the same steps each time",
          "2. Write a full recipe prompt: Role, Task, Context, Format",
          "3. Test it on an old example where you know the right answer",
          "4. Compare, fix the prompt, and rerun until it matches your standard",
          "5. Save the prompt to your library and reuse it",
          "6. Always review the output before it goes anywhere official",
        ],
      },
      {
        type: "tip",
        body: "Name your saved prompts like tools, not like files. 'Weekly monitoring report v3' beats 'prompt2final'. Note beside each one what it is for and when you last updated it. Your prompt library becomes real workplace infrastructure, and colleagues can reuse it too.",
      },
    ],
    sandbox: {
      title: "Sandbox: adapt a template to a new job",
      scenario: "Here is Ada's saved prompt: 'You are a broadcast monitoring analyst. Review the notes below and produce our weekly report. Context: notes cover all licensed stations, Mon-Sun. Format: a 5-bullet executive summary, an incident table (Station | Date | Incident | Severity), and a follow-up list.' Your unit does something different: you process viewer COMPLAINT EMAILS each month, and your director wants trends over time, not just a list.",
      task: "Adapt Ada's template for your unit. Keep the recipe structure, but change it to: monthly complaint emails as input, and add a section about trends compared to last month.",
      placeholder: "You are a... Review the complaint emails... Format: ...",
      rubric: [
        {
          id: "role",
          label: "Keeps a relevant ROLE",
          keywords: ["you are", "act as", "analyst", "officer"],
          feedback: "Keep the role line, adjusted to your unit: 'You are a complaints analyst...'",
        },
        {
          id: "input",
          label: "Changes the input to complaint emails",
          keywords: ["email", "complaint"],
          feedback: "The input changed: say the source material is viewer complaint emails.",
        },
        {
          id: "period",
          label: "Changes the period to monthly",
          keywords: ["month", "30 days", "monthly"],
          feedback: "Ada's was weekly. Yours is monthly. Say so.",
        },
        {
          id: "trends",
          label: "Adds a trends section vs last month",
          keywords: ["trend", "compare", "last month", "previous month", "change", "increase", "decrease"],
          feedback: "Your director wants trends. Ask for a comparison against last month's numbers.",
        },
      ],
      passThreshold: 3,
      responses: {
        pass: "MONTHLY COMPLAINTS REPORT — July\nExecutive summary: complaint volume rose 18% over June, driven by advertising complaints...\nComplaint table: Station | Date | Complaint | Category | Severity ...\nTRENDS vs JUNE: advertising complaints up 18%, content complaints flat, technical complaints down 40% after the transmitter fix...\nFollow-up list: 3 items...\n\nYou just did the most valuable thing in this course: you took a working template and bent it to a new job in two minutes.",
        partial: "MONTHLY COMPLAINTS REPORT\nSummary of complaints received: ...\nComplaint table: ...\n\nGood adaptation of the input, but the report reads exactly like Ada's weekly one. Your director's key request is missing. Check the feedback list.",
        fail: "WEEKLY MONITORING REPORT\nExecutive summary: ...\nIncident table: ...\n\nThis is still Ada's report. The AI followed the template you gave it, which you did not actually change. Adapt the input, the period, and the sections to your unit's job.",
      },
      exampleSolution: "You are a viewer complaints analyst at a broadcast regulator. Review the complaint emails below and produce our monthly report. Context: emails cover all complaints received this calendar month; last month's totals are included at the end for comparison. Format: a 5-bullet executive summary, a complaint table (Station | Date | Complaint | Category | Severity), a TRENDS section comparing this month to last month by category, and a follow-up list. Emails: [paste]",
    },
    quiz: [
      {
        q: "Why did Ada test her prompt on LAST week's notes first?",
        options: [
          "Old notes are shorter",
          "She already knew the right answer, so she could judge the AI's draft",
          "The AI works better on old data",
          "Her supervisor told her to",
        ],
        answer: 1,
        explain: "Testing where you know the ground truth is the safest way to calibrate. You can see exactly what the AI missed.",
      },
      {
        q: "The AI's first draft missed one incident. What did Ada do?",
        options: [
          "Gave up on automation",
          "Adjusted the prompt to require every incident, then reran",
          "Sent the report anyway",
          "Switched to a different AI",
        ],
        answer: 1,
        explain: "First drafts reveal what the prompt failed to demand. Fix the instruction, not your expectations.",
      },
      {
        q: "What is a prompt library?",
        options: [
          "A building where prompts are stored",
          "A saved, named collection of your tested prompts for reuse",
          "A paid AI feature",
          "The AI's training data",
        ],
        answer: 1,
        explain: "A prompt library turns one-off wins into repeatable workflows, for you and your colleagues.",
      },
      {
        q: "After automation, which part of Ada's task remained fully human?",
        options: [
          "Pasting the notes",
          "Generating the table",
          "Reviewing the output before it goes anywhere official",
          "Formatting the summary",
        ],
        answer: 2,
        explain: "The review never gets automated away. AI drafts, humans approve. That rule holds in every module of this course.",
      },
    ],
  },

  // ── Module 6 ────────────────────────────────────────────────────────────────
  {
    id: "when-the-robot-is-wrong",
    order: 6,
    title: "When the robot is wrong",
    tagline: "Trust, but verify. Every time.",
    icon: "fact_check",
    minutes: 15,
    objectives: [
      "Recognise the situations where AI is most likely to be wrong",
      "Apply the traffic-light rule to decide how much checking a task needs",
      "Write verification into your prompts",
    ],
    blocks: [
      {
        type: "text",
        body: "Everything in this course rests on one discipline: checking. An AI that saves you three hours but slips one invented fact into an official report has not saved you anything. In a regulator, a hallucinated quote or a wrong section number can affect enforcement, credibility, and public trust. So this module is the most important one, and it is the one that separates professionals from casual users.",
      },
      {
        type: "keypoints",
        title: "Where AI errors cluster",
        items: [
          "Exact numbers, dates, names, and quotes 'from memory'",
          "Legal citations and section numbers",
          "Events after the model's training ended",
          "Anything you did not paste in but assumed it knew",
          "Long documents: details from the middle get dropped or blurred",
        ],
      },
      {
        type: "text",
        body: "Use the traffic-light rule to decide how much checking a task needs. Green tasks: drafting, rewording, summarising text you provided and will read anyway. Light check. Yellow tasks: analysis, classifications, tables that feed decisions. Check every figure against the source. Red tasks: legal citations, official findings, sanctions, anything published under your organisation's name. A named human verifies every claim, line by line, before it moves.",
      },
      {
        type: "example",
        title: "Spot the hallucination",
        prompt: "An officer asked an AI: 'What does our broadcast code say about advertising medicines?' The AI answered: 'Section 7.3.2 of the code states that all medicinal adverts require pre-approval by the Commission, as amended in the 2019 revision.'",
        output: "It sounds authoritative. It names a section, a rule, and a year. But the officer never pasted the code into the chat. The AI answered from pattern memory, and every specific detail in that sentence is unverified. Correct move: open the actual code, or paste it in and ask again. Confidence is not evidence.",
      },
      {
        type: "tip",
        body: "Build checking into the prompt itself. Add lines like: 'Only use the text I provided. If the answer is not in the text, say NOT FOUND rather than guessing. Quote the exact line for each claim you make.' These instructions cut hallucinations sharply, because they give the model permission to admit uncertainty.",
      },
      {
        type: "text",
        body: "One more rule, and it is absolute: never paste confidential, personal, or restricted information into a public AI tool. Names in complaints, unpublished findings, licence applications, anything marked internal. If your organisation has an approved private AI environment, use that. If you are unsure whether something is safe to paste, it is not.",
      },
    ],
    sandbox: {
      title: "Sandbox: write a verification-first prompt",
      scenario: "You need to check what penalties the broadcast code allows for airing unverified health claims. You have the code as a document you can paste in. Last time, a colleague asked the AI from memory and it invented a section number.",
      task: "Write a prompt that forces the AI to work only from the pasted document, to quote its evidence, and to admit when something is not found. Assume you will paste the code below your prompt.",
      placeholder: "Using only the document below...",
      rubric: [
        {
          id: "source",
          label: "Restricts the AI to the provided document",
          keywords: ["only", "provided", "below", "this document", "the text i", "pasted", "attached"],
          feedback: "Say 'use only the document below'. Without it, the model will happily answer from memory.",
        },
        {
          id: "task",
          label: "States the task (find penalties for health claims)",
          keywords: ["penalt", "sanction", "health", "claim", "fine", "punish"],
          feedback: "Name what you are looking for: penalties for unverified health claims.",
        },
        {
          id: "quote",
          label: "Requires quoted evidence or section references",
          keywords: ["quote", "exact", "cite", "section", "line", "reference", "verbatim"],
          feedback: "Demand receipts: 'quote the exact section for every claim'.",
        },
        {
          id: "notfound",
          label: "Allows the AI to say NOT FOUND instead of guessing",
          keywords: ["not found", "say so", "do not guess", "don't guess", "if it is not", "if not in", "admit", "unsure", "cannot find"],
          feedback: "Give it an exit: 'if the answer is not in the document, say NOT FOUND'. This is the anti-hallucination switch.",
        },
      ],
      passThreshold: 4,
      responses: {
        pass: "FOUND — Section 5.4: 'Advertisements for medicines and health products shall not be broadcast without verification by the relevant authority.' Quoted verbatim.\nPENALTIES — Section 12.1(b): 'breach of advertising provisions attracts a written warning on first occurrence and a fine on repeat occurrence.' Quoted verbatim.\nNOT FOUND — the document does not specify fine amounts. That figure would need the schedule of penalties, which is not in the text you provided.\n\nNotice the difference: every claim carries a quote, and the AI admitted what the document does not contain. This is what a verification-first prompt buys you.",
        partial: "Based on the document, penalties for unverified health claims include warnings and fines under the advertising provisions...\n\nDirectionally useful, but there are no quoted sections, so you would still have to look everything up yourself to trust it. Check the feedback list and tighten the prompt.",
        fail: "Under broadcasting regulations, airing unverified health claims typically attracts sanctions such as fines, suspension, or licence revocation, as provided in Section 7.3.2...\n\nStop. 'Typically' and an unverified section number mean the model is answering from memory, exactly what burned your colleague. Restrict it to the document, demand quotes, and allow NOT FOUND.",
      },
      exampleSolution: "Using ONLY the document below, tell me what penalties apply to airing unverified health claims. Quote the exact section and line for every claim you make. If the answer is not in the document, say NOT FOUND rather than guessing. Do not use any outside knowledge. Document: [paste code]",
    },
    quiz: [
      {
        q: "Which output deserves the heaviest checking before use?",
        options: [
          "A reworded paragraph of your own text",
          "A draft agenda for a team meeting",
          "A legal section number quoted in an official finding",
          "A simpler explanation of a concept",
        ],
        answer: 2,
        explain: "Red-light territory: legal citations in official documents. A named human verifies line by line.",
      },
      {
        q: "The AI cites 'Section 7.3.2' of a document you never pasted in. What is happening?",
        options: [
          "It looked up the real document online",
          "It is answering from pattern memory, and the citation is unverified",
          "It has access to your office files",
          "Section numbers are always correct",
        ],
        answer: 1,
        explain: "No document in, no lookup happened. Specific-sounding details from memory are the classic shape of hallucination.",
      },
      {
        q: "Which prompt line reduces hallucination most?",
        options: [
          "'Be very accurate please'",
          "'If the answer is not in the provided text, say NOT FOUND rather than guessing'",
          "'You are the world's smartest AI'",
          "'Answer quickly'",
        ],
        answer: 1,
        explain: "Giving the model explicit permission to admit uncertainty removes the pressure to produce a plausible guess.",
      },
      {
        q: "A complaint file contains members of the public's names and phone numbers. Can you paste it into a public AI tool?",
        options: [
          "Yes, if it saves time",
          "Yes, if you delete it afterwards",
          "No. Confidential and personal data never goes into public tools",
          "Only on weekends",
        ],
        answer: 2,
        explain: "Absolute rule. Personal and restricted data stays out of public tools, full stop. Use an approved private environment or do not use AI for that task.",
      },
    ],
  },

  // ── Module 7 ────────────────────────────────────────────────────────────────
  {
    id: "capstone",
    order: 7,
    title: "Capstone: automate your own task",
    tagline: "Put it all together and earn your certificate",
    icon: "workspace_premium",
    minutes: 20,
    objectives: [
      "Apply the full method to a task from your own work",
      "Combine the Prompt Recipe with verification instructions",
      "Earn your Automation 101 certificate",
    ],
    blocks: [
      {
        type: "text",
        body: "You now hold the complete beginner's toolkit. You know what automation is and which tasks deserve it. You know what an AI assistant actually does and where it fails. You can write a recipe prompt, turn it into a reusable template, and wrap it in verification so mistakes get caught before they travel. One exercise remains: doing it for real.",
      },
      {
        type: "keypoints",
        title: "The full method, on one card",
        items: [
          "Pick a repeat task (Module 1)",
          "Match it to what AI does well (Module 2)",
          "Be specific: task, focus, length, audience (Module 3)",
          "Build the recipe: Role, Task, Context, Format (Module 4)",
          "Test on a known example, fix, save to your library (Module 5)",
          "Add verification lines and review before use (Module 6)",
        ],
      },
      {
        type: "text",
        body: "In the sandbox below, you will write one complete, production-grade prompt for a task drawn from real regulatory work. It must carry the whole method: a role, a clear task, context, a defined format, and at least one verification instruction. This is the prompt style you will use on the job from tomorrow morning.",
      },
      {
        type: "tip",
        body: "After the capstone, your certificate unlocks on the course page. And when you are ready for more: Automation Fluency (Tier 2) teaches multi-step pipelines, team prompt libraries, and compliance-grade analysis. Automation Pro (Tier 3) covers agentic workflows, synthetic media triage, and AI governance. Both are open for waitlist now.",
      },
    ],
    sandbox: {
      title: "Capstone: the everything prompt",
      scenario: "Your directorate receives daily summaries from zonal offices. Each morning, someone compiles them into a national situation brief for the Director-General: key incidents, licence issues, and anything needing a decision today. It takes 90 minutes by hand. The daily summaries can be pasted as text.",
      task: "Write the complete prompt you would save as 'Daily national brief v1'. It needs all four recipe parts PLUS at least one verification instruction (only use provided text, quote evidence, or say NOT FOUND). This is your capstone: write it like it is going into your real prompt library.",
      placeholder: "You are... Task: ... Context: ... Format: ... Verification: ...",
      rubric: [
        {
          id: "role",
          label: "ROLE is set",
          keywords: ["you are", "act as", "analyst", "officer", "assistant,"],
          feedback: "Open with the role. Who should the AI be for this job?",
        },
        {
          id: "task",
          label: "TASK has a clear action verb",
          keywords: ["compile", "summar", "produce", "create", "extract", "draft", "generate", "review"],
          feedback: "State the action: compile the daily summaries into a national brief.",
        },
        {
          id: "context",
          label: "CONTEXT explains the inputs and the reader",
          keywords: ["zonal", "daily", "director", "summaries", "offices", "morning", "national"],
          feedback: "Explain what the pasted text is and who reads the result.",
        },
        {
          id: "format",
          label: "FORMAT defines the brief's sections",
          keywords: ["section", "table", "bullet", "format", "column", "heading", "list", "|"],
          feedback: "Define the shape: sections for incidents, licence issues, and decisions needed.",
        },
        {
          id: "verify",
          label: "VERIFICATION instruction included",
          keywords: ["only", "not found", "quote", "do not guess", "don't guess", "provided", "cite", "verbatim", "if unsure", "say so"],
          feedback: "Add the safety line: only use provided text, quote evidence, or say NOT FOUND when information is missing.",
        },
      ],
      passThreshold: 5,
      responses: {
        pass: "NATIONAL SITUATION BRIEF — [date]\n1. KEY INCIDENTS: three items, each with zone, station, and quoted source line...\n2. LICENCE ISSUES: two renewals flagged, quoted from the Kaduna zone summary...\n3. DECISIONS NEEDED TODAY: one item, marked urgent by the Enugu zone report...\nNOT FOUND: no zone reported on the transmitter audit; yesterday's brief listed it as pending.\n\nThat is a production-grade result: structured, sourced, and honest about gaps. Congratulations. You have completed the capstone. Mark this module complete to unlock your certificate.",
        partial: "NATIONAL SITUATION BRIEF\nSummary of reports from zonal offices: several incidents were reported including...\n\nThe structure is emerging, but it is missing pieces of the method, and with no verification instruction, every detail would need manual re-checking. Look at the feedback list: you are close.",
        fail: "Here is a summary of the daily reports: various zonal offices reported incidents and updates across the country...\n\nA 90-minute task deserves better than a vague paragraph. Go back to the method card above: Role, Task, Context, Format, plus one verification line. Build it piece by piece.",
      },
      exampleSolution: "You are a senior operations analyst preparing the Director-General's morning brief at a national broadcast regulator. Task: compile the zonal daily summaries below into one national situation brief. Context: summaries come from six zonal offices and cover the past 24 hours; the DG reads this in five minutes before the morning meeting. Format: three sections with headings: 1) KEY INCIDENTS (bullet list, zone and station named), 2) LICENCE ISSUES (table: Zone | Station | Issue | Deadline), 3) DECISIONS NEEDED TODAY (numbered, most urgent first). Verification: use only the summaries provided below, quote the source line for each incident, and write NOT FOUND for anything expected but missing. Summaries: [paste]",
    },
    quiz: [
      {
        q: "What makes a prompt 'production-grade' in this course's terms?",
        options: [
          "It is over 500 words long",
          "It has all four recipe parts plus verification instructions",
          "It uses impressive vocabulary",
          "It was written by an engineer",
        ],
        answer: 1,
        explain: "Recipe plus verification. That combination produces output you can check quickly and trust appropriately.",
      },
      {
        q: "Where should your capstone prompt live after this course?",
        options: [
          "In your head",
          "Nowhere, prompts are single-use",
          "In your named, dated prompt library, shared with your team where useful",
          "Printed and framed",
        ],
        answer: 2,
        explain: "Saved prompts are workplace infrastructure. The library is the difference between a trick and a capability.",
      },
      {
        q: "After AI drafts the DG's morning brief, who is responsible for its accuracy?",
        options: [
          "The AI company",
          "Nobody, briefs are informal",
          "The human who reviews and sends it",
          "The zonal offices",
        ],
        answer: 2,
        explain: "Accountability never transfers to the tool. AI drafts, a named human verifies and owns what goes out.",
      },
      {
        q: "What does Tier 2, Automation Fluency, add beyond this course?",
        options: [
          "The same content, repeated",
          "Multi-step pipelines, team prompt libraries, and compliance-grade analysis",
          "Hardware repair skills",
          "Video editing",
        ],
        answer: 1,
        explain: "Tier 2 moves from single prompts to systems: chained workflows, shared libraries, and structured evaluation. Join the waitlist from the course page.",
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getModule(id: string): CourseModule | undefined {
  return modules.find((m) => m.id === id);
}

export function getNextModule(id: string): CourseModule | undefined {
  const current = getModule(id);
  if (!current) return undefined;
  return modules.find((m) => m.order === current.order + 1);
}
