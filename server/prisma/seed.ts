/**
 * Demo seed — fills the local database with a realistic student-org workspace
 * (plus a small second organization so the org switcher has something to
 * switch between).
 *
 * Run from server/:  npm run db:seed
 *
 * Safe to re-run: nothing is ever deleted, and an organization that already
 * exists is skipped. Everything goes through the same services the API uses,
 * so permissions, activity-log rows and the proposal state machine behave
 * exactly as they do in the running app.
 */
import 'dotenv/config';
import { prisma } from '../src/config/database';
import { AuthService } from '../src/features/auth/auth.service';
import { MemberService } from '../src/features/organizations/member.service';
import { OrganizationService } from '../src/features/organizations/organization.service';
import { findMembership } from '../src/features/organizations/memberships';
import { ProjectService } from '../src/features/projects/project.service';
import { TaskService } from '../src/features/projects/task.service';
import {
  ProposalService,
  type WireProposalStatus,
} from '../src/features/proposals/proposal.service';

/** Every demo account shares this password. */
const DEMO_PASSWORD = 'ugnay12345';

const authService = new AuthService();
const organizationService = new OrganizationService();
const memberService = new MemberService();
const projectService = new ProjectService();
const taskService = new TaskService();
const proposalService = new ProposalService();

type ProjectKey = 'foundation' | 'intramurals' | 'cleanup' | 'homecoming';
type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
type TaskPriority = 'low' | 'medium' | 'high';

interface DemoUser {
  key: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
}

interface DemoTask {
  project: ProjectKey;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  /** Demo user key, or null to leave the task unassigned. */
  assignee: string | null;
  /** Negative = overdue, positive = upcoming, null = no due date. */
  dueInDays: number | null;
}

interface DemoProposal {
  title: string;
  description: string;
  project: ProjectKey | null;
  dueInDays: number | null;
  /** Transitions applied after creation, in order. Empty = stays a draft. */
  steps: WireProposalStatus[];
  signatures: Array<{ name: string; role: string; complete: boolean }>;
}

interface DemoCommittee {
  name: string;
  description: string;
  /** Demo user key of the committee head. */
  head: string;
  members: string[];
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
async function ensureUser(user: DemoUser): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true },
  });
  if (existing) return existing.id;

  // register() hashes the password with bcrypt exactly like a real signup.
  const created = await authService.register({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    password: DEMO_PASSWORD,
    confirmPassword: DEMO_PASSWORD,
  });

  return created.id;
}

async function findOrganizationId(name: string): Promise<string | null> {
  const organization = await prisma.organization.findFirst({
    where: { name },
    select: { id: true },
  });

  return organization?.id ?? null;
}

async function createOrganization(name: string, description: string, ownerUserId: string) {
  // Atomic: organization + default positions/permissions + President membership
  // + "created organization" activity row (same path as the real endpoint).
  const { organization, membership } = await organizationService.create(ownerUserId, {
    name,
    description,
  });

  const positions = await prisma.position.findMany({
    where: { organizationId: organization.id },
    select: { id: true, name: true },
  });

  return {
    organizationId: organization.id,
    ownerMembershipId: membership.id,
    positionIds: new Map(positions.map((position) => [position.name, position.id])),
  };
}

async function addMemberByEmail(
  organizationId: string,
  actorMemberId: string,
  positionIds: Map<string, string>,
  email: string,
  positionName: string,
): Promise<string> {
  const positionId = positionIds.get(positionName);
  if (!positionId) {
    throw new Error(`Position "${positionName}" is missing from ${organizationId}`);
  }

  const { member } = await memberService.addMember(
    organizationId,
    { email, positionId },
    { organizationMemberId: actorMemberId },
  );

  return member.id;
}

async function actorFor(userId: string, organizationId: string) {
  const membership = await findMembership(userId, organizationId);
  if (!membership) {
    throw new Error('Actor is not a member of the organization');
  }

  return { membership };
}

