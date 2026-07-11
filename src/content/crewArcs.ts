export const CREW_ARC_TRIGGER_SOURCES = [
  'mission',
  'carrier',
  'boarding',
  'faction',
  'rival',
  'injury',
  'module',
  'command',
  'rescue'
] as const;
export type CrewArcTriggerSource = (typeof CREW_ARC_TRIGGER_SOURCES)[number];

export const CREW_ARC_OUTCOMES = [
  'bond',
  'conflict',
  'promotion',
  'pairedAbility',
  'loyalty',
  'rescue',
  'departure',
  'mutiny',
  'commandSuccession',
  'specialistPost'
] as const;
export type CrewArcOutcome = (typeof CREW_ARC_OUTCOMES)[number];

export interface CrewArcOptionDefinition {
  readonly id: string;
  readonly label: string;
  readonly summary: string;
  readonly outcome: CrewArcOutcome;
  readonly relationshipDelta: number;
  readonly trustDelta: number;
  readonly risk: string;
}

export interface CrewArcDefinition {
  readonly id: string;
  readonly title: string;
  readonly theme: 'bond' | 'conflict' | 'fear' | 'ambition' | 'loyalty' | 'succession';
  readonly summary: string;
  readonly triggerSequence: readonly [
    CrewArcTriggerSource,
    CrewArcTriggerSource,
    CrewArcTriggerSource
  ];
  readonly options: readonly [CrewArcOptionDefinition, CrewArcOptionDefinition];
  readonly pairedAbilityLabel: string;
}

