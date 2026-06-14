/*
 * Camp Guppy — A Murder Mystery
 * Character data. Each player unlocks their page with a secret codeword.
 *
 * NOTE: Because this is a static site, codewords are checked in the browser.
 * It keeps honest friends honest, but anyone determined could read this file.
 * Don't share the repo/source with your players before the party!
 */

const GAME = {
  title: "Camp Guppy",
  subtitle: "A Murder Mystery",
  setting:
    "The final night of camp. The kids are gone, the counselors are partying in the main cabin, and a thunderstorm is rolling in over the lake.",
};

const CHARACTERS = [
  /* ------------------------------------------------------------------ */
  {
    id: "archery",
    name: "Archery Counselor",
    code: "BULLSEYE",
    emoji: "🏹",
    role: "player",
    tagline: "Head counselor. Safety first. The one everyone trusts.",
    note:
      "You kick off the game and you are the victim. Play Act I fully — you'll return at the very end as a ghost.",
    personality: [
      "Head Counselor — you run a tight, caring ship.",
      "No nonsense. Safety first, always.",
      "You genuinely love the campers and the camp.",
      "You are a REAL camper at heart.",
    ],
    secrets: [
      "You saw the Camp Director strike a camper in the face.",
      "You're staying cool about it — you plan to tell the Wealthy Land Owner AFTER the party.",
      "You're slated to take the Camp Director's job.",
      "You buy from the Cook (quietly).",
    ],
    relationships: [
      "Camp Director — you have dirt on them and they know their time is up.",
      "Lifeguard — keeps making advances; you keep rejecting them.",
      "Counselor in Training — you told them there are no counselor openings next year.",
    ],
    objectives: {
      Intro: ["Set the tone as the trusted, caring head counselor everyone looks up to."],
      "Act I": [
        "Plant a seed with one or two people that the Camp Director isn't who they pretend to be.",
        "Make the Lifeguard wonder where they stand with you (without ever saying yes).",
      ],
    },
    acts: {
      Intro: [
        "Gather everyone. Congratulate the group on another successful year.",
        "Hand out 'assignments for next year' (everyone's character cards).",
        "Announce that everyone has 5 minutes to learn their assignment before the party begins.",
      ],
      "Act I": [
        "Have a tense, serious conversation with the Camp Director early on.",
        "When the power cuts out and it's pitch black, slip outside to the emergency phone at the camp entrance and dial 911.",
        "The Counselor in Training follows you to 'gain experience' but gets lost in the storm.",
        "⚠️ During the blackout you are murdered near the emergency phone. After this, you are 'dead' — step back and observe quietly.",
      ],
      Finale: [
        "The Useless Detective is secretly a medium.",
        "You return as a GHOST to be summoned and spill what really happened.",
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  {
    id: "director",
    name: "Camp Director",
    code: "KUMBAYA",
    emoji: "🏕️",
    role: "player",
    tagline: "Caring. Holier-than-thou. A little delulu.",
    note: "You're cornered tonight — years of dark secrets are catching up with you. Keep your cool; your story unfolds as the night moves on.",
    personality: [
      "'Caring' and full of kumbaya energy.",
      "Holier-than-thou and a little delusional.",
      "Never did drugs… except a little K, that one time.",
    ],
    secrets: [
      "You struck a camper in the face — and the Archery Counselor saw you.",
      "Years of skeletons in the closet: physically abusing campers.",
      "A parent left a voicemail threatening legal action.",
      "The Archery Counselor is about to take your job. You're at a dead end and about to be labeled an abuser.",
    ],
    relationships: [
      "Archery Counselor — knows about the camper you struck; about to replace you.",
      "Wealthy Land Owner — you accidentally let slip that a marijuana garden was found on camp grounds.",
      "Counselor in Training — an overeager newbie, easy to push around.",
      "Maintenance — a sloppy drunk who's always misplacing their tools.",
    ],
    objectives: {
      "Act I": [
        "Have your tense moment with the Archery Counselor early — keep it cryptic.",
        "Keep your reason for slipping out to yourself; have a cover ready if asked.",
      ],
      "Act II": [
        "Take charge of the scene so no one looks too closely at you.",
        "Make at least two people doubt Maintenance — careless, sloppy, not to be trusted.",
      ],
      "Act III": [
        "Keep suspicion off you as long as you can — deflect, redirect, and survive.",
      ],
    },
    acts: {
      "Act I": [
        "Have a tense, serious conversation with the Archery Counselor.",
        "When the lights cut out, go to your car to listen to a voicemail from a parent (it's a legal threat).",
        "Cry in the car, then walk down by the lake to be in your feelings.",
        "Feel something at your feet in the woods — it's a muddy hammer stamped 'Property of Camp Guppy' (Maintenance lost it).",
        "Spot the Archery Counselor near the emergency phone, with the Counselor in Training frazzled nearby.",
        "🔪 This is your chance: hammer → temple → dead. Dispose of the body in the mud across the way.",
        "Slip the hammer into the Counselor in Training's backpack.",
        "Walk back into the party right after Maintenance, Alumnus, and Lifeguard, as the lights come on.",
      ],
      "Act II": [
        "Say you found the Counselor in Training wandering alone in the storm.",
        "When the body is found, take charge: 'Everyone remain calm. We need to stick together — there could be a murderer among us!'",
        "Once a hammer is suspected: push hard — 'We need to find that hammer!'",
      ],
      "Act III": [
        "Try to coax a 'confession' out of Maintenance — tell them 'it's ok.'",
        "Join Maintenance when they leave to drink, to 'calm them down.'",
        "⚠️ The group will turn on you, detain you, and tie you up in another room.",
        "While restrained, the Useless Detective will privately tell you exactly how you killed the Archery Counselor.",
        "💀 You're handed a drink that was secretly spiked while everyone gossiped — you take it into the room, choke, and die. Play it out.",
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  {
    id: "cit",
    name: "Counselor in Training",
    code: "BACKPACK",
    emoji: "🎒",
    role: "player",
    tagline: "Eager teenage newbie who'll do anything to get ahead.",
    note: "Something doesn't add up tonight, and the blame keeps drifting your way. You know you did nothing wrong — prove it as the night moves on.",
    personality: [
      "A teenager and a total newbie to the place.",
      "Motivated, chipper, and desperate to impress.",
      "Always wear a small backpack — ready for any situation!",
      "Will do anything to get ahead.",
    ],
    secrets: [
      "Archery Counselor told you there's no room to be a full counselor next year — every slot is taken.",
      "You learn 'what counselors do' purely from common sense.",
      "Something incriminating ends up tucked in YOUR backpack. You have no idea how it got there.",
    ],
    relationships: [
      "Archery Counselor — your idol; told you there's no job for you next year.",
      "Camp Director — 'rescued' you in the storm (really, they were framing you).",
      "Nurse — comes to believe you're innocent and helps you.",
    ],
    objectives: {
      "Act I": ["Shadow the Archery Counselor to 'learn the ropes.'"],
      "Act II": ["Ask one or two people if there's any real way to become a counselor next year."],
      "Act III": [
        "Get at least two people to say out loud that they believe you didn't do it.",
        "Work out who could have reached your backpack in the dark.",
      ],
    },
    acts: {
      "Act I": [
        "When the Archery Counselor slips out during the blackout, follow them to 'gain experience.'",
        "Get lost almost immediately in the thunderstorm.",
        "Yell for help. The Camp Director 'finds' you and walks you back.",
      ],
      "Act II": [
        "When the body is found, cry.",
        "Get accidentally hurt while Survival Skills shows off their 'tracking.'",
        "Later, get water from your backpack — and spot the hammer hidden inside. (The Nurse sees it too and shrieks.)",
      ],
      "Act III": [
        "Get questioned about the hammer. Insist you're innocent — you don't know how it got there.",
        "Mention (again) that the Camp Director found you while you were following the Archery Counselor.",
        "Talk it through with the Nurse; together connect the clues that point at the Camp Director.",
        "Help spread the rumor that the Camp Director did it.",
        "At the very end, you'll be the one who finds the body — with a rope around the neck.",
      ],
      Accusation: [
        "Stand up for yourself one last time: you didn't kill anyone.",
        "Point the group squarely at the Camp Director, who 'found' you in the storm.",
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  {
    id: "maintenance",
    name: "Maintenance",
    code: "TOOLBELT",
    emoji: "🔧",
    role: "player",
    tagline: "Grizzly, aloof, and a bit of an alcoholic.",
    note: "Your tools have a way of going missing when you drink — and tonight that could make you look very guilty. Keep your wits about you.",
    personality: [
      "A lil grizzly, a lil aloof. About 30.",
      "Pure 'Mutt from Schitt's Creek' energy.",
      "Will take any win.",
      "A bit of an alcoholic — which makes you sloppy.",
      "Always have metal tools on your person.",
    ],
    secrets: [
      "Your hammer ('Property of Camp Guppy') went missing tonight — you lost it, drunk, and don't even know it yet.",
      "You'd rather no one find out about the drinking.",
    ],
    relationships: [
      "Camp Director — will press you for a 'confession.'",
      "Wealthy Land Owner — will try to pay you to make it all disappear.",
    ],
    objectives: {
      "Act I": ["Keep your drinking to yourself."],
      "Act II": [
        "Deflect anyone who asks why your tool belt looks light.",
        "Don't become suspect number one — nudge attention toward someone else.",
      ],
      "Act III": ["Find out who could have taken your hammer in the dark."],
    },
    acts: {
      "Act I": [
        "When the lights die, head out to the electrical building 'to fix them.'",
        "Notice tools missing from your belt — the hammer's gone. Blame the booze.",
      ],
      "Act II": [
        "Claim you fixed the lights (really, they came back on by themselves).",
        "When a hammer comes up, don't admit you lost it and don't reveal the drinking.",
        "Forced to concede there's no hammer on your belt: 'It must have been stolen!'",
        "Get basically interrogated by everyone.",
      ],
      "Act III": [
        "Under pressure, admit you're an alcoholic and the hammer was misplaced/lost.",
        "You feel like you're being framed.",
        "Storm off to drink. The Camp Director follows to 'calm you down,' and the gang trails along.",
      ],
      Accusation: [
        "Insist you were framed — someone stole your hammer to set you up.",
        "Name the Camp Director as the real killer.",
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  {
    id: "lifeguard",
    name: "Lifeguard",
    code: "WHISTLE",
    emoji: "🛟",
    role: "player",
    tagline: "Super dumb. Super hot.",
    note: "Secretly in love with the Archery Counselor.",
    personality: ["Super dumb.", "Super hot.", "Wears feelings poorly."],
    secrets: [
      "You're secretly in love with the Archery Counselor — never made it known.",
      "You flirt with the Alumnus mainly to make the Archery Counselor jealous.",
      "From the car during the blackout, you half-saw a figure cross toward the lake and woods — away from the party. You couldn't tell who it was.",
    ],
    relationships: [
      "Archery Counselor — your secret love; keeps rejecting you.",
      "Alumnus — your blackout make-out alibi.",
    ],
    objectives: {
      "Act I": [
        "Make a point of being seen slipping off with the Alumnus.",
        "Fish for any hint the Archery Counselor ever felt anything for you.",
      ],
      "Act II": [
        "You saw a figure head toward the lake in the dark — decide who you trust enough to tell.",
        "Keep the car make-out quiet unless you need it as an alibi.",
      ],
      "Act III": [
        "Use what you saw: whoever was out by the lake is your prime suspect.",
        "Steer suspicion away from the Alumnus once things heat up.",
      ],
    },
    acts: {
      "Act I": [
        "When it goes dark, sneak off with the Alumnus to make out in a car.",
        "Make a point of being seen leaving together — you want the Archery Counselor to notice.",
        "Through the rain-streaked window, glimpse a figure crossing toward the lake and woods. You can't tell who — but they were NOT heading back to the party.",
      ],
      "Act II": [
        "Go along with whatever cover story the Alumnus invents.",
        "At the body, stand motionless and distraught — but hide how much it guts you.",
        "Be the one who shows the body to the Useless Detective (the Wealthy Land Owner won't like it).",
        "Let slip that you saw 'someone' moving toward the lake during the blackout — watch who gets nervous.",
      ],
      "Act III": [
        "Hint that you were with the Alumnus — feel dirty talking about it with the Archery Counselor's body outside.",
        "Press your point: whoever was out by the lake had no business being there. Help the group narrow it down.",
        "Burn for revenge once the trail points at the Camp Director.",
      ],
      Accusation: [
        "Tie it together publicly: you saw someone cross to the lake, and the Camp Director can't explain where they were.",
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  {
    id: "alumnus",
    name: "Alumnus",
    code: "GLORYDAYS",
    emoji: "⚽",
    role: "player",
    tagline: "Lives in the glory days. Thinks they're still a counselor.",
    note: "Your child was wronged at this camp, and you're simmering with quiet anger. Your story deepens as the night moves on.",
    personality: [
      "Won't stop talking about the glory days back when you were a camper.",
      "Genuinely believes you're part of the current counselor squad.",
      "Have a 10-year-old child at the camp.",
    ],
    secrets: [
      "Your child was repeatedly beaten by the Camp Director.",
    ],
    relationships: [
      "Lifeguard — your low-key flirtation and blackout alibi.",
      "Camp Director — beat your child. You'll never forgive them.",
      "Nurse — always gloved, with a first aid kit full of meds.",
    ],
    objectives: {
      "Act I": ["Slip away with the Lifeguard — and make sure you're seen doing it."],
      "Act II": ["Let your anger at the Camp Director start to boil over in public."],
      "Act III": [
        "Quietly confirm with the Nurse that the Camp Director is the one who hurt your child.",
        "Get the group fixated on punishing the Camp Director.",
        "When the moment comes, make sure no one sees you near the Camp Director's drink.",
      ],
    },
    acts: {
      "Act I": ["When the lights cut out, slip away with the Lifeguard to make out in a car."],
      "Act II": [
        "Make up a cover story for the blackout (Lifeguard backs you).",
        "Explode at the Camp Director: 'This camp has gone to utter shit since I was a camper!'",
      ],
      "Act III": [
        "Hint that you were with the Lifeguard.",
        "🔪 While everyone is gossiping and plotting against the restrained Camp Director, slip the Nurse's stolen meds into the Camp Director's drink.",
        "The Camp Director takes that drink into the room and dies — your revenge for your beaten child.",
      ],
      Accusation: [
        "Rage at the Camp Director publicly — but be careful not to reveal you already took your revenge.",
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  {
    id: "cook",
    name: "Cook",
    code: "CAMPFIRE",
    emoji: "🍳",
    role: "player",
    tagline: "Stoner. Everyone's chill with him.",
    note: "You run a secret weed operation with the Wealthy Land Owner.",
    personality: ["Resident stoner.", "Everyone is chill with you.", "Unbothered, mostly."],
    secrets: [
      "You deal to the counselors — Survival Skills, Archery Counselor, Lifeguard, and more.",
      "You run a marijuana operation on camp grounds with the Wealthy Land Owner.",
    ],
    relationships: [
      "Wealthy Land Owner — your boss in the operation; will blackmail you.",
      "Nurse — has a crush on you (doesn't know you're a stoner).",
    ],
    objectives: {
      "Act I": ["Talk shop with the Wealthy Land Owner in the dark — and watch who's listening."],
      "Act II": ["Redirect anyone who brings up 'abuse' or 'the operation.'"],
      "Act III": [
        "Find out how much the Nurse actually overheard.",
        "Stay on the Wealthy Land Owner's good side — your safety depends on it.",
      ],
    },
    acts: {
      "Act I": [
        "During the blackout, talk with the Wealthy Land Owner about your operation.",
        "(You don't know the Nurse is secretly listening in.)",
      ],
      "Act II": [
        "Make up a cover story for where you were.",
        "At the body, shakily light up a joint.",
        "When 'abuse' comes up, assume they mean substance abuse.",
      ],
      "Act III": [
        "Add to Survival Skills' ridiculous story — anything to pull attention off the operation.",
        "⚠️ The Wealthy Land Owner blackmails you to kill the Camp Director (or you take the fall for the whole drug operation).",
        "With the Nurse, find the Camp Director's body and loop a rope around the neck post-mortem to frame him.",
        "The Wealthy Land Owner verifies your work.",
      ],
      Accusation: [
        "Play it cool and point at the Camp Director — the more the room agrees, the less anyone wonders where YOU were.",
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  {
    id: "nurse",
    name: "Nurse",
    code: "BANDAGE",
    emoji: "🩹",
    role: "player",
    tagline: "Germaphobe. Always gloved. Always anxious.",
    note: "You carry drugs — and you notice everything.",
    personality: [
      "Germaphobe — always, always wearing gloves.",
      "Deeply anxious.",
      "Carry a first aid kit… with drugs in it.",
    ],
    secrets: [
      "You have a crush on the Cook (you don't know he's a stoner).",
      "You bandage campers a lot — camping scrapes, fights, or… something worse.",
      "Your gloves mean you never leave fingerprints.",
    ],
    relationships: [
      "Cook — your crush; you'd do anything for him.",
      "Counselor in Training — you come to believe they're innocent.",
      "Camp Director — you suspect they're the violent one hurting kids.",
    ],
    objectives: {
      "Act I": ["Trail the Cook in the dark — you've got a crush to act on."],
      "Act II": ["Start quietly working out who's been hurting the campers."],
      "Act III": [
        "Get closer to the Cook.",
        "Recruit at least one ally who believes the Counselor in Training is innocent.",
      ],
    },
    acts: {
      "Act I": [
        "During the blackout, secretly follow the Cook to make a move on him.",
        "Instead, you overhear the drug operation.",
      ],
      "Act II": [
        "Make up a cover story for the blackout.",
        "At the body, run away — dropping your first aid kit. You have a suspicion brewing…",
        "When the hammer appears in the Counselor in Training's backpack, you see it and shriek.",
      ],
      "Act III": [
        "Talk to the Counselor in Training; you believe they didn't do it.",
        "Reveal what you know: kids have been beaten — someone violent and dangerous is at this camp.",
        "Connect the clues with the Counselor in Training to point at the Camp Director.",
        "⚠️ Your stolen meds are what the Alumnus slips into the Camp Director's drink during the gossip. Afterward, with the Cook, find the body and stage a rope around the neck to frame the Camp Director.",
      ],
      Accusation: [
        "Lay out your evidence calmly: kids were beaten, and the clues all point at the Camp Director.",
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  {
    id: "survival",
    name: "Survival Skills",
    code: "COMPASS",
    emoji: "🧭",
    role: "player",
    tagline: "All boast, no skill. A camp Gilderoy Lockhart.",
    note: "Comic relief who keeps hurting people by accident.",
    personality: [
      "Pure Gilderoy Lockhart: brag endlessly about your skills and nature knowledge…",
      "…while actually knowing and doing nothing.",
      "Accidentally injure people whenever you try to strut your stuff.",
    ],
    secrets: [
      "You buy from the Cook.",
      "You couldn't track a muddy elephant across a white carpet.",
      "During the blackout you were out by the treeline near the lake — the same direction the real killer went. You have NO useful info, but you were definitely seen out there.",
    ],
    relationships: [
      "Cook — your dealer.",
      "Counselor in Training — keeps getting hurt by your 'demonstrations.'",
    ],
    objectives: {
      "Act I": ["Do something absurd 'for everyone's safety' during the storm."],
      "Act II": [
        "Convince at least two people you heroically kept everyone safe.",
        "Insert yourself into the investigation at every opportunity (badly).",
      ],
      "Act III": [
        "Never let anyone learn you buy from the Cook.",
        "Brag about your 'lakeside vigil' under the tree — without realizing it puts YOU near where the killer went.",
      ],
    },
    acts: {
      "Act I": ["When it storms, go stand under a tree by the lake in the lightning — 'the safest place to be!' (This is the same direction the real killer went — pure coincidence.)"],
      "Act II": [
        "Claim you were keeping everyone safe and hoped they'd join you.",
        "Show off your 'tracking' at the body — your deductions make zero sense and hurt the Counselor in Training.",
        "Insist you'd never use a hammer: you'd use a far more sophisticated method, like hunting a wild chupacabra. (Let the gang question this.)",
      ],
      "Act III": [
        "Spin an absurd, unbelievable tale that you tried to save everyone from the storm.",
        "Brag that you held a 'vigil' under the tree by the lake — accidentally making yourself a suspect when the Lifeguard mentions seeing someone head that way.",
        "Offer to build traps to incapacitate the Camp Director — and provide the rope from your tent.",
      ],
      Accusation: [
        "Deliver a wildly overconfident 'expert reconstruction' of the crime — wrong on every detail, but somehow it still lands on the Camp Director.",
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  {
    id: "landowner",
    name: "Wealthy Land Owner",
    code: "OLDMONEY",
    emoji: "💰",
    role: "player",
    tagline: "Old money. Quietly terrifying.",
    note: "You'll do anything to keep the camp out of the headlines.",
    personality: [
      "Old money — your family stole this camp land from the natives generations ago.",
      "Everyone is a little intimidated by you.",
      "You see the Camp Director and Archery Counselor as your points of contact for camp matters.",
    ],
    secrets: [
      "You run a marijuana operation on the grounds with the Cook.",
      "You've heard the Archery Counselor is the head counselor.",
      "Above all: no scandal can touch this camp.",
    ],
    relationships: [
      "Cook — your partner in the operation; expendable if needed.",
      "Camp Director — let slip to you that a marijuana garden was found on the grounds.",
    ],
    objectives: {
      Intro: ["Make your entrance land — you're the intimidating one everyone answers to."],
      "Act II": ["Push to keep any scandal far away from the camp's name."],
      "Act III": [
        "Find out who knows about the marijuana garden, and contain it.",
        "Keep the Cook loyal and frightened.",
      ],
    },
    acts: {
      Intro: [
        "After the announcement and reading your card, LEAVE the room until in-game chatter has gone on a few minutes.",
        "You've heard the Camp Director had an errand to run — so ask around for the Archery Counselor to be properly introduced.",
      ],
      "Act I": ["During the blackout, talk with the Cook about your operation."],
      "Act II": [
        "Make up a cover story for the blackout.",
        "Push to keep everything on the DL: offer to pay for a funeral so everyone can move on — you want zero attention on this camp.",
        "When 'abuse' comes up, assume they mean abuse of power.",
      ],
      "Act III": [
        "Try to pay Maintenance to make the whole thing disappear.",
        "Blackmail the Cook into killing the Camp Director — frame him for the drug operation, or worse, if he refuses.",
        "After the Camp Director dies, verify the Cook and Nurse's staged rope-framing.",
      ],
      Accusation: [
        "Push for a tidy, quiet conclusion: the Camp Director did it, case closed, no headlines.",
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  {
    id: "detective",
    name: "Useless Detective (HOST)",
    code: "MEDIUM",
    emoji: "🔮",
    role: "host",
    tagline: "You run the game. And you're secretly a medium.",
    note: "This is the HOST master guide — the full solution to the mystery.",
    personality: [
      "Bumbling, inconclusive, gloriously useless as a detective.",
      "Arrive in Act II saying you 'got a call about something.'",
      "Secret truth: you are a MEDIUM who can summon the dead.",
    ],
    secrets: [],
    relationships: [],
    runOfShow: [
      {
        block: "Pre-game / Mingle",
        time: "15 min",
        notes: [
          "Food, drinks, music. Let people arrive and settle.",
          "Hand out cards face-down; players scan the QR or enter their codeword and read their sheet.",
          "Encourage in-character small talk before you formally begin.",
        ],
      },
      {
        block: "Intro",
        time: "5 min",
        notes: [
          "As the Archery Counselor, gather everyone and 'announce next year's assignments.'",
          "Give players ~5 minutes to absorb their character, secrets, and objectives.",
        ],
      },
      {
        block: "Act I — The Blackout",
        time: "15–20 min",
        notes: [
          "Cut the lights (simulate the blackout). Walk the room through where each person went.",
          "Keep it loose — let people role-play their blackout activity and start chasing their objectives.",
          "End the act with the lights back on and the Archery Counselor missing.",
        ],
      },
      {
        block: "Act II — Discovery",
        time: "25–30 min",
        notes: [
          "Advance the phase so everyone's Act II unlocks.",
          "Body is found; you (the Detective) arrive and reveal the blunt-force/hammer clue.",
          "Hand out evidence cards as they come up (the hammer, the coroner's note).",
          "Give lots of free mingle time — players should be working their objectives.",
        ],
      },
      {
        block: "Act III — The Turn",
        time: "25–30 min",
        notes: [
          "Advance the phase. Maintenance breaks; suspicion turns to the Camp Director.",
          "The group detains the Director. Take the Director aside privately and tell them how they killed Archery.",
          "Drop the remaining evidence (missing meds, the rope). The Director dies.",
        ],
      },
      {
        block: "Accusation",
        time: "10–15 min",
        notes: [
          "Advance the phase. Run closing statements — each living player publicly names a suspect.",
          "Optionally take a vote before the reveal.",
        ],
      },
      {
        block: "Finale — The Medium",
        time: "10 min",
        notes: [
          "Advance to the Finale. Reveal you're a medium.",
          "Summon the ghost(s) and let the full truth spill. Crown a 'best detective' if you like.",
        ],
      },
    ],
    timeline: [
      {
        phase: "Act I — The Party & The Blackout",
        beats: [
          "The party gets going. A thunderstorm rolls in.",
          "The Archery Counselor and the Camp Director have a tense, serious conversation.",
          "The power cuts out. For ~15 minutes, no one can see a thing.",
          "During the blackout, everyone scatters:",
          "• Archery Counselor → goes to the emergency phone at the camp entrance and dials 911. The Counselor in Training follows to gain experience, but gets lost in the storm, yells for help, and is 'found' by the Camp Director.",
          "• Maintenance → heads to the electrical building to fix the lights; notices tools (the hammer) missing from their belt. Blames the booze.",
          "• Lifeguard & Alumnus → slip away to make out in a car, making a point of being seen leaving together (to make the Archery Counselor jealous). From the car, the Lifeguard half-sees a figure cross toward the lake/woods — that figure is the Camp Director, but the Lifeguard can't tell who it is. This is your investigative breadcrumb: only the Director went that way.",
          "• Survival Skills → goes outside to stand under a tree by the lake in the lightning ('the safest place to be'). RED HERRING: this is roughly the same direction the Director went, so the Lifeguard's sighting could be pinned on Survival Skills first. They genuinely saw and did nothing useful — let the group chase this wrong turn before the real clues land.",
          "• Wealthy Land Owner & Cook → talk about their marijuana operation.",
          "• Nurse → secretly follows the Cook to make a move, but overhears the operation instead.",
          "• Camp Director → goes to their car to listen to a voicemail from a parent (a legal threat).",
        ],
      },
      {
        phase: "Act I — The First Murder (the Camp Director's secret)",
        beats: [
          "The Camp Director knows their job is finished: Archery saw them strike a camper, a parent is threatening legal action, and Archery is slated to take their job.",
          "Crying in the car, the Director walks down by the lake to be in their feelings.",
          "In the woods they feel something at their feet — a muddy hammer stamped 'Property of Camp Guppy.' They figure Maintenance lost it.",
          "On the way back, they spot the Archery Counselor near the emergency phone, with the frazzled Counselor in Training nearby.",
          "The Director sees their chance: hammer → temple → dead. They dispose of the body in the mud across the way.",
          "They slip the hammer into the Counselor in Training's backpack.",
          "They walk back into the party right after Maintenance, Alumnus, and Lifeguard — just as the lights come back on.",
          "Lights are back. Everyone is present… except the Archery Counselor.",
        ],
      },
      {
        phase: "Act II — Discovery",
        beats: [
          "The Camp Director says they found the Counselor in Training wandering alone in the storm.",
          "No one admits what they were really doing during the blackout (secrets and embarrassment): Maintenance claims they fixed the lights; Alumnus & Lifeguard cover for each other; Nurse, Wealthy Land Owner, and Cook each make something up; Survival Skills claims they were keeping everyone safe.",
          "Where is the Archery Counselor? The Counselor in Training says they tried to buddy-system but got lost immediately.",
          "Everyone searches and finds the body in the woods. Chaos erupts.",
          "The Camp Director urges everyone to stay calm and stick together — 'there could be a murderer among us!'",
          "Survival Skills botches a 'tracking' demonstration and hurts the Counselor in Training. The Wealthy Land Owner wants it all hushed up. The Alumnus explodes at the Camp Director. The Nurse flees, dropping the first aid kit.",
          "The Useless Detective (you) arrives: 'I got a call about something. Does anyone want to fill me in?' — confused by the mixed signals.",
          "The Lifeguard shows you the body. You reveal the death was a blunt blow to the temple — and end your list of examples on a HAMMER.",
          "Suspicion swings to Maintenance, who won't admit the hammer is missing.",
          "The Counselor in Training opens their backpack for water and spots the hammer inside. The Nurse sees it too and shrieks.",
        ],
      },
      {
        phase: "Act III — The Second Murder",
        beats: [
          "You question the Counselor in Training; others pile on. The hammer is clearly Maintenance's.",
          "Maintenance is forced to admit the alcoholism and that the hammer was lost — and feels framed.",
          "Maintenance storms off to drink; the Camp Director follows to 'calm them down,' and the gang trails along to settle their nerves.",
          "More blackout truths leak out: Survival Skills spins an absurd heroics tale (Cook backs it to deflect from the operation); the Alumnus hints they were with the Lifeguard.",
          "RED HERRING beat: the Lifeguard's lake sighting first lands on Survival Skills (who really was out by the trees). Let the group suspect them, then unravel it — Survival Skills has no motive and no murder weapon, and the voicemail + CiT's testimony redirect everyone to the Director.",
          "The Nurse tells the Counselor in Training they believe them — and reveals that kids have been beaten by someone violent at this camp.",
          "The Counselor in Training repeats that the Camp Director 'found' them while they followed Archery. The clues connect; rumors start that the Camp Director did it.",
          "The crew detains and ties up the Camp Director in another room. (You note there's no conclusive evidence — but they can do what they want.)",
          "While everyone gossips and plots, the ALUMNUS spikes the Camp Director's drink with the Nurse's stolen meds — revenge for their beaten child.",
          "The Camp Director takes the drink into the room, chokes, and dies.",
          "The Cook & Nurse find the body and stage a rope around the neck to frame the Director (so the Wealthy Land Owner's drug operation stays buried). The Land Owner verifies the work.",
          "The Counselor in Training discovers the roped body.",
        ],
      },
      {
        phase: "Accusation — Closing Statements",
        beats: [
          "Gather everyone. Go around the room: each living character makes a public statement and names who they think killed the Archery Counselor (and now the Camp Director).",
          "The room will converge on the (dead) Camp Director for Murder 1 — and most will assume the Director's death was justice or suicide.",
          "No one knows the Alumnus poisoned the Director. Let that tension sit.",
          "Optionally take a quick vote before the reveal.",
        ],
      },
      {
        phase: "Finale — The Twist",
        beats: [
          "Reveal that you, the Useless Detective, are secretly a MEDIUM.",
          "Summon the GHOST of the Camp Director (the Archery Counselor can be summoned too) — and the ghost spills EVERYTHING.",
        ],
      },
    ],
    acts: {
      "The Murders (Solution)": [
        "MURDER 1 — Archery Counselor: killed by the CAMP DIRECTOR during the blackout, with Maintenance's hammer, near the emergency phone. Body dumped in the mud; hammer planted in the Counselor in Training's backpack.",
        "MURDER 2 — Camp Director: in Act III, while everyone gossips and plots against the restrained Camp Director, the ALUMNUS spikes the Camp Director's drink with the Nurse's stolen meds. The Camp Director takes the drink into the room, chokes, and dies — revenge for their beaten child. The Cook & Nurse then find the body and stage a rope around the neck to frame the Camp Director; the Wealthy Land Owner verifies. The Counselor in Training discovers the roped body.",
      ],
      "Act II — Your Entrance": [
        "Arrive after the body is found: 'I got a call about something. Does anyone want to fill me in?'",
        "Be confused — some say there's a death, some say nothing's wrong, some are suspiciously quiet.",
        "Have the Lifeguard show you the body (the Wealthy Land Owner won't like it).",
        "Reveal: death was caused by a blunt weapon to the temple — list examples, ending with… a HAMMER.",
        "Let the table spiral over who owns a hammer (it points at Maintenance).",
      ],
      "Act III — Your Job": [
        "Useless reminder: there's no conclusive evidence to make an arrest… but the gang can do what they want.",
        "When they detain and tie up the Camp Director, take the Camp Director aside privately and tell them exactly how they killed the Archery Counselor.",
        "Let the players carry out the Camp Director's murder while the rest deliberate.",
      ],
      "Accusation — Closing Statements": [
        "Call the room to order and run closing statements: go around and have each living character publicly name who they think did it and why.",
        "Stay uselessly neutral — remind them there's still no hard proof.",
        "Optionally take a show-of-hands vote on who killed the Archery Counselor before you reveal the truth.",
        "Let the table believe they've solved it (the Director for Murder 1) — they still don't know the Alumnus poisoned the Director.",
      ],
      "Finale — The Big Twist": [
        "Open the floor: every character makes public statements and accusations about what they think happened.",
        "Then reveal you're a MEDIUM.",
        "Summon the GHOST of the Camp Director (the Archery Counselor player can also be summoned) — and the ghost spills EVERYTHING.",
      ],
    },
  },
];

/*
 * Printable evidence / clue cards. The host hands these out at the right moment
 * to make the mystery something players DISCOVER rather than just narrate.
 * `reveal` tells the host when to drop it.
 */
const CLUES = [
  {
    id: "hammer",
    emoji: "🔨",
    title: "The Hammer",
    reveal: "Act II — when the Counselor in Training opens their backpack",
    body: "A muddy claw hammer stamped “PROPERTY OF CAMP GUPPY.” Found tucked inside the Counselor in Training's backpack. The head is dark with something that isn't mud.",
  },
  {
    id: "coroner",
    emoji: "🩺",
    title: "Detective's Field Notes",
    reveal: "Act II — after you examine the body",
    body: "Cause of death: a single blunt blow to the left temple. Consistent with a heavy tool — a wrench, a rock, a pipe… or a hammer.",
  },
  {
    id: "voicemail",
    emoji: "📞",
    title: "Voicemail Transcript",
    reveal: "Act III — if players search the Camp Director's car/phone",
    body: "“This is Jordan's parent. We KNOW what you did to our child. You'll be hearing from our lawyer — and you will never work near children again.”",
  },
  {
    id: "911",
    emoji: "☎️",
    title: "Emergency Phone Log",
    reveal: "Act II/III — when the blackout is discussed",
    body: "Camp entrance emergency line: one outbound 911 call placed during the blackout, then disconnected after 4 seconds. Caller never spoke.",
  },
  {
    id: "medkit",
    emoji: "💊",
    title: "First Aid Kit Inventory",
    reveal: "Act III — after the Nurse drops the kit",
    body: "Bandages, gauze, gloves… and an empty slot where a bottle of strong sedatives should be. Someone took the meds.",
  },
  {
    id: "rope",
    emoji: "🪢",
    title: "The Rope",
    reveal: "Act III — when the Camp Director's body is found",
    body: "A length of camp rope, cut from a tent line. Looped around the Camp Director's neck — but the marks don't match the way they actually died.",
  },
  {
    id: "toolbelt",
    emoji: "🧰",
    title: "Maintenance Tool Belt",
    reveal: "Act II — when the hammer's owner is questioned",
    body: "A worn leather tool belt with one conspicuously empty loop — exactly hammer-shaped. The wearer smells faintly of whiskey.",
  },
];