type Actor = Awaited<ReturnType<typeof actorFor>>;
async function createTask(
  organizationId: string,
  actorMemberId: string,
  projectId: string,
  task: DemoTask,
  memberIdsByUserKey: Map<string, string>,
): Promise<void> {
  const { task: created } = await taskService.create(
    organizationId,
    projectId,
    {
      title: task.title,
      description: task.description,
      priority: task.priority,
      assigneeId: task.assignee ? (memberIdsByUserKey.get(task.assignee) ?? null) : null,
      dueDate: task.dueInDays === null ? '' : daysFromNow(task.dueInDays).toISOString(),
    },
    { organizationMemberId: actorMemberId },
  );

  // create() always starts a task in BACKLOG; move the rest so every board
  // column has cards and the activity feed gets real "moved task" entries.
  if (task.status !== 'backlog') {
    await taskService.updateStatus(organizationId, projectId, created.id, task.status, {
      organizationMemberId: actorMemberId,
    });
  }
}

async function createProposal(
  organizationId: string,
  actor: Actor,
  proposal: DemoProposal,
  projectIds: Map<ProjectKey, string>,
): Promise<void> {
  const { proposal: created } = await proposalService.create(
    organizationId,
    { title: proposal.title, description: proposal.description },
    actor,
  );

  await prisma.proposal.update({
    where: { id: created.id },
    data: {
      projectId: proposal.project ? (projectIds.get(proposal.project) ?? null) : null,
      dueDate: proposal.dueInDays === null ? null : daysFromNow(proposal.dueInDays),
      responsibleMemberId: actor.membership.id,
    },
  });

  // Signatories are attached after the first transition: the service only
  // blocks new signatories on decided (rejected/completed) proposals, so
  // every demo workflow — including the completed one, whose signatures are
  // all marked complete before the final step — stays valid.
  const [firstStep, ...laterSteps] = proposal.steps;
  if (firstStep) {
    await proposalService.updateStatus(organizationId, created.id, firstStep, actor);
  }

  for (const signature of proposal.signatures) {
    const { signature: added } = await proposalService.addSignature(
      organizationId,
      created.id,
      { signatoryName: signature.name, role: signature.role },
      actor,
    );

    if (signature.complete) {
      await proposalService.completeSignature(organizationId, created.id, added.id, actor);
    }
  }

  for (const step of laterSteps) {
    await proposalService.updateStatus(organizationId, created.id, step, actor);
  }
}
// ─────────────────────────────────────────────────────────
// DEMO DATA — Ugnay Student Council (primary workspace)
// ─────────────────────────────────────────────────────────

const PRIMARY_USERS: DemoUser[] = [
  {
    key: 'president',
    firstName: 'Maria',
    lastName: 'Santos',
    email: 'president@ugnay.test',
    position: 'President',
  },
  {
    key: 'vp',
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    email: 'vp@ugnay.test',
    position: 'Vice President',
  },
  {
    key: 'secretary',
    firstName: 'Ana',
    lastName: 'Reyes',
    email: 'secretary@ugnay.test',
    position: 'Secretary',
  },
  {
    key: 'treasurer',
    firstName: 'Carlo',
    lastName: 'Mendoza',
    email: 'treasurer@ugnay.test',
    position: 'Treasurer',
  },
  {
    key: 'member',
    firstName: 'Liza',
    lastName: 'Fernandez',
    email: 'member@ugnay.test',
    position: 'Member',
  },
];