export const CREW_ARCS: readonly CrewArcDefinition[] = [
  arc(
    'crew_arc_debt_of_air',
    'Debt of Air',
    'bond',
    'A rescue debt becomes either mutual trust or a dangerous obligation.',
    ['rescue', 'mission', 'command'],
    option(
      'share',
      'Share The Debt',
      'Treat survival as mutual responsibility.',
      'bond',
      2,
      1,
      'Tighter formation reduces individual room to evade.'
    ),
    option(
      'collect',
      'Collect The Debt',
      'Turn gratitude into a formal command claim.',
      'conflict',
      -2,
      0,
      'Obedience now may become refusal later.'
    ),
    'Reciprocal Screen'
  ),
  arc(
    'crew_arc_split_claim',
    'The Split Claim',
    'conflict',
    'Two salvagers disagree over custody, law, and who carried whom.',
    ['boarding', 'faction', 'mission'],
    option(
      'mediate',
      'Divide The Claim',
      'Recognize both claims and bind the pair to arbitration.',
      'bond',
      1,
      1,
      'The divided reward has no immediate payout.'
    ),
    option(
      'back',
      'Back One Claim',
      'Choose a winner and let the grievance harden.',
      'conflict',
      -3,
      1,
      'The losing partner may refuse paired deployment.'
    ),
    'Claimant Crossfire'
  ),
  arc(
    'crew_arc_open_lock',
    'The Open Lock',
    'fear',
    'A sealed compartment reawakens a specialist fear of confinement.',
    ['boarding', 'injury', 'mission'],
    option(
      'face',
      'Return To The Lock',
      'Let the crew member lead the next breach.',
      'promotion',
      1,
      1,
      'Promotion consumes more command headroom.'
    ),
    option(
      'route',
      'Honor The Fear',
      'Keep them out of sealed operations and preserve trust.',
      'loyalty',
      1,
      2,
      'Boarding options lose their specialist edge.'
    ),
    'Pressure Breach Pair'
  ),
  arc(
    'crew_arc_last_light',
    'Last Light Ambition',
    'ambition',
    'A pilot wants authority, a larger call sign, and the risk that follows.',
    ['command', 'mission', 'rival'],
    option(
      'promote',
      'Grant Field Rank',
      'Give them tactical authority under fire.',
      'promotion',
      1,
      1,
      'Veteran systems cost one additional command.'
    ),
    option(
      'deny',
      'Keep The Chain Flat',
      'Refuse rank but preserve the current command budget.',
      'departure',
      -1,
      -2,
      'Ambition may leave at the next safe port.'
    ),
    'Officer Vector'
  ),
  arc(
    'crew_arc_quiet_vote',
    'The Quiet Vote',
    'loyalty',
    'Carrier pressure turns private doubt into a vote on command.',
    ['carrier', 'mission', 'faction'],
    option(
      'listen',
      'Open The Council',
      'Let the crew challenge the captain without punishment.',
      'loyalty',
      1,
      2,
      'Council debate can delay a clean tactical answer.'
    ),
    option(
      'break',
      'Break The Vote',
      'Demand obedience and accept the possibility of mutiny.',
      'mutiny',
      -3,
      -2,
      'The dissenter may leave with operational knowledge.'
    ),
    'Council Relay'
  ),
  arc(
    'crew_arc_blackbox_name',
    'A Name In The Blackbox',
    'bond',
    'A recovered voice belongs to someone the crew thought lost.',
    ['boarding', 'rescue', 'carrier'],
    option(
      'recover',
      'Mount A Rescue',
      'Commit the carrier to recovering the survivor.',
      'rescue',
      2,
      1,
      'Rescue obligations constrain the next staging window.'
    ),
    option(
      'seal',
      'Seal The Record',
      'Protect the living crew from a dangerous search.',
      'conflict',
      -1,
      1,
      'The unanswered name remains between the pair.'
    ),
    'Blackbox Beacon'
  ),
  arc(
    'crew_arc_second_chair',
    'Second Chair',
    'succession',
    'A capable specialist must be named as command successor.',
    ['mission', 'command', 'carrier'],
    option(
      'name',
      'Name The Successor',
      'Establish command continuity and accept a rival center of authority.',
      'commandSuccession',
      2,
      1,
      'The successor uses an extra command channel.'
    ),
    option(
      'defer',
      'Defer Succession',
      'Keep authority singular through the current crisis.',
      'conflict',
      -2,
      0,
      'A later incapacitation has no prepared replacement.'
    ),
    'Succession Link'
  ),
  arc(
    'crew_arc_cold_solder_oath',
    'Cold-Solder Oath',
    'loyalty',
    'Foundry work reveals whether the engineer serves the ship or the people aboard it.',
    ['module', 'injury', 'carrier'],
    option(
      'people',
      'People Before Systems',
      'Bind engineering authority to crew survival.',
      'specialistPost',
      1,
      2,
      'Repairs favor recovery over output.'
    ),
    option(
      'ship',
      'Ship Before People',
      'Demand maximum output whatever it costs the crew.',
      'promotion',
      -1,
      1,
      'Output rank consumes command capacity and worsens conflict.'
    ),
    'Field Repair Weave'
  ),
  arc(
    'crew_arc_border_defector',
    'Border Defector',
    'fear',
    'A moving faction front marks one crew member as traitor or envoy.',
    ['faction', 'rival', 'mission'],
    option(
      'envoy',
      'Stand As Envoy',
      'Use the relationship to open a dangerous dialogue.',
      'pairedAbility',
      2,
      1,
      'The pair must fly close enough to share targeting.'
    ),
    option(
      'cut',
      'Cut The Old Allegiance',
      'Burn the tie and remove the faction leverage.',
      'loyalty',
      -1,
      2,
      'Future front aid loses a personal channel.'
    ),
    'Defector Tandem'
  ),
  arc(
    'crew_arc_red_wake',
    'Red Wake Testimony',
    'ambition',
    'A rival encounter gives the crew a story that can become doctrine or revenge.',
    ['rival', 'injury', 'command'],
    option(
      'teach',
      'Turn Scars Into Doctrine',
      'Promote the survivor and teach the maneuver.',
      'pairedAbility',
      1,
      1,
      'Doctrine demands a tighter, more fragile formation.'
    ),
    option(
      'hunt',
      'Promise Revenge',
      'Feed the grievance and accept a possible break in command.',
      'mutiny',
      -2,
      -1,
      'The crew member may pursue the rival against orders.'
    ),
    'Red Wake Crossfire'
  )
];

function arc(
  id: string,
  title: string,
  theme: CrewArcDefinition['theme'],
  summary: string,
  triggerSequence: CrewArcDefinition['triggerSequence'],
  first: CrewArcOptionDefinition,
  second: CrewArcOptionDefinition,
  pairedAbilityLabel: string
): CrewArcDefinition {
  return {
    id,
    title,
    theme,
    summary,
    triggerSequence,
    options: [first, second],
    pairedAbilityLabel
  };
}

function option(
  suffix: string,
  label: string,
  summary: string,
  outcome: CrewArcOutcome,
  relationshipDelta: number,
  trustDelta: number,
  risk: string
): CrewArcOptionDefinition {
  return { id: suffix, label, summary, outcome, relationshipDelta, trustDelta, risk };
}
