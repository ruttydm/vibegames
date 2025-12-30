// NYE Party Game Prompts Database

// ============================================
// TRIVIA - 2024 Rewind Questions
// ============================================

export interface TriviaQuestion {
  question: string
  options: string[]
  correctIndex: number
  category: 'pop_culture' | 'world_events' | 'tech' | 'sports' | 'music_movies'
}

export const triviaQuestions: TriviaQuestion[] = [
  // Pop Culture - Original
  {
    question: "What phrase went viral in 2024 associated with Kendrick Lamar's diss tracks?",
    options: ["They not like us", "BBL Drizzy", "Family Matters", "Push Ups"],
    correctIndex: 0,
    category: 'pop_culture'
  },
  {
    question: "Which fast food chain's collaboration with a streamer broke sales records in 2024?",
    options: ["McDonald's x MrBeast", "Wendy's x Kai Cenat", "Taco Bell x xQc", "Burger King x IShowSpeed"],
    correctIndex: 0,
    category: 'pop_culture'
  },
  {
    question: "What viral TikTok trend encouraged people to be 'very demure, very mindful'?",
    options: ["The Griddy", "Hawk Tuah", "Demure aesthetic", "The Apple Dance"],
    correctIndex: 2,
    category: 'pop_culture'
  },
  {
    question: "Which reality TV show had a major comeback in 2024?",
    options: ["Jersey Shore", "The Traitors", "Survivor", "Big Brother"],
    correctIndex: 1,
    category: 'pop_culture'
  },
  {
    question: "What was the viral 'Hawk Tuah' meme about?",
    options: ["A TikTok dance", "A street interview quote", "A video game move", "A song lyric"],
    correctIndex: 1,
    category: 'pop_culture'
  },
  {
    question: "Which influencer went to jail for fraud in 2024?",
    options: ["Jake Paul", "Tana Mongeau", "Brooke Ashley Hall", "SSSniperWolf"],
    correctIndex: 2,
    category: 'pop_culture'
  },
  {
    question: "What was the 'Italian Bob' trend about?",
    options: ["A haircut style", "A pasta recipe", "A TikTok character", "A dating strategy"],
    correctIndex: 0,
    category: 'pop_culture'
  },
  {
    question: "Which celebrity couple got divorced in 2024 after being called 'couple goals'?",
    options: ["Kim K & Pete", "Ben Affleck & J.Lo", "Blake & Ryan", "Tom & Gisele"],
    correctIndex: 1,
    category: 'pop_culture'
  },
  {
    question: "What 'brat' related thing took over summer 2024?",
    options: ["A reality show", "Charli XCX's album", "A fashion trend", "A viral recipe"],
    correctIndex: 1,
    category: 'pop_culture'
  },
  {
    question: "What color became synonymous with 'brat summer'?",
    options: ["Hot pink", "Neon orange", "Lime green", "Electric blue"],
    correctIndex: 2,
    category: 'pop_culture'
  },

  // World Events - Original + New
  {
    question: "Which city hosted the 2024 Summer Olympics?",
    options: ["Los Angeles", "Paris", "Tokyo", "Brisbane"],
    correctIndex: 1,
    category: 'world_events'
  },
  {
    question: "What major bridge collapsed in the US in March 2024?",
    options: ["Golden Gate Bridge", "Brooklyn Bridge", "Francis Scott Key Bridge", "Mackinac Bridge"],
    correctIndex: 2,
    category: 'world_events'
  },
  {
    question: "Which country experienced a total solar eclipse visible from North America in April 2024?",
    options: ["Canada only", "Mexico, USA, and Canada", "USA only", "Mexico only"],
    correctIndex: 1,
    category: 'world_events'
  },
  {
    question: "What was the name of the container ship that hit the Baltimore bridge?",
    options: ["Ever Given", "Dali", "Evergreen", "Maersk Star"],
    correctIndex: 1,
    category: 'world_events'
  },
  {
    question: "Which country's royal family had a major health scare in 2024?",
    options: ["Spain", "UK", "Sweden", "Netherlands"],
    correctIndex: 1,
    category: 'world_events'
  },
  {
    question: "What major sporting event happened in Germany in summer 2024?",
    options: ["World Cup", "Euro 2024", "Champions League Final", "Formula 1 Grand Prix"],
    correctIndex: 1,
    category: 'world_events'
  },
  {
    question: "Which tech billionaire bought a social media platform and changed its name?",
    options: ["Mark Zuckerberg", "Elon Musk", "Jeff Bezos", "Bill Gates"],
    correctIndex: 1,
    category: 'world_events'
  },
  {
    question: "What was the main concern with Boeing planes in 2024?",
    options: ["Engine fires", "Door blowouts", "Wing cracks", "Landing gear"],
    correctIndex: 1,
    category: 'world_events'
  },
  {
    question: "Which country faced major protests over a pension reform in 2024?",
    options: ["Germany", "UK", "France", "Italy"],
    correctIndex: 2,
    category: 'world_events'
  },
  {
    question: "What unexpected guest showed up at many global events in 2024?",
    options: ["UFOs", "Cicadas (brood emergence)", "Northern Lights", "All of the above"],
    correctIndex: 3,
    category: 'world_events'
  },

  // Tech - Original + New
  {
    question: "What did Apple release in early 2024 that people strapped to their faces?",
    options: ["Apple Glasses", "Apple Vision Pro", "Apple VR", "Apple Headset"],
    correctIndex: 1,
    category: 'tech'
  },
  {
    question: "Which AI chatbot released a viral voice mode that could sing and emote?",
    options: ["Google Gemini", "ChatGPT-4o", "Claude", "Llama"],
    correctIndex: 1,
    category: 'tech'
  },
  {
    question: "What video game term did 'brain rot' culture popularize in 2024?",
    options: ["NPC", "Skibidi", "Rizz", "Gyatt"],
    correctIndex: 1,
    category: 'tech'
  },
  {
    question: "Which company's stock soared due to AI chip demand in 2024?",
    options: ["Intel", "AMD", "NVIDIA", "Qualcomm"],
    correctIndex: 2,
    category: 'tech'
  },
  {
    question: "What was Sora, announced by OpenAI in 2024?",
    options: ["A new ChatGPT version", "An AI video generator", "A robot assistant", "A coding tool"],
    correctIndex: 1,
    category: 'tech'
  },
  {
    question: "Which game went viral on TikTok for its 'rizz' feature in 2024?",
    options: ["Fortnite", "Roblox", "Baldur's Gate 3", "Palworld"],
    correctIndex: 2,
    category: 'tech'
  },
  {
    question: "What Pokémon-like game got called out for plagiarism in 2024?",
    options: ["Temtem", "Coromon", "Palworld", "Monster Crown"],
    correctIndex: 2,
    category: 'tech'
  },
  {
    question: "Which social media app faced a potential US ban in 2024?",
    options: ["Instagram", "TikTok", "Snapchat", "Twitter/X"],
    correctIndex: 1,
    category: 'tech'
  },
  {
    question: "What was the CrowdStrike outage that crashed millions of computers?",
    options: ["A cyberattack", "A bad software update", "A virus", "A power grid failure"],
    correctIndex: 1,
    category: 'tech'
  },
  {
    question: "Which AI assistant became known for being 'helpful, harmless, and honest'?",
    options: ["Siri", "Alexa", "Claude", "Cortana"],
    correctIndex: 2,
    category: 'tech'
  },
  {
    question: "What did Google rebrand their AI assistant to in 2024?",
    options: ["Bard", "Gemini", "LaMDA", "PaLM"],
    correctIndex: 1,
    category: 'tech'
  },
  {
    question: "Which game won Game of the Year at The Game Awards 2023 (held Dec 2023)?",
    options: ["Zelda: Tears of the Kingdom", "Baldur's Gate 3", "Alan Wake 2", "Spider-Man 2"],
    correctIndex: 1,
    category: 'tech'
  },

  // Sports - Original + New
  {
    question: "Which country won the most gold medals at the 2024 Paris Olympics?",
    options: ["China", "USA", "Great Britain", "France"],
    correctIndex: 1,
    category: 'sports'
  },
  {
    question: "Which NFL team won Super Bowl LVIII in February 2024?",
    options: ["San Francisco 49ers", "Kansas City Chiefs", "Baltimore Ravens", "Detroit Lions"],
    correctIndex: 1,
    category: 'sports'
  },
  {
    question: "Which tennis legend retired in 2024 with an emotional farewell?",
    options: ["Novak Djokovic", "Roger Federer", "Rafael Nadal", "Andy Murray"],
    correctIndex: 2,
    category: 'sports'
  },
  {
    question: "Who won the 2024 F1 World Championship?",
    options: ["Lewis Hamilton", "Max Verstappen", "Charles Leclerc", "Lando Norris"],
    correctIndex: 1,
    category: 'sports'
  },
  {
    question: "Which golfer had a record-breaking Masters win in 2024?",
    options: ["Tiger Woods", "Rory McIlroy", "Scottie Scheffler", "Jon Rahm"],
    correctIndex: 2,
    category: 'sports'
  },
  {
    question: "What Olympics sport debuted in Paris 2024?",
    options: ["Skateboarding", "Breakdancing", "Surfing", "Climbing"],
    correctIndex: 1,
    category: 'sports'
  },
  {
    question: "Which team did Lionel Messi play for in 2024?",
    options: ["Barcelona", "PSG", "Inter Miami", "Al-Hilal"],
    correctIndex: 2,
    category: 'sports'
  },
  {
    question: "Who broke the 100m world record at the 2024 Olympics?",
    options: ["Usain Bolt", "Noah Lyles", "No one broke it", "Fred Kerley"],
    correctIndex: 2,
    category: 'sports'
  },
  {
    question: "Which country won the Euro 2024 football championship?",
    options: ["France", "Germany", "Spain", "England"],
    correctIndex: 2,
    category: 'sports'
  },
  {
    question: "What happened in the Chiefs-49ers Super Bowl LVIII?",
    options: ["49ers won in OT", "Chiefs won in OT", "Chiefs won by 20+", "49ers won by 10"],
    correctIndex: 1,
    category: 'sports'
  },

  // Music & Movies - Original + New
  {
    question: "Taylor Swift's Eras Tour became the highest-grossing tour ever. What was its estimated revenue?",
    options: ["$500 million", "$1 billion", "$2 billion", "$5 billion"],
    correctIndex: 2,
    category: 'music_movies'
  },
  {
    question: "Which movie won Best Picture at the 2024 Oscars?",
    options: ["Barbie", "Oppenheimer", "Poor Things", "Killers of the Flower Moon"],
    correctIndex: 1,
    category: 'music_movies'
  },
  {
    question: "Sabrina Carpenter had a massive hit in 2024. What was it called?",
    options: ["Vampire", "Espresso", "Greedy", "Water"],
    correctIndex: 1,
    category: 'music_movies'
  },
  {
    question: "Which animated sequel broke box office records in 2024?",
    options: ["Frozen 3", "Inside Out 2", "Toy Story 5", "Shrek 5"],
    correctIndex: 1,
    category: 'music_movies'
  },
  {
    question: "Beyoncé released a new album in 2024. What genre did it explore?",
    options: ["Rock", "Country", "Jazz", "Classical"],
    correctIndex: 1,
    category: 'music_movies'
  },
  {
    question: "What song did Chappell Roan become famous for in 2024?",
    options: ["Good Luck Babe", "Vampire", "Cruel Summer", "Anti-Hero"],
    correctIndex: 0,
    category: 'music_movies'
  },
  {
    question: "Which movie franchise returned with 'Deadpool & Wolverine'?",
    options: ["DC", "Marvel/MCU", "Sony Spider-Verse", "Fox X-Men"],
    correctIndex: 1,
    category: 'music_movies'
  },
  {
    question: "Who played Deadpool in the 2024 movie?",
    options: ["Chris Hemsworth", "Ryan Gosling", "Ryan Reynolds", "Chris Pratt"],
    correctIndex: 2,
    category: 'music_movies'
  },
  {
    question: "What Dune movie came out in 2024?",
    options: ["Dune: Part One", "Dune: Part Two", "Dune: Messiah", "Dune: The Prequel"],
    correctIndex: 1,
    category: 'music_movies'
  },
  {
    question: "Which K-pop group's member enlisted in the military in 2024?",
    options: ["BLACKPINK", "BTS", "Stray Kids", "NewJeans"],
    correctIndex: 1,
    category: 'music_movies'
  },
  {
    question: "What was the name of Beyoncé's country album?",
    options: ["Renaissance", "Cowboy Carter", "Texas Hold 'Em", "Country Strong"],
    correctIndex: 1,
    category: 'music_movies'
  },
  {
    question: "Which horror movie prequel came out in 2024?",
    options: ["It: Part 3", "A Quiet Place: Day One", "The Conjuring 4", "Insidious 6"],
    correctIndex: 1,
    category: 'music_movies'
  },
  {
    question: "What streaming platform had the hit series 'Shogun' in 2024?",
    options: ["Netflix", "Hulu/FX", "HBO Max", "Amazon Prime"],
    correctIndex: 1,
    category: 'music_movies'
  },
  {
    question: "Which artist released 'The Tortured Poets Department' in 2024?",
    options: ["Lana Del Rey", "Taylor Swift", "Olivia Rodrigo", "Billie Eilish"],
    correctIndex: 1,
    category: 'music_movies'
  },
  {
    question: "What animated film featured baby emotions like Anxiety?",
    options: ["Soul 2", "Inside Out 2", "Elemental 2", "Coco 2"],
    correctIndex: 1,
    category: 'music_movies'
  }
]