const PRIMARY_PROJECTS: Array<{ key: ProjectKey; name: string; description: string }> = [
  {
    key: 'foundation',
    name: 'Foundation Day 2026',
    description: 'Annual foundation celebration: program, booths, and on-the-day logistics.',
  },
  {
    key: 'intramurals',
    name: 'Intramurals 2026',
    description: 'Inter-department sportsfest covering basketball, volleyball, and athletics.',
  },
  {
    key: 'cleanup',
    name: 'Coastal Clean-Up Drive 2025',
    description: 'Finished community service project, kept archived for reference.',
  },
];
const PRIMARY_TASKS: DemoTask[] = [
  // Foundation Day 2026
  {
    project: 'foundation',
    title: 'Finalize program flow',
    description: 'Confirm the sequence of numbers and the transition cues per segment.',
    priority: 'high',
    status: 'in_progress',
    assignee: 'vp',
    dueInDays: 5,
  },
  {
    project: 'foundation',
    title: 'Book sound system and stage lights',
    description: 'Compare two suppliers and reserve the cheaper package with a deposit.',
    priority: 'high',
    status: 'todo',
    assignee: 'vp',
    dueInDays: 12,
  },
  {
    project: 'foundation',
    title: 'Print event tarpaulins',
    description: 'Two 4x8 tarpaulins for the gate and the stage backdrop.',
    priority: 'medium',
    status: 'review',
    assignee: 'secretary',
    dueInDays: 3,
  },
  {
    project: 'foundation',
    title: 'Secure barangay permits',
    description: 'Barangay clearance and traffic assistance for the parade route.',
    priority: 'high',
    status: 'done',
    assignee: 'president',
    dueInDays: -6,
  },
  {
    project: 'foundation',
    title: 'Design souvenir shirts',
    description: 'Pick the final artwork and collect sizes from each section.',
    priority: 'low',
    status: 'todo',
    assignee: 'member',
    dueInDays: 20,
  },
  {
    project: 'foundation',
    title: 'Recruit student volunteers',
    description: 'Target twenty volunteers, assigned in pairs per booth.',
    priority: 'medium',
    status: 'in_progress',
    assignee: 'member',
    dueInDays: 9,
  },
  {
    project: 'foundation',
    title: 'Consolidate sponsor pledges',
    description: 'Follow up on the pending pledges and issue acknowledgement letters.',
    priority: 'high',
    status: 'backlog',
    assignee: 'treasurer',
    dueInDays: 15,
  },
  {
    project: 'foundation',
    title: 'Draft emcee script',
    description: 'Opening, intermission, and closing spiels for the two hosts.',
    priority: 'low',
    status: 'backlog',
    assignee: null,
    dueInDays: null,
  },
  {
    project: 'foundation',
    title: 'Reserve the gymnasium',
    description: 'Booking form approved by the school administrator.',
    priority: 'medium',
    status: 'done',
    assignee: 'secretary',
    dueInDays: -10,
  },
  {
    project: 'foundation',
    title: 'Water station and first aid plan',
    description: 'One station per gate and the list of designated first-aid responders.',
    priority: 'medium',
    status: 'review',
    assignee: 'member',
    dueInDays: -2,
  },
  // Intramurals 2026
  {
    project: 'intramurals',
    title: 'Finalize game schedules',
    description: 'Bracket per sport, avoiding clashes with the foundation day program.',
    priority: 'high',
    status: 'in_progress',
    assignee: 'vp',
    dueInDays: 7,
  },
  {
    project: 'intramurals',
    title: 'Order medals and trophies',
    description: 'Three sets of medals plus the overall champion trophy.',
    priority: 'medium',
    status: 'todo',
    assignee: 'treasurer',
    dueInDays: 18,
  },
  {
    project: 'intramurals',
    title: 'Assign referees per sport',
    description: 'Two referees per game day, confirmed with the PE department.',
    priority: 'high',
    status: 'review',
    assignee: 'vp',
    dueInDays: -3,
  },
  {
    project: 'intramurals',
    title: 'Set up live score displays',
    description: 'Projector and scoreboard laptop for the covered court.',
    priority: 'low',
    status: 'backlog',
    assignee: 'member',
    dueInDays: null,
  },
  {
    project: 'intramurals',
    title: 'Publish team rosters',
    description: 'Post the lineups per department on the student council page.',
    priority: 'medium',
    status: 'done',
    assignee: 'secretary',
    dueInDays: -8,
  },
  // Coastal Clean-Up Drive 2025 (archived project)
  {
    project: 'cleanup',
    title: 'Coordinate transport to the site',
    description: 'Two jeepneys for forty participants, departure at 6:00 AM.',
    priority: 'medium',
    status: 'done',
    assignee: 'vp',
    dueInDays: -40,
  },
  {
    project: 'cleanup',
    title: 'Collect participant waivers',
    description: 'Signed waivers filed and submitted to the adviser.',
    priority: 'low',
    status: 'done',
    assignee: 'secretary',
    dueInDays: -45,
  },
];
const PRIMARY_PROPOSALS: DemoProposal[] = [
  {
    title: 'Foundation Day 2026 Budget',
    description: 'Program, lights and sound, tarpaulins, and contingency for the celebration.',
    project: 'foundation',
    dueInDays: 10,
    steps: ['submitted', 'under_review', 'approved', 'completed'],
    signatures: [
      { name: 'Dr. Elena Cruz', role: 'School Principal', complete: true },
      { name: 'Carlo Mendoza', role: 'Treasurer', complete: true },
      { name: 'Maria Santos', role: 'Council President', complete: true },
    ],
  },
  {
    title: 'Intramurals Equipment Request',
    description: 'New volleyball nets, two sets of jerseys, and replacement basketballs.',
    project: 'intramurals',
    dueInDays: 14,
    steps: ['submitted', 'under_review', 'approved'],
    signatures: [
      { name: 'Dr. Elena Cruz', role: 'School Principal', complete: true },
      { name: 'Mr. Ben Aquino', role: 'PE Department Head', complete: false },
    ],
  },
  {
    title: 'Student Wellness Week',
    description: 'Free counseling booths and a mental-health talk for all grade levels.',
    project: null,
    dueInDays: 25,
    steps: ['submitted', 'under_review'],
    signatures: [
      { name: 'Ms. Rita Gomez', role: 'Guidance Counselor', complete: false },
      { name: 'Maria Santos', role: 'Council President', complete: false },
    ],
  },
  {
    title: 'Varsity Training Camp Abroad',
    description: 'Proposed overseas training camp for the varsity basketball team.',
    project: 'intramurals',
    dueInDays: -5,
    steps: ['submitted', 'under_review', 'rejected'],
    signatures: [
      { name: 'Dr. Elena Cruz', role: 'School Principal', complete: false },
      { name: 'Carlo Mendoza', role: 'Treasurer', complete: false },
    ],
  },
  {
    title: 'Acoustic Night Fundraiser',
    description: 'Ticketed mini-concert to top up the scholarship fund.',
    project: 'foundation',
    dueInDays: 21,
    steps: ['submitted'],
    signatures: [{ name: 'Ana Reyes', role: 'Secretary', complete: false }],
  },
  {
    title: 'Library Extension Hours',
    description: 'Draft plan to keep the library open until 7 PM during finals week.',
    project: null,
    dueInDays: 30,
    steps: [],
    signatures: [],
  },
];

const PRIMARY_COMMITTEES: DemoCommittee[] = [
  {
    name: 'Logistics Committee',
    description: 'Venue, equipment, and on-the-day coordination.',
    head: 'vp',
    members: ['vp', 'member', 'secretary'],
  },
  {
    name: 'Finance Committee',
    description: 'Budget review, sponsorships, and liquidation reports.',
    head: 'treasurer',
    members: ['treasurer', 'president'],
  },
  {
    name: 'Creatives Committee',
    description: 'Tarpaulins, social posts, and event branding.',
    head: 'secretary',
    members: ['secretary', 'member'],
  },
];

// ─────────────────────────────────────────────────────────
// DEMO DATA — Ugnay Alumni Association (second org, for the switcher)
// ─────────────────────────────────────────────────────────

const SECONDARY_USERS: DemoUser[] = [
  {
    key: 'alumni-president',
    firstName: 'Ramon',
    lastName: 'Bautista',
    email: 'alumni.president@ugnay.test',
    position: 'President',
  },
  {
    key: 'alumni-vp',
    firstName: 'Grace',
    lastName: 'Lim',
    email: 'alumni.vp@ugnay.test',
    position: 'Vice President',
  },
  {
    key: 'alumni-secretary',
    firstName: 'Noel',
    lastName: 'Tan',
    email: 'alumni.secretary@ugnay.test',
    position: 'Secretary',
  },
];