// ============================================
// VOTING - Most Likely To... Prompts
// ============================================

export const votingPrompts: string[] = [
  // NYE Specific
  "stay up past 2am tonight",
  "be the first to fall asleep at the party",
  "start the dance floor",
  "take the most selfies tonight",
  "give the best toast at midnight",
  "forget their New Year's resolution by January 2nd",
  "actually keep their resolution all year",
  "cry when the ball drops",
  "lose their phone tonight",
  "be the last one standing",
  "drink the most champagne tonight",
  "start an embarrassing dance",
  "kiss a stranger at midnight",
  "post a cringy Instagram story tonight",
  "fall asleep before midnight",
  "be too drunk to remember tonight",
  "make an awkward speech",
  "photobomb every photo",
  "complain about being tired",
  "be the designated driver",

  // Funny Predictions for Next Year
  "become famous in the new year",
  "win the lottery",
  "adopt a random pet",
  "move to a new country",
  "go viral on social media",
  "write a book",
  "start a podcast nobody listens to",
  "get a ridiculous tattoo",
  "accidentally text the wrong person something embarrassing",
  "eat something they dropped on the floor",
  "start a new hobby and immediately quit",
  "buy something ridiculous online at 3am",
  "get locked out of their house",
  "become obsessed with a niche hobby",
  "dye their hair a wild color",
  "start talking to plants",
  "become a morning person (and hate it)",
  "learn a TikTok dance ironically",
  "befriend their neighbor's cat",
  "quote a movie in every conversation",

  // Group Dynamics
  "give the best advice",
  "always be late",
  "survive a zombie apocalypse",
  "become a reality TV star",
  "get into an argument with a stranger",
  "befriend a celebrity",
  "still be playing video games at 80",
  "accidentally start a fire while cooking",
  "have a secret talent nobody knows about",
  "become a meme",
  "ghost a group chat",
  "reply to texts a week later",
  "start drama in the group",
  "be the peacemaker after drama",
  "plan an event nobody shows up to",
  "tell a story that goes nowhere",
  "laugh at their own jokes",
  "fall for an obvious scam",
  "get recognized in public",
  "forget someone's name mid-conversation",

  // Life Situations
  "cry watching a commercial",
  "talk to customer service for hours",
  "win an argument with their parents",
  "binge an entire series in one day",
  "have a quarter-life crisis",
  "start a fight in a parking lot",
  "become a plant parent",
  "buy a boat they'll never use",
  "join a pyramid scheme accidentally",
  "send a risky text and regret it",
  "get way too invested in a reality show",
  "road rage at a shopping cart",
  "forget their own age",
  "give directions confidently while being completely wrong",
  "order something weird just to try it",

  // Relationship Questions
  "slide into someone's DMs",
  "get back with an ex",
  "stalk their crush on social media",
  "say 'I love you' first",
  "catch feelings for a friend",
  "have the most dramatic breakup",
  "marry first in the group",
  "have kids first",
  "give the best relationship advice (while single)",
  "have a secret admirer"
]

// ============================================
// DRAWING - Sketch NYE Prompts
// ============================================

export const drawingPrompts: string[] = [
  // NYE Items
  "champagne bottle",
  "fireworks",
  "party hat",
  "countdown clock",
  "confetti",
  "disco ball",
  "midnight kiss",
  "sparkler",
  "Times Square ball",
  "party horn/noisemaker",
  "calendar flipping to January",
  "baby new year",
  "champagne glasses toasting",
  "glitter",
  "balloon drop",
  "New Year banner",
  "gold streamers",
  "clock striking midnight",
  "champagne cork popping",
  "party crowd",
  "confetti cannon",
  "2026 glasses",
  "resolution list",
  "countdown timer",
  "party invitation",

  // Winter/Season
  "snowman",
  "ice skating",
  "hot cocoa",
  "fireplace",
  "winter coat",
  "mittens",
  "snowflake",
  "sled",
  "warm blanket",
  "snow angel",
  "icicle",
  "winter scarf",
  "earmuffs",
  "cabin in snow",
  "frozen lake",

  // General Party
  "DJ booth",
  "dance floor",
  "karaoke",
  "photo booth",
  "streamers",
  "gift",
  "party popper",
  "dance moves",
  "punch bowl",
  "party dress",
  "bow tie",
  "fancy shoes",
  "appetizers",
  "cheese platter",
  "party lights",
  "speaker blasting music",

  // Food & Drinks
  "pizza slice",
  "birthday cake",
  "cupcake",
  "cocktail",
  "wine glass",
  "sushi roll",
  "taco",
  "ice cream cone",
  "donut",
  "pretzel",
  "popcorn",
  "nachos",
  "chocolate fountain",

  // Fun Challenges
  "someone making a resolution",
  "watching the ball drop",
  "awkward midnight kiss",
  "someone falling asleep at the party",
  "drunk uncle dancing",
  "photobomber",
  "selfie with friends",
  "group hug",
  "conga line",
  "limbo dancing",
  "spilled drink",
  "lost keys",
  "checking phone at party",
  "someone crying happy tears",
  "fancy handshake",

  // Pop Culture 2024
  "demure walk",
  "brain rot meme",
  "viral dance",
  "influencer posing",
  "podcast microphone",
  "gaming setup",
  "ring light selfie",
  "food blogger",
  "plant mom",
  "cat video",

  // Emotions & Actions
  "happy tears",
  "surprised face",
  "excited jumping",
  "clapping hands",
  "peace sign",
  "thumbs up",
  "mind blown",
  "chef's kiss",
  "facepalm",
  "dabbing",

  // Animals at Party
  "party dog",
  "cat in party hat",
  "dancing penguin",
  "fancy llama",
  "disco chicken",
  "chill sloth",
  "party parrot",
  "celebratory elephant"
]

// ============================================
// REACTION - Countdown Clash Prompts
// ============================================

export interface ReactionChallenge {
  type: 'stop_at_time' | 'mash_buttons' | 'hold_duration' | 'rhythm'
  title: string
  description: string
  targetValue?: number // For stop_at_time (ms) or hold_duration (ms)
  duration?: number // For mash_buttons (seconds)
}

export const reactionChallenges: ReactionChallenge[] = [
  // Stop at time challenges
  {
    type: 'stop_at_time',
    title: "Midnight Precision",
    description: "Stop the timer as close to 0:00 as possible!",
    targetValue: 0
  },
  {
    type: 'stop_at_time',
    title: "Halfway There",
    description: "Stop the timer at exactly 5 seconds!",
    targetValue: 5000
  },
  {
    type: 'stop_at_time',
    title: "Three Second Rule",
    description: "Stop at exactly 3 seconds!",
    targetValue: 3000
  },
  {
    type: 'stop_at_time',
    title: "Lucky Seven",
    description: "Hit that perfect 7 second mark!",
    targetValue: 7000
  },
  {
    type: 'stop_at_time',
    title: "One Second Wonder",
    description: "Can you stop at exactly 1 second?",
    targetValue: 1000
  },
  {
    type: 'stop_at_time',
    title: "Quarter Past",
    description: "Stop at exactly 2.5 seconds!",
    targetValue: 2500
  },
  {
    type: 'stop_at_time',
    title: "The Perfect Eight",
    description: "Land on 8 seconds exactly!",
    targetValue: 8000
  },
  {
    type: 'stop_at_time',
    title: "Split Second",
    description: "Stop at 0.5 seconds - can you do it?",
    targetValue: 500
  },

  // Button mashing
  {
    type: 'mash_buttons',
    title: "Champagne Pop!",
    description: "Tap as fast as you can to pop the cork!",
    duration: 5
  },
  {
    type: 'mash_buttons',
    title: "Firework Frenzy",
    description: "Tap rapidly to launch as many fireworks as possible!",
    duration: 7
  },
  {
    type: 'mash_buttons',
    title: "Confetti Cannon",
    description: "Mash to fill the confetti meter!",
    duration: 4
  },
  {
    type: 'mash_buttons',
    title: "Balloon Blitz",
    description: "Pop as many balloons as you can!",
    duration: 6
  },
  {
    type: 'mash_buttons',
    title: "Disco Inferno",
    description: "Keep the disco ball spinning with rapid taps!",
    duration: 8
  },
  {
    type: 'mash_buttons',
    title: "Party Popper Madness",
    description: "Pull as many party poppers as possible!",
    duration: 5
  },
  {
    type: 'mash_buttons',
    title: "Countdown Craze",
    description: "Tap through the countdown as fast as you can!",
    duration: 10
  },
  {
    type: 'mash_buttons',
    title: "Sparkle Sprint",
    description: "Light up as many sparklers as possible!",
    duration: 4
  },

  // Hold duration
  {
    type: 'hold_duration',
    title: "Steady Toast",
    description: "Hold your glass steady for exactly 3 seconds!",
    targetValue: 3000
  },
  {
    type: 'hold_duration',
    title: "Sparkler Hold",
    description: "Keep the sparkler lit for exactly 5 seconds!",
    targetValue: 5000
  },
  {
    type: 'hold_duration',
    title: "Champagne Balance",
    description: "Balance the champagne tower for 4 seconds!",
    targetValue: 4000
  },
  {
    type: 'hold_duration',
    title: "Frozen Pose",
    description: "Hold your pose for exactly 6 seconds!",
    targetValue: 6000
  },
  {
    type: 'hold_duration',
    title: "Firework Fuse",
    description: "Light the fuse for exactly 2 seconds!",
    targetValue: 2000
  },
  {
    type: 'hold_duration',
    title: "Balloon Float",
    description: "Keep the balloon afloat for 7 seconds!",
    targetValue: 7000
  },
  {
    type: 'hold_duration',
    title: "Quick Freeze",
    description: "Hold for exactly 1.5 seconds!",
    targetValue: 1500
  },
  {
    type: 'hold_duration',
    title: "Dance Freeze",
    description: "Strike a pose for exactly 8 seconds!",
    targetValue: 8000
  },

  // Rhythm
  {
    type: 'rhythm',
    title: "Countdown Beat",
    description: "Tap in rhythm with the countdown: 10... 9... 8...",
    duration: 10
  },
  {
    type: 'rhythm',
    title: "Auld Lang Syne",
    description: "Tap along to the beat!",
    duration: 8
  },
  {
    type: 'rhythm',
    title: "Disco Groove",
    description: "Match the disco rhythm!",
    duration: 6
  },
  {
    type: 'rhythm',
    title: "Party Pulse",
    description: "Feel the party beat and tap along!",
    duration: 8
  },
  {
    type: 'rhythm',
    title: "Midnight Melody",
    description: "Tap to the midnight chimes!",
    duration: 12
  },
  {
    type: 'rhythm',
    title: "Celebration Beat",
    description: "Keep the celebration going with rhythm!",
    duration: 7
  }
]

// ============================================
// Helper Functions
// ============================================

export function getRandomTrivia(count: number = 5): TriviaQuestion[] {
  const shuffled = [...triviaQuestions].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function getRandomVotingPrompts(count: number = 5): string[] {
  const shuffled = [...votingPrompts].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function getRandomDrawingPrompts(count: number = 5): string[] {
  const shuffled = [...drawingPrompts].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function getRandomReactionChallenges(count: number = 5): ReactionChallenge[] {
  const shuffled = [...reactionChallenges].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