const SECONDARY_TASKS: DemoTask[] = [
  {
    project: 'homecoming',
    title: 'Book the alumni venue',
    description: 'Reserve the covered court and confirm the caterer.',
    priority: 'high',
    status: 'in_progress',
    assignee: 'alumni-vp',
    dueInDays: 11,
  },
  {
    project: 'homecoming',
    title: 'Draft scholarship criteria',
    description: 'Eligibility, documentary requirements, and the screening panel.',
    priority: 'medium',
    status: 'review',
    assignee: 'alumni-secretary',
    dueInDays: -4,
  },
  {
    project: 'homecoming',
    title: 'Update alumni contact database',
    description: 'Reach 200 verified alumni records with batch and contact details.',
    priority: 'low',
    status: 'done',
    assignee: 'alumni-secretary',
    dueInDays: -12,
  },
];

const SECONDARY_PROPOSALS: DemoProposal[] = [
  {
    title: 'Scholarship Fund Allocation 2026',
    description: 'Allocation of the alumni fund across ten scholar slots.',
    project: 'homecoming',
    dueInDays: 16,
    steps: ['submitted', 'under_review'],
    signatures: [
      { name: 'Ramon Bautista', role: 'Alumni President', complete: true },
      { name: 'Atty. Sofia Uy', role: 'Board Trustee', complete: false },
    ],
  },
];

const SECONDARY_COMMITTEES: DemoCommittee[] = [
  {
    name: 'Homecoming Committee',
    description: 'Batch representatives, programme, and reunion logistics.',
    head: 'alumni-vp',
    members: ['alumni-vp', 'alumni-secretary'],
  },
];
// ─────────────────────────────────────────────────────────
// SEEDING
// ─────────────────────────────────────────────────────────

interface SeedSummary {
  organizationId: string;
  name: string;
}

function pick(values: Map<string, string>, key: string): string {
  const value = values.get(key);
  if (!value) throw new Error(`Missing seeded value for "${key}"`);
  return value;
}

async function seedMembers(
  organizationId: string,
  ownerMemberId: string,
  positionIds: Map<string, string>,
  users: DemoUser[],
  ownerKey: string,
): Promise<Map<string, string>> {
  const memberIds = new Map<string, string>([[ownerKey, ownerMemberId]]);

  for (const user of users) {
    if (user.key === ownerKey) continue;

    memberIds.set(
      user.key,
      await addMemberByEmail(organizationId, ownerMemberId, positionIds, user.email, user.position),
    );
  }

  return memberIds;
}

async function seedCommittees(
  organizationId: string,
  memberIds: Map<string, string>,
  committees: DemoCommittee[],
): Promise<void> {
  // There is no committee API yet, so the rows are written directly — the
  // tables exist and the relationships are real, just not exposed in the UI.
  for (const committee of committees) {
    const created = await prisma.committee.create({
      data: {
        organizationId,
        name: committee.name,
        description: committee.description,
      },
    });

    await prisma.committeeMember.createMany({
      data: committee.members.map((key) => ({
        committeeId: created.id,
        organizationMemberId: pick(memberIds, key),
        isHead: key === committee.head,
      })),
    });
  }
}
async function seedPrimaryOrganization(): Promise<SeedSummary | null> {
  const name = 'Ugnay Student Council';
  if (await findOrganizationId(name)) {
    console.log(`↷ Skipped "${name}" — already seeded.`);
    return null;
  }

  const userIds = new Map<string, string>();
  for (const user of PRIMARY_USERS) {
    userIds.set(user.key, await ensureUser(user));
  }

  const { organizationId, ownerMembershipId, positionIds } = await createOrganization(
    name,
    'Official student council of Ugnay National High School: programs, projects, and proposals.',
    pick(userIds, 'president'),
  );

  const memberIds = await seedMembers(
    organizationId,
    ownerMembershipId,
    positionIds,
    PRIMARY_USERS,
    'president',
  );

  const projectIds = new Map<ProjectKey, string>();
  for (const project of PRIMARY_PROJECTS) {
    const { project: created } = await projectService.create(
      organizationId,
      { name: project.name, description: project.description },
      { organizationMemberId: ownerMembershipId },
    );
    projectIds.set(project.key, created.id);
  }

  for (const task of PRIMARY_TASKS) {
    await createTask(
      organizationId,
      ownerMembershipId,
      pick(projectIds, task.project),
      task,
      memberIds,
    );
  }

  // The clean-up drive is finished — archive it so the UI shows that state.
  await projectService.archive(organizationId, pick(projectIds, 'cleanup'), {
    organizationMemberId: ownerMembershipId,
  });

  const actor = await actorFor(pick(userIds, 'president'), organizationId);
  for (const proposal of PRIMARY_PROPOSALS) {
    await createProposal(organizationId, actor, proposal, projectIds);
  }

  await seedCommittees(organizationId, memberIds, PRIMARY_COMMITTEES);

  return { organizationId, name };
}

async function seedSecondaryOrganization(): Promise<SeedSummary | null> {
  const name = 'Ugnay Alumni Association';
  if (await findOrganizationId(name)) {
    console.log(`↷ Skipped "${name}" — already seeded.`);
    return null;
  }

  const userIds = new Map<string, string>();
  for (const user of SECONDARY_USERS) {
    userIds.set(user.key, await ensureUser(user));
  }

  const { organizationId, ownerMembershipId, positionIds } = await createOrganization(
    name,
    'Alumni relations, homecoming planning, and scholarship fundraising.',
    pick(userIds, 'alumni-president'),
  );

  const memberIds = await seedMembers(
    organizationId,
    ownerMembershipId,
    positionIds,
    SECONDARY_USERS,
    'alumni-president',
  );

  const { project } = await projectService.create(
    organizationId,
    {
      name: 'Alumni Homecoming 2026',
      description: 'Homecoming programme, batch reunions, and the scholarship fund drive.',
    },
    { organizationMemberId: ownerMembershipId },
  );

  const projectIds = new Map<ProjectKey, string>([['homecoming', project.id]]);

  for (const task of SECONDARY_TASKS) {
    await createTask(
      organizationId,
      ownerMembershipId,
      pick(projectIds, task.project),
      task,
      memberIds,
    );
  }

  const actor = await actorFor(pick(userIds, 'alumni-president'), organizationId);
  for (const proposal of SECONDARY_PROPOSALS) {
    await createProposal(organizationId, actor, proposal, projectIds);
  }

  await seedCommittees(organizationId, memberIds, SECONDARY_COMMITTEES);

  return { organizationId, name };
}
async function reportSummary(summary: SeedSummary): Promise<void> {
  const [members, projects, tasks, proposals, activity] = await Promise.all([
    prisma.organizationMember.count({ where: { organizationId: summary.organizationId } }),
    prisma.project.count({ where: { organizationId: summary.organizationId } }),
    prisma.task.count({ where: { project: { organizationId: summary.organizationId } } }),
    prisma.proposal.count({ where: { organizationId: summary.organizationId } }),
    prisma.activityLog.count({ where: { organizationId: summary.organizationId } }),
  ]);

  console.log(
    `   ${summary.name}: ${members} members · ${projects} projects · ${tasks} tasks · ` +
      `${proposals} proposals · ${activity} activity entries`,
  );
}

async function main(): Promise<void> {
  const results = [await seedPrimaryOrganization(), await seedSecondaryOrganization()];
  const seeded = results.filter((summary): summary is SeedSummary => summary !== null);

  if (seeded.length === 0) {
    console.log('\nNothing to do — the demo organizations are already in the database.');
    return;
  }

  console.log('\n✔ Demo data ready.');
  console.log(`\n   Password for every demo account: ${DEMO_PASSWORD}`);
  for (const user of PRIMARY_USERS) {
    console.log(`   ${user.position.padEnd(16)} ${user.email}`);
  }
  for (const user of SECONDARY_USERS) {
    console.log(`   ${`Alumni · ${user.position}`.padEnd(16)} ${user.email}`);
  }

  console.log('');
  for (const summary of seeded) {
    await reportSummary(summary);
  }
}

main()
  .catch((error: unknown) => {
    console.error('\n✖ Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });









