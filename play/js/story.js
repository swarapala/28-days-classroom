// story.js — the month, chapter by chapter. Edit dialogue here.
// Each chapter is one in-game day: where you start, what your body is doing (flow + cramps),
// who is where (npcs[].at = [fromMin, toMin, map, x, y, facing, wanderRadius]), and the scripts.

(function () {
  const G = () => getG();
  const H = (h, m = 0) => h * 60 + m;

  // Checked against CDC "About Heavy Menstrual Bleeding" and ACOG "Your First Period" / "Heavy and Abnormal Periods".
  window.WARNING_SIGNS = [
    "Needing to change your pad or tampon every 1 to 2 hours",
    "A period that lasts more than 7 days",
    "Needing to double up on pads, or change pads or tampons during the night",
    "Blood clots the size of a quarter or larger",
    "A flow so heavy it keeps you from doing the things you'd normally do",
    "Periods that come more often than every 21 days, or less often than every 45 days",
    "Your period stops for more than 3 months, or you haven't started by age 15",
    "Pain that keeps you from school or normal activities, or feeling dizzy, light-headed or very tired"
  ];
  window.TEEN_NOTE = "A normal period lasts 2 to 7 days. Teen cycles are often irregular, especially in the first few years, and anything from 21 to 45 days is normal. This game uses a 28-day cycle to keep things simple. Facts checked against CDC and ACOG pages; see SOURCES.md.";


  // ---------- "Did you know?" facts. Each pops up once, when the thing it's about happens. ----------
  // t = title in the Fact Book, x = the fact, s = where it was checked (see SOURCES.md for links).
  window.FACTS = {
    firstage:     { t: "First periods", s: "ACOG", x: "Most girls get their first period between ages 12 and 13, but some start earlier or later. No period by 15? That's worth a visit to the doctor." },
    lightfirst:   { t: "Light at first", s: "ACOG", x: "Your first few periods may be very light. You might only see a few spots of reddish-brown blood." },
    use_pad:      { t: "Don't flush", s: "CDC", x: "Wrap used pads and tampons in toilet paper or a tissue and toss them in the trash. Don't flush them down the toilet." },
    change:       { t: "How often to change", s: "ACOG, CDC", x: "Change a pad at least every 4 to 8 hours, or whenever it feels full or wet. Change more often when your flow is heavy." },
    stain:        { t: "Laundry tip", s: "University of Georgia Extension", x: "Blood stain? Treat it right away. Rinse a fresh stain in <b>cold</b> running water and rub in soap. Stains set by heat are hard to remove." },
    amount:       { t: "How much blood?", s: "CDC", x: "A usual period lasts about 4 to 5 days, and the total blood lost is small: about 2 to 3 tablespoons." },
    color:        { t: "Heaviest days", s: "ACOG", x: "A typical period lasts 2 to 7 days, with the heaviest bleeding in the first 3 days." },
    cramps:       { t: "Why cramps happen", s: "ACOG", x: "Cramps are caused by natural chemicals called prostaglandins, made in the lining of the uterus. They make the muscles of the uterus contract. More than half of women who menstruate have some pain for 1 to 2 days each month." },
    ibuprofen:    { t: "How pain relievers work", s: "ACOG", x: "Pain relievers like ibuprofen (NSAIDs) reduce the prostaglandins your body makes, so cramps are less severe. They work best taken at the first sign of your period or pain." },
    heat:         { t: "Heat helps", s: "ACOG", x: "A heating pad, hot water bottle or warm bath on your belly can soothe period cramps." },
    exercise:     { t: "Moving helps", s: "ACOG", x: "Aerobic exercise like walking, jogging, biking or swimming helps your body produce chemicals that block pain." },
    swim:         { t: "Periods and swimming", s: "Nemours KidsHealth, ACOG", x: "Tampons and menstrual cups catch the flow from inside the vagina, so they are helpful for sports like swimming. You can't wear a pad in the water." },
    use_tampon:   { t: "TSS", s: "ACOG, CDC", x: "Leaving a tampon in too long has been linked to toxic shock syndrome, a severe illness. Change it every 4 to 8 hours and use the lowest absorbency you need." },
    use_liner:    { t: "Liners", s: "ACOG", x: "A panty liner is a thinner, shorter pad. Some people wear one on light days at the end of a period, or on days they think their period will come." },
    use_underwear: { t: "Period underwear", s: "ACOG, CDC", x: "You can wear period underwear for a full day, or together with a pad, tampon or cup for extra protection. Most of it is machine washable." },
    use_cup:      { t: "Cups", s: "ACOG, CDC", x: "A menstrual cup is removed and emptied every 8 to 12 hours. Reusable cups should be cleaned every day, and sanitized in boiling water after your period." },
    overnight:    { t: "Nights", s: "CDC", x: "Needing to change pads or tampons during the night is on the CDC's list of signs of heavy menstrual bleeding. If it happens a lot, tell a doctor." },
    cost:         { t: "Access", s: "CDC", x: "Not everyone can easily get period products. Menstrual Hygiene Day, on May 28, raises awareness about access to products, period education and clean bathrooms." },
    reusable:     { t: "Reusables", s: "ACOG, CDC", x: "Some period products are reusable. Some menstrual cups can be washed and reused, and most period underwear is machine washable." },
    storebrand:   { t: "Read the label", s: "ACOG", x: "Always follow the directions on the bottle for how much pain reliever to take. People with asthma, an aspirin allergy, stomach problems or a bleeding disorder should not take NSAIDs like ibuprofen." },
    freeproducts: { t: "Wash your hands", s: "CDC", x: "Wash your hands before and after using the restroom, and before and after changing a pad, tampon or cup." },
    vital:        { t: "A vital sign", s: "ACOG, CDC", x: "ACOG says the menstrual cycle should be treated as a vital sign. The CDC calls it a valuable marker for your overall health." },
    energy:       { t: "Rising estrogen", s: "Cleveland Clinic", x: "After a period, estrogen and other hormones rise. That can affect your energy, mood and focus, and some people notice a more upbeat mood. It's different for everyone." },
    discharge:    { t: "Discharge", s: "ACOG, CDC", x: "Normal vaginal discharge is clear to white with no strong odor. The vagina is a self-cleaning organ. Just before ovulation, cervical mucus increases and gets thin and slippery." },
    egg:          { t: "The egg", s: "ACOG", x: "Ovulation is when an ovary releases an egg. In a 28-day cycle it happens about 14 days before the next period starts. The egg survives for about 24 hours." },
    temp:         { t: "Tiny temperature rise", s: "ACOG", x: "In most women, body temperature rises slightly at ovulation, by about half a degree to one degree Fahrenheit, and stays up until the end of the cycle." },
    cravings:     { t: "Cravings", s: "ACOG", x: "Food cravings are a common PMS symptom. Eating complex carbs, like whole grains, beans and brown rice, may reduce cravings and mood symptoms." },
    salt:         { t: "Salt, fat, sugar", s: "ACOG", x: "To help relieve PMS symptoms, ACOG suggests cutting back on salt, fat and sugar, and eating smaller meals more often." },
    water:        { t: "Drink enough", s: "CDC", x: "Drinking enough liquids during your period helps wash out your urinary tract and can help prevent infections." },
    pms:          { t: "PMS timing", s: "ACOG", x: "Many women feel physical or mood changes in the days before a period. PMS symptoms show up in the 5 days before a period and end within 4 days after it starts." },
    hist_cloth:   { t: "History: before store-bought pads", s: "Popular Science", x: "Before stores sold pads, most people in Europe and America used washable cloth rags, and reused them." },
    hist_kotex:   { t: "History: where pads came from", s: "Popular Science", x: "In World War I, nurses noticed that cellulose bandages soaked up blood well. That inspired Kotex, the first commercially successful pads." },
    hist_belt:    { t: "History: sanitary belts", s: "Popular Science", x: "From the mid-1800s to the 1970s, pads were held in place with a sanitary belt. Pads with an adhesive strip were introduced in 1969." },
    hist_tampon:  { t: "History: the first tampons", s: "Popular Science", x: "Tampons with a disposable cardboard applicator were patented in 1931, and became the Tampax brand." },
    hist_cup:     { t: "History: the first menstrual cup", s: "Popular Science", x: "Actress and entrepreneur Leona Chalmers patented a rubber menstrual cup in 1937." },
    hist_coupon:  { t: "History: too embarrassed to ask", s: "Popular Science", x: "One early pad brand printed coupons people could push across a store counter so they didn't have to ask for pads out loud. The pads were handed over wrapped in newspaper." },
    irregular:    { t: "Settling in", s: "ACOG", x: "Teen cycles are often irregular, especially in the first few years. ACOG says it may take 6 years or more after a first period for cycles to become regular." }
  };


  // ---------- Classroom edition: body diagram and glossary ----------
  // A simple labeled diagram of the internal organs, the kind found in any health textbook.
  window.bodyDiagram = function (labels) {
    const L = (x, y, t, x2, y2) => labels ? `<line x1="${x2}" y1="${y2}" x2="${x}" y2="${y - 3}" stroke="currentColor" stroke-width="0.8"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-size="9" fill="currentColor">${t}</text>` : "";
    return `<svg class="bodydiagram" viewBox="0 0 240 150" role="img" aria-label="Diagram of the uterus, fallopian tubes, ovaries, cervix and vagina">
      <path d="M92,44 Q60,22 38,50" fill="none" stroke="#e58fa0" stroke-width="7" stroke-linecap="round"/>
      <path d="M148,44 Q180,22 202,50" fill="none" stroke="#e58fa0" stroke-width="7" stroke-linecap="round"/>
      <ellipse cx="36" cy="60" rx="13" ry="9" fill="#f2c14e" stroke="#1d1828" stroke-width="1.5"/>
      <ellipse cx="204" cy="60" rx="13" ry="9" fill="#f2c14e" stroke="#1d1828" stroke-width="1.5"/>
      <path d="M88,38 Q120,24 152,38 L134,96 Q120,104 106,96 Z" fill="#e58fa0" stroke="#1d1828" stroke-width="1.5"/>
      <path d="M100,46 Q120,38 140,46 L128,88 Q120,92 112,88 Z" fill="#b84a5e"/>
      <rect x="110" y="96" width="20" height="13" fill="#c96a7c" stroke="#1d1828" stroke-width="1.5"/>
      <rect x="112" y="109" width="16" height="30" rx="3" fill="#f0b8c2" stroke="#1d1828" stroke-width="1.5"/>
      ${L(36, 88, "Ovary", 36, 70)}${L(204, 88, "Ovary", 204, 70)}
      ${L(52, 14, "Fallopian tube", 62, 34)}
      ${L(190, 14, "Uterus", 146, 50)}
      ${L(66, 112, "Lining of the uterus", 114, 80)}
      ${L(176, 108, "Cervix", 131, 102)}
      ${L(176, 132, "Vagina", 129, 124)}
    </svg>`;
  };
  // t = the word, d = what it means, s = where the definition was checked.
  window.GLOSSARY = [
    { t: "Puberty", s: "ACOG", d: "The time when your body begins to change to become more like an adult's. Starting your period is one of these changes." },
    { t: "Hormones", s: "ACOG", d: "Substances made in the body that control how cells and organs work. Hormones run the menstrual cycle." },
    { t: "Uterus", s: "ACOG", d: "A muscular organ in the pelvis. Its lining gets thicker each cycle, and sheds during a period." },
    { t: "Lining of the uterus", s: "ACOG", d: "Blood and tissue that build up inside the uterus each cycle. When it breaks down and leaves the body, that's a period." },
    { t: "Ovaries", s: "ACOG", d: "Two organs that hold the eggs and make hormones such as estrogen and progesterone." },
    { t: "Egg", s: "ACOG", d: "The reproductive cell made in and released from the ovaries." },
    { t: "Fallopian tubes", s: "ACOG", d: "Tubes that an egg travels through to get from an ovary to the uterus." },
    { t: "Cervix", s: "HHS Office on Women's Health", d: "The lower end of the uterus. It has a small opening that menstrual blood flows through." },
    { t: "Vagina", s: "ACOG", d: "A tube-like structure surrounded by muscles. It leads from the uterus to the outside of the body." },
    { t: "Menstrual cycle", s: "ACOG", d: "The monthly process of changes that prepares the body for a possible pregnancy. It is counted from the first day of one period to the first day of the next." },
    { t: "Period (menstruation)", s: "ACOG", d: "The monthly shedding of blood and tissue from the uterus. A normal period lasts 2 to 7 days." },
    { t: "Ovulation", s: "ACOG", d: "The time when an ovary releases an egg. In a 28-day cycle, it's about 14 days before the next period." },
    { t: "Follicle", s: "Cleveland Clinic", d: "A small sac in the ovary where an egg grows." },
    { t: "Estrogen", s: "Cleveland Clinic", d: "A hormone made in the ovaries. As it rises, the lining of the uterus grows and thickens." },
    { t: "Progesterone", s: "NIH StatPearls", d: "The main hormone after ovulation. It helps prepare the lining of the uterus." },
    { t: "FSH", s: "Cleveland Clinic", d: "Follicle-stimulating hormone. It makes follicles in the ovaries grow." },
    { t: "LH", s: "HHS Office on Women's Health", d: "Luteinizing hormone. A sudden increase in LH tells an ovary to release an egg." },
    { t: "Cramps", s: "ACOG", d: "Pain in the lower belly or back before or during a period. Natural chemicals called prostaglandins make the uterus contract." },
    { t: "PMS", s: "ACOG", d: "Premenstrual syndrome. Physical or mood changes in the days before a period, like bloating, food cravings and irritability." },
    { t: "Discharge", s: "ACOG", d: "Fluid from the vagina. Normal discharge is clear to white and has no strong odor." },
    { t: "Pad", s: "ACOG", d: "Worn inside your underwear to soak up menstrual flow. Change it at least every 4 to 8 hours." },
    { t: "Panty liner", s: "ACOG", d: "A thinner, shorter pad for light days." },
    { t: "Tampon", s: "ACOG", d: "Absorbs menstrual blood from inside the vagina. Change it every 4 to 8 hours, and never wear one longer than 8." },
    { t: "Menstrual cup", s: "ACOG", d: "A cup inserted into the vagina to catch menstrual flow. It is removed and emptied every 8 to 12 hours." },
    { t: "Period underwear", s: "ACOG", d: "Underwear with special material sewn in that soaks up menstrual blood." },
    { t: "Toxic shock syndrome (TSS)", s: "ACOG", d: "A severe illness caused by a bacterial infection. It has been linked to leaving a tampon in too long." },
    { t: "Cycle tracking", s: "ACOG", d: "Marking the first day of each period and how you feel, so you can notice your pattern and predict your next period." },
    { t: "Trusted adult", s: "", d: "A grown-up you can go to with questions about your body: a parent or guardian, a school nurse, a doctor, a teacher or a counselor." }
  ];

  // ---------- Health class with Dr. Flo (the only class, every school morning) ----------
  // slides = the lesson. quiz: q = question, a = answers, c = index of the right one, why = shown after answering.
  // Content checked against CDC and ACOG pages (see SOURCES.md). Unit 3's hormone details were checked
  // against NIH StatPearls and Cleveland Clinic, since CDC and ACOG's public pages don't spell them out.
  const HEALTH = window.HEALTH = {
    u1: {
      title: "Unit 1: What is a period?",
      intro: ["Good morning, everyone! I'm Dr. Flo. For the next few weeks, health class is our unit on the menstrual cycle.", "Yes, everyone learns this. Half the world has periods. The other half should understand them."],
      slides: [
        { title: "Inside the body", body: bodyDiagram(true) + "<p class='dim'>The uterus is where the lining builds up. The ovaries hold the eggs and make hormones.</p>" },
        { title: "The uterus builds a lining", icon: "drop", body: "<p>Each cycle, hormones make the lining of the <b>uterus</b> thicker with extra blood and tissue, in case of a pregnancy.</p><p>If there's no pregnancy, the lining breaks down and flows out of the body through the vagina. That is a <b>period</b>, also called menstruation.</p><p class='dim'>Periods are a normal, healthy part of life.</p>" },
        { title: "When, and for how long?", body: "<p>Most girls get their first period between ages <b>12 and 13</b>, but some start earlier or later.</p><p>A period lasting <b>2 to 7 days</b> is normal. The total blood lost is small, about 2 to 3 tablespoons, even though it can look like more.</p>" },
        { title: "Counting the cycle", body: "<p>The <b>menstrual cycle</b> is counted from the first day of bleeding in one period to the first day of bleeding in the next.</p><p><b>Day 1</b> = the first day of bleeding.</p><p>The average cycle is about 28 days, but for teens anything from <b>21 to 45 days</b> is normal.</p>" }
      ],
      quiz: [
        { q: "What is a period?", a: ["The body getting rid of 'dirty' blood", "The lining of the uterus breaking down and leaving the body", "A sign that someone is sick"], c: 1, why: "Each cycle the lining of the uterus thickens. With no pregnancy, it breaks down and flows out. That's the period." },
        { q: "Which day is 'Day 1' of the menstrual cycle?", a: ["The first day of bleeding", "The day after a period ends", "The day of ovulation"], c: 0, why: "The cycle is counted from the first day of bleeding." },
        { q: "How long does a normal period last?", a: ["About 1 day", "About 2 weeks", "2 to 7 days"], c: 2, why: "2 to 7 days is normal. If it lasts more than 7 days, talk with a doctor." }
      ]
    },
    u2: {
      title: "Unit 2: Products and cramps",
      intro: ["Today: the practical stuff. What to use, how long to use it, and what to do about cramps."],
      slides: [
        { title: "Pads and liners", icon: "pad", body: "<p><b>Pads</b> are worn inside your underwear to soak up menstrual flow. Change them at least every <b>4 to 8 hours</b>, or whenever one feels full or wet.</p><p><b>Liners</b> are thinner, shorter pads for light days.</p><p>Wrap used ones in toilet paper and put them in the trash. Don't flush them.</p>" },
        { title: "Tampons and cups", icon: "tampon", body: "<p><b>Tampons</b> and <b>menstrual cups</b> catch the flow from inside the vagina.</p><p>Change a tampon every 4 to 8 hours, and never wear one for more than <b>8 hours</b>. Leaving a tampon in too long has been linked to <b>toxic shock syndrome (TSS)</b>, a severe illness.</p><p class='dim'>Use the lowest absorbency you need. If one tampon lasts a full 8 hours, the absorbency may be too high.</p>" },
        { title: "Cramps", icon: "cramp", body: "<p>Natural chemicals called <b>prostaglandins</b>, made in the lining of the uterus, make its muscles contract. That is a cramp.</p><p>What helps: ibuprofen or naproxen (follow the bottle), exercise, heat on your belly or lower back, and enough sleep.</p><p>If the pain doesn't go away with treatment, or you can't go to school or do your normal activities, <b>talk with a doctor</b>.</p>" }
      ],
      quiz: [
        { q: "What is the longest a tampon should stay in?", a: ["4 hours", "8 hours", "12 hours", "A full day"], c: 1, why: "Change tampons every 4 to 8 hours. Never wear one for more than 8." },
        { q: "What should you do with a used pad or tampon?", a: ["Flush it", "Wrap it and put it in the trash", "Put it in the recycling"], c: 1, why: "Wrap it in toilet paper or a tissue and toss it in a trash bin. Don't flush menstrual products." },
        { q: "What causes period cramps?", a: ["Prostaglandins making the uterus contract", "Eating too much sugar", "Not drinking enough milk"], c: 0, why: "Prostaglandins are natural chemicals made in the lining of the uterus. They make its muscles contract." }
      ]
    },
    u3: {
      title: "Unit 3: The four phases",
      intro: ["Today is my favorite lesson. Your cycle has four phases, and four hormones run the whole show."],
      slides: [
        { title: "One cycle, four phases", body: phaseDiagram() + "<p class='dim'>This is the simple version. Doctors count the follicular phase from Day 1, so it overlaps with the period. And 28 days is just the average: real cycles vary.</p>" },
        { title: "Menstrual and follicular", icon: "drop", body: "<p><b>Menstrual phase:</b> the period. Estrogen and progesterone have dropped, and the lining of the uterus sheds.</p><p><b>Follicular phase:</b> the hormone <b>FSH</b> makes follicles in the ovaries grow. <b>Estrogen</b> rises, and the lining of the uterus grows and thickens again.</p>" },
        { title: "Ovulation and luteal", body: "<p><b>Ovulation:</b> a sudden increase in the hormone <b>LH</b> makes an ovary release an egg, at about day 14 of a 28-day cycle.</p><p><b>Luteal phase:</b> <b>progesterone</b> rises to help prepare the lining of the uterus. With no pregnancy, estrogen and progesterone drop, the lining sheds, and a new cycle starts at Day 1.</p>" }
      ],
      quiz: [
        { q: "A surge of which hormone tells the ovary to release an egg?", a: ["FSH", "Progesterone", "LH"], c: 2, why: "Luteinizing hormone (LH) surges, and an ovary releases an egg." },
        { q: "What does rising estrogen do in the follicular phase?", a: ["Makes the lining of the uterus grow and thicken", "Makes the lining shed", "Stops the cycle"], c: 0, why: "As estrogen rises, the lining of the uterus grows and thickens to prepare for a possible pregnancy." },
        { q: "What is ovulation?", a: ["The last day of a period", "An ovary releasing an egg", "When cramps begin"], c: 1, why: "Ovulation is the time when an ovary releases an egg." }
      ]
    },
    u4: {
      title: "Unit 4: PMS",
      intro: ["Show of hands: who has felt tired, snacky, or grumpy for no reason before a period? There's a name for that."],
      slides: [
        { title: "What is PMS?", icon: "mood", body: "<p>Many people feel physical or mood changes in the days before a period. When that happens month after month and gets in the way of normal life, it's called <b>PMS</b> (premenstrual syndrome).</p><p>Symptoms show up in the <b>5 days before</b> a period and end within <b>4 days after</b> it starts.</p>" },
        { title: "Common symptoms", body: "<p><b>Body:</b> bloating, food cravings, breast tenderness, headache, fatigue, skin problems.</p><p><b>Mood:</b> irritability, crying spells, anxiety, trouble concentrating, wanting to be alone.</p><p class='dim'>Tracking your symptoms for 2 to 3 months helps a doctor tell if it's PMS.</p>" },
        { title: "What helps", icon: "water", body: "<p>Regular aerobic exercise. Enough sleep on a regular schedule. Smaller meals more often. Whole grains and other complex carbs. Less salt, fat, sugar and caffeine.</p><p>If symptoms are severe and cause problems with school or relationships, it could be a severe type of PMS called <b>PMDD</b>. Doctors can treat it.</p>" }
      ],
      quiz: [
        { q: "When do PMS symptoms happen?", a: ["During ovulation", "In the days before a period", "Only with a first period"], c: 1, why: "PMS symptoms show up in the 5 days before a period and end within 4 days after it starts." },
        { q: "Which of these is a common PMS symptom?", a: ["Bloating", "Hiccups", "A sore throat"], c: 0, why: "Bloating, food cravings, breast tenderness, fatigue and irritability are all common PMS symptoms." },
        { q: "Which of these can help ease PMS?", a: ["Extra salty chips", "Skipping meals", "Regular exercise"], c: 2, why: "For many people, regular aerobic exercise lessens PMS symptoms. So does cutting back on salt, fat and sugar." }
      ]
    },
    u5: {
      title: "Unit 5: Tracking, and when to get help",
      intro: ["Last lesson before the unit test. This is the one I most want you to remember in ten years."],
      slides: [
        { title: "Track your cycle", icon: "phone", body: "<p>Mark the first day of bleeding as Day 1 and keep counting until your next period. Note how heavy it is and how you feel.</p><p>If you track every month, you may notice a pattern, and it gets easier to tell when your next period will come. Doctors treat the menstrual cycle as a <b>vital sign</b>.</p>" },
        { title: "Irregular is common at first", body: "<p>Teen cycles are often <b>irregular</b>, especially in the first few years. Anything from 21 to 45 days is normal.</p><p>It may take 6 years or more after your first period for your cycle to get regular.</p>" },
        { title: "When to talk to a doctor", icon: "drop", body: "<ul class='signs'>" + WARNING_SIGNS.map((x) => "<li>" + x + "</li>").join("") + "</ul><p class='dim'>'That's just how periods are' is not always true. If something seems off, say something.</p>" }
      ],
      quiz: [
        { q: "Which of these should you see a doctor about?", a: ["A period that lasts 5 days", "Needing to change your pad every 1 to 2 hours", "Mild cramps on Day 1"], c: 1, why: "Bleeding so much that you need to change your pad or tampon every 1 to 2 hours is heavy bleeding." },
        { q: "In the first few years after a first period, cycles...", a: ["Are always exactly 28 days", "Stop during summer", "Are often irregular"], c: 2, why: "Teen cycles are often irregular. 21 to 45 days is normal, and it may take 6 years or more to get regular." },
        { q: "Why track your cycle?", a: ["To notice your pattern and predict your next period", "Because teachers grade it", "It makes periods shorter"], c: 0, why: "Tracking shows your pattern, and gives a doctor real information if something changes." }
      ]
    },
    final: {
      title: "Unit test", final: true,
      intro: ["Okay, class. One month of health class. Let's see what stuck."],
      slides: [],
      quiz: [
        { q: "1. The menstrual cycle is counted from...", a: ["The last day of one period to the last day of the next", "The first day of one period to the first day of the next", "Ovulation to ovulation"], c: 1, why: "Day 1 is the first day of bleeding. The cycle runs to the first day of bleeding of the next period." },
        { q: "2. Put the four phases in order.", a: ["Luteal, Ovulation, Menstrual, Follicular", "Menstrual, Ovulation, Follicular, Luteal", "Menstrual, Follicular, Ovulation, Luteal"], c: 2, why: "Period first, then the follicular phase, ovulation, and the luteal phase last." },
        { q: "3. A period that lasts longer than ___ days is a reason to talk with a doctor.", a: ["3", "5", "7"], c: 2, why: "2 to 7 days is normal. More than 7 is one of the warning signs." },
        { q: "4. Toxic shock syndrome (TSS) has been linked to...", a: ["Leaving a tampon in too long", "Exercising on your period", "Eating chocolate"], c: 0, why: "Change tampons every 4 to 8 hours, never wear one longer than 8, and use the lowest absorbency you need." },
        { q: "5. When does a pain reliever like ibuprofen work best for cramps?", a: ["After three days of pain", "At the first sign of your period or pain", "Only at bedtime"], c: 1, why: "NSAIDs like ibuprofen work best taken at the first sign of your period or pain. Always follow the bottle." },
        { q: "6. Which statement about teen cycles is true?", a: ["They should be exactly 28 days", "They're often irregular for the first few years", "Going 4 months without a period is nothing to mention"], c: 1, why: "Irregular is common early on. But if your period stops for more than 3 months, see a doctor." },
        { q: "7. How often should a pad be changed?", a: ["Once a day", "Only when it leaks", "At least every 4 to 8 hours, or when it feels full"], c: 2, why: "Change a pad at least every 4 to 8 hours, or whenever it seems full or feels wet." },
        { q: "8. A friend says she has to change her pad every hour, but 'that's just how periods are.' What's the best response?", a: ["Agree. Everyone's like that.", "Tell her that's worth seeing a doctor about", "Say nothing"], c: 1, why: "Needing to change a pad or tampon every 1 to 2 hours is heavy bleeding. Treatments are available." }
      ]
    }
  };

  // ---------- who is where ----------
  const MOM_WEEKDAY = { id: "mom", look: "mom", at: [[0, H(7, 50), "home", 16, 3, "down", 1], [H(15), 1440, "home", 16, 6, "down", 2]] };
  const MOM_HOME = { id: "mom", look: "mom", at: [[0, 1440, "home", 16, 3, "down", 1]] };
  const SCHOOL_DAY = [
    { id: "riyansh", look: "riyansh", at: [[H(7, 25), H(8), "school", 12, 8, "down", 2], [H(8), H(11, 10), "school", 8, 4, "up"], [H(11, 10), H(11, 50), "school", 9, 9, "right", 2], [H(11, 50), H(15), "school", 8, 4, "up"], [H(15), H(15, 40), "school", 16, 9, "down", 2]] },
    { id: "keshav", look: "keshav", at: [[H(7, 30), H(8), "school", 20, 9, "left", 2], [H(8), H(11, 10), "school", 2, 4, "up"], [H(11, 10), H(11, 50), "school", 10, 9, "left"], [H(11, 50), H(15), "school", 2, 4, "up"]] },
    { id: "patel", look: "patel", at: [[H(7), H(8), "school", 11, 3, "down", 1], [H(8), H(11, 10), "school", 22, 9, "down", 2], [H(11, 10), H(17), "school", 11, 3, "down", 1]] },
    { id: "nurse", look: "nurse", at: [[H(7), H(7, 55), "school", 16, 3, "down", 1], [H(7, 55), H(11, 10), "school", 5, 2, "down"], [H(11, 10), H(17), "school", 16, 3, "down", 1]] }
  ];
  const MART = [
    { id: "dee", look: "dee", at: [[H(8), H(21), "mart", 11, 9, "up"]] },
    { id: "lin", look: "lin", at: [[H(8), H(20), "mart", 14, 2, "down"]] }
  ];
  const ifStained = async (who, offer) => {
    if (!G().stained || G().d.hoodie) return false;
    await say(who, offer, "worried");
    G().d.hoodie = true; stat("mood", 5);
    await say("narr", "You tie it around your waist. Nobody can see a thing. (The stain's still there, so change when you can.)");
    return true;
  };


  // Grandma Okafor tells one piece of period history each time you talk to her.
  // Checked against Popular Science, "How WWI and WWII revolutionized period products":
  // https://www.popsci.com/health/period-product-history/
  const GRANNY = [
    ["hist_cloth", "Before store-bought pads", ["Before stores sold pads, most people used washable cloth rags for their periods.", "You'd wash them out and use them again. Every month."]],
    ["hist_kotex", "Where pads came from", ["In World War One, nurses noticed that cellulose bandages soaked up blood really well.", "That idea led to Kotex, the first store-bought pads that really caught on."]],
    ["hist_belt", "Sanitary belts", ["When I was your age, pads didn't stick to anything. You wore a sanitary belt around your waist, with clips to hold the pad.", "Pads with a sticky strip only came out in 1969. Be grateful for adhesive, dear!"]],
    ["hist_tampon", "The first tampons", ["Tampons with a cardboard applicator were patented in 1931.", "The company that sold them became Tampax."]],
    ["hist_cup", "The first menstrual cup", ["And menstrual cups aren't new either. An actress named Leona Chalmers patented one in 1937.", "It was made of rubber."]],
    ["hist_coupon", "Too embarrassed to ask", ["People used to be so embarrassed that one brand printed coupons you could slide across the store counter, so you never had to say 'pads' out loud.", "The clerk would hand them over wrapped in newspaper. So don't you be embarrassed, dear. It's just a period."]]
  ];

  // ---------- fallback dialogue ----------
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  window.DEFAULT_TALK = {
    mom: async () => say("mom", pick(["Drink some water, okay?", "Did you eat? You didn't eat.", "Proud of you, kiddo. Just so you know."]), "smile"),
    riyansh: async () => { if (await ifStained("riyansh", "Hey, um, quietly: there's a spot on your pants. Here, take my hoodie.")) return; return say("riyansh", pick(["Did you see the video of the cat that plays piano? It's not good. It's amazing.", "I'm going to be a doctor. Or a DJ. Still deciding.", "Want half my chips?"]), "smile"); },
    keshav: async () => say("keshav", pick(["Question: why are they called periods? Like the punctuation?", "Fun fact: the average cycle is about 28 days, but for teens anything from 21 to 45 is normal. I looked it up. For science.", "I have a debate tournament in two weeks. I'm going to destroy them. Politely."]), "neutral"),
    zach: async () => { if (await ifStained("zach", "Hey, you can borrow my team jacket. Tie it around your waist. Happens to my sisters all the time.")) return; return say("zach", pick(["Relay times are dropping! Coach is hyped.", "Hydration is a lifestyle.", "You coming to practice Thursday?"]), "smile"); },
    nurse: async () => {
      if (G().stained) { await say("nurse", "Oh, hon. I keep spare sweatpants for exactly this. Go ahead and change.", "smile"); G().stained = false; G().d.hoodie = false; stat("mood", 6); return; }
      return say("nurse", pick([
        "Reminder: a period that lasts **more than 7 days**, or soaking a pad every 1–2 hours, is worth telling a doctor about.",
        "Cramps are common. Pain bad enough that you miss school isn't something you have to just tough out.",
        "Heat, exercise and enough sleep help cramps more than people think.",
        "Never wear a tampon longer than **8 hours**. Set a phone reminder if you need to."
      ]), "neutral");
    },
    patel: async () => say("patel", pick(["The water cycle, Ruby, is the greatest story ever told.", "No running in the halls. Brisk walking is acceptable.", "Science Olympiad meets after school. You should try out."]), "smile"),
    dee: async () => say("dee", pick(["Period stuff is on the shelf at the top left. Pain relievers top right. Snacks in the middle.", "Nobody's judging. I've seen people buy way weirder things than pads.", "Pro tip: the store brand is the same thing, cheaper."]), "smile"),
    lin: async () => {
      await say("lin", "Hi there. Pharmacy questions?", "smile");
      const c = await ask("you", "...", ["When should someone see a doctor?", "What helps with cramps?", "Never mind"]);
      if (c === 0) { await say("lin", "If you need to change a pad or tampon every 1 to 2 hours, your period lasts more than 7 days, or the pain keeps you home from school, tell a parent and see a doctor.", "neutral"); await say("lin", "Those aren't things you have to live with. Doctors have treatments that help.", "smile"); }
      if (c === 1) await say("lin", "Ibuprofen helps because it reduces prostaglandins, the chemicals that make your uterus cramp. It works best at the first sign of pain. Follow the label. Heat and exercise help too.", "neutral");
    },
    coach: async () => say("coach", "Keep your streamline tight and your goggles tighter.", "neutral"),
    t1: async () => say("t1", pick(["Lovely day for a walk.", "Have you seen my cat? Orange. Judgy."]), "smile"),
    t2: async () => say("t2", pick(["Morning!", "That pond has had the same two ducks for six years."]), "smile"),
    t3: async () => {
      const g = G(); const i = g.flags.granny || 0;
      if (i === 0) await say("t3", "Oh! You're Ruby, right? I'm Grandma Okafor. I've been around long enough to remember how periods used to be. Come find me in the park and I'll tell you.", "smile");
      if (i >= GRANNY.length) return say("t3", pick(["That's all my stories, dear. Tell me what you learned in health class instead.", "Times change. A period is still just a period. Nothing to be ashamed of."]), "smile");
      const [id, title, lines] = GRANNY[i];
      for (const l of lines) await say("t3", l, "smile");
      g.flags.granny = i + 1;
      g.facts = g.facts || {};
      if (!g.facts[id]) { g.facts[id] = true; g.literacy += 1; toast(`Fact Book: ${title}`, "bulb"); }
    },
    t4: async () => say("t4", "*huff* Can't talk. *huff* Running.", "neutral")
  };

  // ---------- reusable pieces ----------
  const leaveHomeCheck = async (w) => {
    const g = G();
    if (w.to !== "town" || g.mapId !== "home" || g.time > H(9)) return;
    if (!g.d.packed) { await say("narr", "Your backpack is still on your desk. Pack it first."); return false; }
  };
  const schoolStart = { at: H(8), run: async () => { if (G().mapId !== "school") { toast("8:00! You're late for class.", "bolt", true); stat("mood", -3); } } };
  const lunch = { at: H(11, 10), run: async () => toast("Lunch! Your friends are in the hallway.", "bar") };
  const eveningMom = (lines, after) => async () => {
    const g = G();
    if (g.time < H(15)) return say("mom", "Go go go, you'll be late! School starts at 8:00.", "smile");
    if (g.d.homeTalk) return say("mom", "Bed soon, okay? Don't forget to log your day.", "smile");
    for (const [w, t, e] of lines) await say(w, typeof t === "function" ? t() : t, e);
    if (after) await after();
    g.d.homeTalk = true; g.d.sleepOK = true;
    objective("Get ready for bed (and log your day)", { map: "home", x: 1, y: 2 });
  };

  // =====================================================================
  window.CHAPTERS = [
    // ------------------------------------------------------------ DAY 1
    {
      day: 1, kicker: "A REGULAR TUESDAY", title: "Firsts",
      plan: [[420, "Wake up. Talk to Mom in the kitchen."], [450, "Pack your bag at your desk."], [480, "Health class with Dr. Flo, Room 104."], [670, "Lunch with friends in the hallway."], [900, "School's out. Corner Mart."], [null, "Home: talk to Mom, log your day, sleep."]],
      recap: ["A period is the lining of the uterus leaving the body. It is a normal, healthy part of life.", "Day 1 of the cycle is the first day of bleeding. A normal period lasts 2 to 7 days.", "Pads are the easiest product to start with. Change one at least every 4 to 8 hours."],
      think: "Who are two trusted adults you could go to if you needed a pad, or had a leak, at school?", health: HEALTH.u1, cycleStarted: false, school: true, flowDay: true,
      startTime: H(7), start: ["home", 3, 3, "down"], curfew: H(21),
      flow: (t) => !G().flags.started ? "none" : t < H(13) ? "light" : "medium",
      cramps: (t) => !G().flags.started ? 0 : t < H(13) ? 2 : 3,
      truth: { flow: ["light", "medium"], cramps: 2 },
      npcs: [MOM_WEEKDAY, ...SCHOOL_DAY, ...MART],
      canSleep: () => G().d.sleepOK || G().time >= H(20),
      async onStart() {
        await say("narr", "Tuesday. 7:00 AM. Your alarm has been going off for a while.");
        await say("you", "Five more minutes... no. Okay. Up.", "neutral");
        await card({ icon: "bag", title: "How to play", body: `<table class="keys">
          <tr><td>Arrows / WASD, or tap</td><td>Walk (tap or click a spot)</td></tr><tr><td>Space / E</td><td>Talk, use, confirm</td></tr>
          <tr><td>B</td><td>Back / close a menu</td></tr><tr><td>I</td><td>Backpack</td></tr><tr><td>P</td><td>Phone</td></tr><tr><td>H</td><td>Help</td></tr></table>
          <p class="dim">Your goal is shown at the top. A yellow arrow marks where to go.</p>` });
        objective("Say good morning to Mom in the kitchen", { npc: "mom" });
      },
      beforeWarp: async (w) => {
        const g = G();
        if (w.to === "town" && g.mapId === "home" && !g.d.kit && g.time < H(9)) { await say("mom", "Wait, wait! Before you run off, come here a sec.", "smile"); return false; }
        return leaveHomeCheck(w);
      },
      async afterPack() {
        const g = G();
        g.d.packed = true;
        if (!g.flags.started && g.time < H(9)) {
          if (bagCount("pad") + bagCount("liner") === 0) await say("narr", "No pads in your bag. Probably fine... right?");
          else await say("you", "Pads in the front pocket. Just in case. Okay.", "smile");
          objective("Walk to school. Class starts at 8:00", { map: "town", x: 26, y: 4 });
        }
      },
      onEnter: async (m) => {
        const g = G();
        if (m === "school" && g.time < H(10) && !g.d.toldSeat && !g.flags.started) { g.d.toldSeat = true; objective("Find your seat in Room 104 (top left)", { map: "school", x: 6, y: 3 }); }
      },
      triggers: [{ map: "school", x: 21, y: 2, w: 8, h: 4, when: () => G().flags.started && !G().worn && bagCount("pad") + bagCount("liner") + bagCount("tampon") === 0, run: async () => {
        await say("you", "No pads. I didn't pack any. Okay, think.", "worried");
        await say("narr", "There's a **pad dispenser** on the wall by the door (25 cents). Or **Dr. Flo** will have some. She's teaching in Room 104.");
      } }],
      events: [
        schoolStart,
        { at: H(10, 5), run: async () => {
          const g = G();
          g.flags.started = true; startCycle(); sfx.chime(); fact("firstage");
          await say("narr", g.mapId === "school" ? "Halfway through health class, you feel something weird. Kind of warm. Kind of... wet." : "Something feels weird. Kind of warm. Kind of... wet.");
          await say("you", "Wait. Is that...?", "surprised");
          await say("you", "Oh my gosh. I think I just got my period. Like, right now.", "worried");
          await card({ icon: "drop", title: "Your first period", body: `<p>Today is <b>Day 1</b> of your cycle. The <b>cycle clock</b> in the top-right now tracks your month.</p>
            <p>While you're bleeding, watch the <b>drop meter</b> on the left. With nothing on, or when your pad fills up, you'll <b>leak</b>. Change in any bathroom.</p>` });
          const c = await ask("you", "What do I do?", ["Ask Dr. Flo for the bathroom pass", "Sit very still and wait for the bell"]);
          if (c === 0) {
            await say("nurse", "Of course. Go ahead. Come find me after if you need anything.", "smile");
            objective("Get to the girls' restroom (top right)", { map: "school", x: 24, y: 6 });
          } else {
            await say("narr", "You sit very, very still. The clock does not move any faster.");
            await skip(40, "HEALTH CLASS", "You don't hear a single word of the lesson.");
            objective("Get to the girls' restroom (top right)", { map: "school", x: 24, y: 6 });
          }
        } },
        lunch,
        { at: H(11, 12), when: () => G().flags.started, run: async () => objective("Lunch until 11:50 AM: find Riyansh and Keshav in the hallway", { npc: "riyansh" }) },
        { at: H(15), run: async () => {
          const g = G();
          sfx.coin();
          await say("phone", g.d.momKnows ? "Mom: Dr. Flo called from school!! So proud of you. Sent you $15. Grab your own supplies at Corner Mart on the way home. Love you." : "Mom: Hi! Sent you $15 for snacks or whatever you need. Corner Mart is on the way home!");
          stat("money", 15);
          objective(g.flags.started ? "Buy your own period supplies at Corner Mart (open until 9:00 PM)" : "Head home", g.flags.started ? { map: "town", x: 14, y: 4 } : { map: "town", x: 5, y: 4 });
        } }
      ],
      async afterBath() {
        const g = G();
        if (g.flags.started && g.worn && !g.d.firstChange) {
          g.d.firstChange = true;
          await say("you", "Okay. Okay. I did it. That wasn't so bad.", "smile");
          if (!g.d.nurse) objective(g.time < H(11, 10) ? "Talk to Dr. Flo in Room 104 (optional), then back to your seat" : "Find Riyansh and Keshav", g.time < H(11, 10) ? { npc: "nurse" } : { npc: "riyansh" });
        }
      },
      async afterShop() {
        const g = G();
        if (g.flags.started && g.d.bought && !g.d.shopDone) { g.d.shopDone = true; await say("you", "My own supplies. I feel weirdly grown up.", "smile"); objective("Head home and talk to Mom", { npc: "mom" }); }
      },
      talk: {
        mom: async () => {
          const g = G();
          if (!g.d.kit) {
            await say("mom", "Good morning! You're up on time. Who are you and what did you do with my daughter?", "smile");
            await say("mom", "Okay, real talk for one minute. I made you something.", "neutral");
            await say("narr", "Mom puts a small zip pouch on the counter. It has tiny flowers stitched on it.");
            const c = await ask("you", "What is that?", ["A... pencil case?", "Is that a period kit?"]);
            await say("mom", c === 0 ? "Ha. Close. It's a period kit." : "It is! Look at you.", "smile");
            await say("mom", "You haven't started yet. But lots of girls start around your age, and the first one usually shows up with **zero warning**.");
            await say("mom", "I'd rather you have this and not need it. Let me show you what's inside.");
            await itemCard("pad");
            await say("mom", "Pads are the easiest to start with. Peel, stick, done. Change it every few hours.");
            await itemCard("liner");
            await say("mom", "Liners are thinner. For spotting, or the very end of your period.");
            await itemCard("tampon");
            await say("mom", "Tampons are for when you feel ready. They're what you'd use for swimming. Never more than **8 hours**.");
            await itemCard("pain");
            await say("mom", "For cramps: one of these, following the directions on the bottle. Or a heat patch on your belly.");
            await say("mom", "One more thing. If a period is ever really heavy or really painful, that's not something to just tough out. A doctor can help, and you can always tell me.");
            const c2 = await ask("you", "...", ["Thanks, Mom. Really.", "Can we never speak of this again?"]);
            if (c2 === 0) { await say("mom", "Anytime. Seriously.", "happy"); stat("mood", 5); } else await say("mom", "Ha! No promises.", "smile");
            await say("mom", "I put it all in your desk drawer. Put a couple of pads in your backpack before you go. Just in case.");
            const s = g.stash; s.pad = (s.pad || 0) + 4; s.liner = (s.liner || 0) + 6; s.tampon = (s.tampon || 0) + 2; s.pain = (s.pain || 0) + 4; s.heat = (s.heat || 0) + 1;
            g.d.kit = true;
            objective("Pack your bag at your desk", { map: "home", x: 4, y: 2 });
            return;
          }
          if (g.time < H(15)) return say("mom", g.d.packed ? "Go go go! Class starts at 8:00." : "Desk, backpack, pads. Then go!", "smile");
          if (g.d.homeTalk) return say("mom", "Bed soon, okay? And log your day on your phone.", "smile");
          if (!g.flags.started) { await say("mom", "Hey, you. How was school?", "smile"); await say("you", "Normal. Boring. Good.", "smile"); g.d.homeTalk = g.d.sleepOK = true; objective("Go to bed when you're ready", { map: "home", x: 1, y: 2 }); return; }
          if (g.d.momKnows) await say("mom", "Come here, you! How are you feeling?", "happy");
          else {
            await say("mom", "Hey, you! How was your day?", "smile");
            await ask("you", "...", ["I got my period today.", "Um. Something happened at school."]);
            await say("mom", "Today?! Are you okay? Come here.", "surprised");
          }
          await say("mom", "So? How did you handle it?");
          await say("you", g.d.leaked ? "I leaked a little. It was so embarrassing." : "I used a pad. It was okay, actually. Weird, but okay.", g.d.leaked ? "sad" : "smile");
          await say("mom", g.d.leaked ? "Oh, sweetheart. Everyone leaks. Everyone. Cold water gets the stain out. You did great." : "Look at you! Way smoother than my first one, I promise.", "smile");
          await say("mom", "Tonight, wear a fresh pad to bed. Tomorrow's usually heavier, so pack extra. And log your day before you sleep.");
          if (!g.trackerUnlocked) { g.trackerUnlocked = true; toast("Cycle Tracker app unlocked (press P)", "phone"); }
          g.d.homeTalk = g.d.sleepOK = true;
          objective("Fresh pad in the bathroom, then bed", { map: "home", x: 1, y: 2 });
        },
        riyansh: async () => {
          const g = G();
          if (await ifStained("riyansh", "Hey, um, quietly: there's a spot on your pants. Here. Take my hoodie.")) return;
          if (!g.flags.started) return say("riyansh", "Did you do the health worksheet? I did half. The fun half.", "smile");
          if (!g.d.toldR) {
            g.d.toldR = true;
            await say("riyansh", "There you are! You disappeared in the middle of class. Are you okay?", "worried");
            const c = await ask("you", "...", ["Tell him the truth", "Change the subject"]);
            if (c === 0) {
              await say("you", "I got my period. Like, my first one. In HEALTH CLASS. Of all places.", "blush");
              await say("riyansh", "Oh! Oh. Okay. Um.", "surprised");
              await say("riyansh", "Are you okay? Do you need anything? I have a granola bar. That's all I have. But it's yours.", "smile");
              give("bar", 1); stat("mood", 8);
              await say("keshav", "Wait, does it hurt? Like on a scale of one to ten? Sorry. Is that a weird question?", "neutral");
              await say("you", "Kind of a two? It's more weird than painful.", "smile");
              await say("keshav", "Huh. Health class made it sound like a horror movie.", "neutral");
            } else {
              await say("you", "Did you see the frog someone drew on the board?", "smile");
              await say("riyansh", "...Okay. But if you need anything, I'm here.", "smile");
            }
            objective("Free period: skip to 3:00 at your seat or the front doors", { map: "school", x: 14, y: 12 });
            return;
          }
          return say("riyansh", "Still okay? You can tell me if you're not.", "smile");
        },
        keshav: async () => {
          const g = G();
          if (g.flags.started && !g.d.toldR) return say("keshav", "Riyansh was looking for you. He thinks you got abducted.", "neutral");
          return DEFAULT_TALK.keshav();
        },
        nurse: async () => {
          const g = G();
          if (!g.flags.started) return say("nurse", "Morning! Nothing to patch up today, I hope.", "smile");
          if (g.d.nurse) return DEFAULT_TALK.nurse();
          g.d.nurse = true;
          await say("nurse", "Hey, Ruby. You look like you've had a morning. What's up?", "neutral");
          await ask("you", "...", ["I think I got my first period.", "Um. Girl stuff."]);
          await say("nurse", "Ahh. Okay. First: congratulations. Second: you're completely fine. This is exactly what I'm here for.", "smile");
          if (!g.worn) { await say("nurse", "Here, take some pads. The restroom is just down the hall."); give("pad", 3); }
          else { await say("nurse", "Sounds like you already handled the hard part. Take a few extra."); give("pad", 2); }
          if (g.stained) { await say("nurse", "And I keep spare sweatpants for exactly this. Go ahead and change."); g.stained = false; g.d.hoodie = false; stat("mood", 6); }
          fact("lightfirst");
          await say("nurse", "Quick facts while you're here. First periods are often light. A period usually lasts **2 to 7 days**, and for the first few years the timing can be all over the place.");
          await say("nurse", "The one thing I tell everyone: **track it**. Flow, cramps, mood. It helps you predict the next one, and if anything's ever off, a doctor will want to see it.");
          g.trackerUnlocked = true; sfx.chime(); toast("Cycle Tracker app unlocked (press P)", "phone");
          const c2 = await ask("nurse", "Want me to call your mom?", ["Yes, please.", "No, I'll tell her later."]);
          if (c2 === 0) { g.d.momKnows = true; await say("nurse", "Done. She says she's proud of you, and to text her at lunch.", "smile"); }
          else await say("nurse", "Okay. You've got this.", "smile");
          objective(g.time < H(11, 10) ? "Back to your seat in Room 104" : "Find Riyansh and Keshav", g.time < H(11, 10) ? { map: "school", x: 6, y: 3 } : { npc: "riyansh" });
        },
        dee: async () => {
          const g = G();
          if (!g.flags.started) return DEFAULT_TALK.dee();
          await say("dee", "First time buying these yourself? Don't be shy. I've worked here eleven years. I've seen it all.", "smile");
          await say("dee", "Period stuff is the top-left shelf. Pads are the easy start. If you want to swim this week, you'll want tampons too.", "smile");
        }
      },
      dream: [
        ["progesterone", "Psst. Hi. We live in your body. I'm **Progesterone**. The calm, sleepy one."],
        ["estrogen", "And I'm **ESTROGEN**! The hype friend! Today was HUGE!"],
        ["progesterone", "This month, the two of us dropped low. That's the signal for your uterus to shed its lining. That's your period."],
        ["estrogen", "Day 1 is the first day of bleeding. Now we start building back up. See you tomorrow!!"]
      ]
    },

    // ------------------------------------------------------------ DAY 2
    {
      day: 2, title: "The Heavy One",
      plan: [[410, "Change in the bathroom. Talk to Mom."], [440, "Pack for school AND swim practice."], [480, "Health class with Dr. Flo, Room 104."], [670, "Lunch with friends."], [930, "Swim practice at the Community Pool."], [null, "Home: log your day, sleep."]],
      recap: ["The first few days of a period are usually the heaviest.", "Cramps happen when chemicals called prostaglandins make the uterus contract. Heat, exercise and sleep help.", "A tampon must be changed every 4 to 8 hours, and never worn longer than 8."],
      think: "What could a friend say or do to help someone who is having a hard period day?", health: HEALTH.u2, sub: "Wednesday", school: true, flowDay: true,
      startTime: H(6, 50), start: ["home", 3, 3, "down"], curfew: H(21), cravingRate: 3,
      flow: () => "heavy",
      cramps: (t) => t < H(12) ? 6 : t < H(17) ? 5 : 4,
      truth: { flow: ["heavy"], cramps: 6 },
      npcs: [MOM_WEEKDAY, ...SCHOOL_DAY, ...MART,
        { id: "coach", look: "coach", at: [[H(15), H(18), "pool", 2, 6, "right"]] },
        { id: "zach", look: "zach", at: [[H(15), H(18), "pool", 8, 9, "up", 2]] }],
      canSleep: () => G().d.sleepOK || G().time >= H(20),
      beforeWarp: leaveHomeCheck,
      async onStart() {
        await say("you", "Ow. Okay. Cramps. And... wow. This is way heavier than yesterday.", "worried");
        await say("narr", "Your overnight pad is nearly full. The first few days of a period are usually the heaviest.");
        objective("Change in the bathroom, then talk to Mom", { map: "home", x: 11, y: 2 });
      },
      async afterBath() { const g = G(); if (!g.d.morningChange && g.time < H(8)) { g.d.morningChange = true; objective("Talk to Mom in the kitchen", { npc: "mom" }); } },
      async afterPack() {
        const g = G(); g.d.packed = true;
        if (g.time < H(9)) {
          const prods = bagCount("pad") + bagCount("tampon");
          if (prods < 3) await say("narr", `You packed ${prods} pad${prods === 1 ? "" : "s"}/tampons. On a heavy day a pad might only last about 3 hours, and you'll be out for 9 or 10.`);
          objective("Get to school by 8:00. Swim practice at the pool after school", { map: "town", x: 26, y: 4 });
        }
      },
      events: [schoolStart, lunch,
        { at: H(15), run: async () => { await say("phone", "Zach (Swim Team): RELAY PRACTICE 3:30. everyone in the water!!"); objective("Swim practice at the Community Pool", { map: "town", x: 38, y: 4 }); } }],
      talk: {
        mom: async () => {
          const g = G();
          if (g.time >= H(15)) return eveningMom([
            ["mom", "How were the cramps today?", "worried"],
            ["you", () => g.d.swam ? "Bad this morning. But swimming actually helped?" : "Bad. Like, really annoying.", "neutral"],
            ["mom", "Cramps are really common, especially days 1 and 2. But if they ever make you miss school all the time, we tell a doctor. You don't have to just tough it out.", "neutral"]
          ])();
          if (g.d.morningTalk) return say("mom", "Extra pads. Pain reliever. Swimsuit. Go!", "smile");
          g.d.morningTalk = true;
          await say("mom", "Morning, sweetheart. Day two?", "worried");
          await say("you", "Day two. Why is it so much MORE?", "worried");
          await say("mom", "The first few days are usually the heaviest. Pack more pads than you think. They fill up faster on heavy days.", "neutral");
          await say("mom", "For the cramps: I'll give you a pain reliever now, while they're just starting. Or stick on a heat patch. There are more in your drawer.", "neutral");
          await say("mom", "And you have swim practice. You can't wear a pad in the water. If you want to swim, you'd need a tampon.");
          const c = await ask("you", "...", ["Can you explain tampons again?", "I'll just sit out."]);
          if (c === 0) { await itemCard("tampon"); await say("mom", "It might take a couple of tries the first time. That's normal. Go slow and relax.", "smile"); }
          else await say("mom", "That's totally fine too. Coach Reed has seen it all.", "smile");
          objective("Pack your bag: extra pads, something for cramps, swimsuit", { map: "home", x: 4, y: 2 });
        },
        coach: async () => {
          const g = G();
          if (g.d.swamDone) return say("coach", "Nice work today. Go home and rest.", "smile");
          await say("coach", "Ruby! Ready to get in?", "smile");
          const dryland = async () => {
            await say("coach", "No problem. Dryland circuit with me. Cramps don't mean you can't move.", "smile");
            await skip(60, "DRYLAND", "Planks, squats, and stretches on the deck. Moving actually eases the cramps a bit.");
            stat("mood", 5); stat("energy", -6); fact("exercise");
          };
          if (!bagCount("swim")) { await say("coach", "No suit today?"); await dryland(); }
          else {
            const inside = g.worn && ITEMS[g.worn.id].swim;
            const c = await ask("you", "...", inside ? ["Yep. Let's swim.", "Can I do dryland today?"] : ["I'm on my period and I've got a pad on...", "Can I do dryland today?"]);
            if (inside && c === 0) {
              await skip(75, "SWIM PRACTICE", "Relay drills. Nobody can tell. And moving actually helps the cramps.");
              stat("mood", 10); stat("energy", -12); stat("health", 4); g.d.swam = true; fact("exercise");
              await say("zach", "Nice split on the last relay! Thought you were sick today?", "smile");
              await say("you", "Just cramps. I'm good.", "smile");
            } else if (c === 0) {
              await say("coach", "Ah, gotcha. You can't wear a pad in the water. A tampon or a menstrual cup would work.", "neutral"); fact("swim");
              if (have("tampon") || have("cup")) { await say("coach", "Locker room's in the back right if you want to switch. Or dryland. Your call."); objective("Change in the locker room or talk to Coach again", { map: "pool", x: 18, y: 2 }); return; }
              await dryland();
            } else await dryland();
          }
          g.d.swamDone = true;
          objective("Head home", { map: "town", x: 5, y: 4 });
        },
        nurse: async () => {
          const g = G();
          if (g.d.nurseCramps) return DEFAULT_TALK.nurse();
          g.d.nurseCramps = true;
          await say("nurse", "Ruby! Day two, right? How are we doing?", "smile");
          await say("you", "Cramps. So many cramps.", "worried");
          await say("nurse", "Cramps come from natural chemicals called **prostaglandins**, made in the lining of your uterus. They make its muscles contract.", "neutral");
          await say("nurse", "Heat, exercise, sleep, and pain relievers all help. Want a heat patch? I keep a stash.", "smile");
          give("heat", 1);
          await say("nurse", "Common is one thing. But pain bad enough to make you miss school or practice? That's worth telling a doctor about.", "neutral");
        }
      },
      dream: [
        ["estrogen", "Day 2! The first few days are usually the heaviest. You did it!"],
        ["progesterone", "The cramps? Chemicals called prostaglandins make the uterus contract. Really common."],
        ["estrogen", "But if it's ever SO bad you miss stuff, or you soak a pad every hour or two? Tell a grown-up and a doctor."],
        ["progesterone", "Also: you logged it. We love a girl who logs."]
      ]
    },

    // ------------------------------------------------------------ DAY 5
    {
      day: 5, title: "Winding Down",
      plan: [[510, "Saturday! Talk to Mom."], [660, "Meet Riyansh and Keshav at Maple Park."], [780, "Free time. Find Grandma Okafor in the park."], [1140, "Bedtime: log your day, sleep."]],
      recap: ["A normal period lasts 2 to 7 days. More than 7 days is a reason to talk with a doctor.", "Liners and period underwear are options for light days.", "Friends can talk about periods without it being weird."],
      think: "Riyansh's cousin has periods that last ten days. What should she do?", sub: "Saturday", school: false, flowDay: true,
      startTime: H(8, 30), start: ["home", 3, 3, "down"], curfew: H(21), cravingRate: 2,
      flow: (t) => t < H(13) ? "light" : "spotting",
      cramps: (t) => t < H(10) ? 1 : 0,
      truth: { flow: ["light", "spotting"], cramps: 0 },
      npcs: [MOM_HOME, ...MART,
        { id: "riyansh", look: "riyansh", at: [[H(10, 45), H(17), "town", 19, 11, "down", 2]] },
        { id: "keshav", look: "keshav", at: [[H(10, 45), H(17), "town", 21, 11, "left", 2]] }],
      canSleep: () => G().time >= H(19),
      async onStart() {
        await say("you", "Saturday. No alarm. Best day.", "happy");
        await say("phone", "Riyansh: MAPLE PARK. 11AM. by the pond. keshav is bringing a frisbee he does not know how to throw");
        objective("Talk to Mom, then meet the guys at Maple Park at 11:00 AM", { npc: "mom" });
      },
      talk: {
        mom: async () => {
          const g = G();
          if (g.d.uw) return say("mom", g.time > H(16) ? "Dinner's at seven. Go have fun until then." : "Have fun at the park!", "smile");
          g.d.uw = true;
          await say("mom", "Day five! How's it going?", "smile");
          await say("you", "Way lighter. Basically just a little bit.", "smile");
          await say("mom", "Light days are perfect for these. I got you a pair.", "smile");
          g.stash.underwear = (g.stash.underwear || 0) + 1;
          await itemCard("underwear");
          await say("mom", "And when it's just spotting, a liner is enough. You'll find what works for you.", "neutral");
          objective("11:00 AM: meet Riyansh and Keshav at Maple Park, across the road (follow the arrow)", { npc: "riyansh" });
        },
        riyansh: async () => {
          const g = G();
          if (g.d.park) return DEFAULT_TALK.riyansh();
          g.d.park = true;
          await say("riyansh", "FINALLY. Keshav has thrown the frisbee into the pond twice.", "happy");
          await say("keshav", "The wind is very unpredictable.", "neutral");
          const c = await ask("riyansh", "Wanna play or just hang?", ["Play frisbee", "Sit and talk"]);
          if (c === 0) { await skip(45, "FRISBEE", "Keshav does not improve. You laugh until your stomach hurts (the good kind)."); stat("mood", 12); stat("energy", -8); }
          else { await skip(30, "THE BENCH", "You split a bag of chips and rank every teacher at school."); stat("mood", 8); stat("cravings", -10); }
          await say("keshav", "Okay, research question. When does a period, like, end?", "neutral");
          await say("you", "Most last somewhere between **2 and 7 days**. Mine's almost done. It's day five.", "smile");
          await say("riyansh", "My cousin says hers last like ten days. Every time.", "neutral");
          const c2 = await ask("you", "...", ["That's longer than normal. She should tell a doctor.", "Huh. Everybody's different, I guess."]);
          if (c2 === 0) { await say("riyansh", "Wait, really? I'll tell her. Her mom always says it's just how it is.", "surprised"); stat("mood", 3); G().literacy += 5; toast("+5 Body Literacy", "phone"); }
          else await say("keshav", "Actually, I read that over seven days is a reason to see a doctor. Dr. Flo has a poster about it.", "neutral");
          objective("Free day! Head home by evening", { map: "town", x: 5, y: 4 });
        }
      },
      dream: [
        ["fsh", "Heyyy! I'm **FSH**, the coach! While your period wraps up, I'm already getting the next egg ready."],
        ["fsh", "I tell little sacs in your ovaries, called follicles, to start growing. As they grow, they make Estrogen..."],
        ["estrogen", "...which is ME! Get ready for some serious energy this week."]
      ]
    },

    // ------------------------------------------------------------ DAY 9
    {
      day: 9, title: "Full Battery",
      plan: [[420, "Talk to Mom, pack your bag."], [480, "Health class with Dr. Flo, Room 104."], [670, "Lunch with friends."], [915, "Science Olympiad tryouts, Room 104."], [null, "Home: log your day, sleep."]],
      recap: ["The cycle has four phases: menstrual, follicular, ovulation and luteal.", "FSH makes follicles in the ovaries grow. Estrogen makes the lining of the uterus grow and thicken.", "Teen cycles are often irregular, so it helps to keep a pad in your bag."],
      think: "Why might two people's cycles be different lengths?", health: HEALTH.u3, sub: "Monday", school: true,
      startTime: H(7), start: ["home", 3, 3, "down"], curfew: H(21), cravingRate: 1.5, energyMul: 0.7,
      flow: () => "none", cramps: () => 0,
      truth: { flow: ["none"], cramps: 0 },
      notice: "SCIENCE OLYMPIAD TRYOUTS TODAY, 3:15, ROOM 104. Talk to Mr. Patel.",
      npcs: [MOM_WEEKDAY, ...SCHOOL_DAY, ...MART],
      canSleep: () => G().d.sleepOK || G().time >= H(20),
      morning() { const s = getG().stats; s.energy = Math.max(s.energy, 92); s.mood = Math.min(100, s.mood + 10); },
      beforeWarp: leaveHomeCheck,
      async onStart() {
        await say("you", "I feel... amazing? Like I could run a marathon. Or at least walk to school fast.", "happy"); fact("energy");
        objective("Talk to Mom, then pack your bag", { npc: "mom" });
      },
      async afterPack() {
        const g = G(); g.d.packed = true;
        if (g.time < H(9)) {
          if (bagCount("pad") + bagCount("liner") + bagCount("tampon") === 0) await say("narr", "No period products in your bag. Your period's over, but early cycles can be unpredictable. Many people keep one pad in their bag just in case.");
          objective("School, then Science Olympiad tryouts at 3:15", { map: "town", x: 26, y: 4 });
        }
      },
      events: [schoolStart, lunch,
        { at: H(15, 5), run: async () => { objective("Science Olympiad tryouts: talk to Mr. Patel in Room 104", { npc: "patel" }); moveNPC("riyansh", "school", 8, 4, "up"); moveNPC("keshav", "school", 4, 4, "up"); } }],
      talk: {
        mom: async () => {
          const g = G();
          if (g.time >= H(15)) return eveningMom([["mom", "How were tryouts?!", "happy"], ["you", () => g.d.tryout === 0 ? "I made BOTH events." : "I made Anatomy with Riyansh!", "happy"], ["mom", "Of course you did. Okay, genius, log your day and bed.", "smile"]])();
          if (g.d.allowance) return say("mom", "Go crush those tryouts!", "smile");
          g.d.allowance = true;
          await say("mom", "Look at you, bouncing around. Day nine?", "smile");
          await say("you", "I have SO much energy. Is that a period thing?", "smile");
          await say("mom", "Maybe! Hormones change all through the cycle, and some people say they feel more energetic after their period. Everyone's different. Allowance day, by the way.", "smile");
          stat("money", 10);
          objective("Pack your bag at your desk", { map: "home", x: 4, y: 2 });
        },
        patel: async () => {
          const g = G();
          if (g.time < H(15)) return DEFAULT_TALK.patel();
          if (g.d.tryout !== undefined) return say("patel", "Welcome to the team, Ruby.", "smile");
          await say("patel", "Ruby! Here for tryouts? Riyansh is doing Anatomy & Physiology. Keshav is doing Disease Detectives.", "smile");
          const c = await ask("you", "...", ["I'll try out for both!", "Just Anatomy with Riyansh", "Actually, I'm going to head home"]);
          if (c === 2) { await say("patel", "No worries. Next time!", "smile"); g.d.tryout = 2; objective("Head home", { map: "town", x: 5, y: 4 }); return; }
          g.d.tryout = c;
          await skip(c === 0 ? 80 : 50, "TRYOUTS", c === 0 ? "Two tests back to back. Your brain is on fire (the good kind)." : "One test, one practice lab. Riyansh labels the femur 'big leg bone'.");
          stat("mood", c === 0 ? 12 : 8); stat("energy", c === 0 ? -15 : -6);
          await say("patel", c === 0 ? "You made both events! Ambitious." : "You and Riyansh are our new Anatomy team!", "happy");
          await say("riyansh", c === 0 ? "Of course you picked the two body ones." : "Partners! I'll handle the bones. You handle... everything else.", "happy");
          objective("Head home", { map: "town", x: 5, y: 4 });
        }
      },
      dream: [
        ["estrogen", "It's meeee! I'm rising this week and I'm rebuilding your uterus lining, nice and thick."],
        ["estrogen", "Some people say they feel extra energetic this week. Everyone is different, though!"],
        ["fsh", "Meanwhile one follicle is pulling ahead of the others. Big race coming up!"]
      ]
    },

    // ------------------------------------------------------------ DAY 14
    {
      day: 14, title: "Mid-Cycle",
      plan: [[450, "Pack your bag."], [540, "Debate tournament with Keshav, Room 104."], [720, "Free time."], [1140, "Bedtime: log your day, sleep."]],
      recap: ["Ovulation is when an ovary releases an egg. A sudden increase in the hormone LH triggers it.", "In a 28-day cycle, ovulation is about 14 days before the next period.", "Some people feel a one-sided twinge at ovulation. Clear, slippery discharge is normal too."],
      think: "What changes might someone notice in their body around the middle of the cycle?", sub: "Saturday: debate tournament", school: false,
      startTime: H(7, 30), start: ["home", 3, 3, "down"], curfew: H(21), cravingRate: 2,
      flow: () => "none", cramps: (t) => t >= H(11) && t < H(12, 30) ? 2 : 0,
      truth: { flow: ["none", "spotting"], cramps: 1 },
      board: "DEBATE TOURNAMENT · ROUND 1: 9:00 · ROUND 2: 10:30 · SEMIS: 1:00",
      npcs: [MOM_HOME, ...MART,
        { id: "keshav", look: "keshav", at: [[H(8, 30), H(15, 30), "school", 7, 4, "up"]] },
        { id: "patel", look: "patel", at: [[H(8), H(16), "school", 11, 3, "down", 1]] },
        { id: "nurse", look: "nurse", at: [[H(8, 30), H(15), "school", 16, 3, "down", 1]] }],
      canSleep: () => G().d.sleepOK || G().time >= H(19),
      beforeWarp: leaveHomeCheck,
      async onStart() {
        await say("phone", "Keshav: Tournament at school. Be in Room 104 by 9. I have prepared 14 pages of notes. You only need to read 12."); fact("discharge");
        objective("Pack your bag, then debate tournament at school (Room 104)", { map: "home", x: 4, y: 2 });
      },
      async afterPack() { const g = G(); g.d.packed = true; if (g.time < H(9, 30)) objective("Debate tournament: find Keshav in Room 104", { npc: "keshav" }); },
      events: [{ at: H(11), run: async () => {
        await say("you", "Huh. A little twinge. Low on my right side.", "surprised");
        await say("narr", "About one in five women feel a one-sided pain low in the belly around ovulation, when an egg is released. It has a name: **mittelschmerz**. It can be uncomfortable, but it isn't harmful. Just before ovulation, cervical mucus also gets thin, clear and slippery. Both are normal."); fact("egg");
      } }],
      talk: {
        mom: async () => {
          const g = G();
          if (g.time >= H(16)) return eveningMom([["mom", "So? Did you win?", "smile"], ["you", () => g.d.rounds >= 2 ? "We made SEMIS." : "We won a round!", "happy"], ["mom", "That's my girl.", "happy"]])();
          return say("mom", "Good luck today! Argue with them, not with me.", "smile");
        },
        keshav: async () => {
          const g = G();
          if (g.d.rounds === undefined) g.d.rounds = 0;
          if (g.d.rounds >= 2) { objective("Head home (or hang out in town)", { map: "town", x: 5, y: 4 }); return say("keshav", "Semifinalists! I will be framing the bracket.", "happy"); }
          await say("keshav", g.d.rounds === 0 ? "You came! Round one. Topic: should school start later. We're arguing YES." : "Round two. Topic: should phones be allowed in class. We're arguing NO. Tragic.", "neutral");
          const c = await ask("you", "How do we play it?", ["I'll lead the rebuttals.", "You lead, I'll back you up."]);
          await skip(70, g.d.rounds === 0 ? "ROUND 1" : "ROUND 2", c === 0 ? "You're sharp today. The other team keeps saying 'um'." : "Keshav talks very fast. You hand him the perfect note at the perfect moment.");
          g.d.rounds++;
          stat("mood", 8); stat("energy", c === 0 ? -8 : -4);
          await say("keshav", c === 0 ? "Remind me to never argue with you." : "Teamwork! We are unstoppable.", "happy");
          if (g.d.rounds === 2) { await say("keshav", "We made semis! That's the best our school's done in years.", "happy"); g.d.sleepOK = false; objective("Done! Head home whenever", { map: "town", x: 5, y: 4 }); }
        },
        nurse: async () => say("nurse", "Weekend tournament duty. Mostly I hand out cough drops and stop people from crying over bracket results.", "smile")
      },
      dream: [
        ["lh", "IT'S ME, **LH**!!! The dramatic one!"],
        ["lh", "When Estrogen gets high enough, I SURGE, and the ovary releases an egg. That's **ovulation**. It happened around today!"],
        ["estrogen", "It often happens around the middle of the cycle, but the exact day is different for everyone."],
        ["lh", "That twinge you felt? Might've been me! Okay, I'm exhausted. Bye!"]
      ]
    },

    // ------------------------------------------------------------ DAY 21
    {
      day: 21, title: "Slow Mode",
      plan: [[420, "Pack your bag (snacks!)."], [480, "Health class with Dr. Flo, Room 104."], [670, "Lunch with friends."], [930, "Help Dee at Corner Mart."], [null, "Home: log your day, sleep."]],
      recap: ["After ovulation, progesterone rises and helps prepare the lining of the uterus.", "PMS is a set of body and mood changes in the days before a period.", "Sleep, exercise and regular meals can help."],
      think: "What are healthy ways to take care of yourself on a low-energy day?", health: HEALTH.u4, sub: "Thursday", school: true,
      startTime: H(7), start: ["home", 3, 3, "down"], curfew: H(21, 30), cravingRate: 6, energyMul: 1.35,
      flow: () => "none", cramps: () => 0,
      truth: { flow: ["none"], cramps: 0 },
      npcs: [MOM_WEEKDAY, ...SCHOOL_DAY,
        { id: "dee", look: "dee", at: [[H(8), H(21), "mart", 11, 9, "up"]] },
        { id: "zach", look: "zach", at: [[H(15, 15), H(19), "mart", 12, 9, "up"]] },
        { id: "lin", look: "lin", at: [[H(8), H(20), "mart", 14, 2, "down"]] }],
      canSleep: () => G().d.sleepOK || G().time >= H(20, 30),
      morning() { const s = getG().stats; s.energy = Math.min(s.energy, 62); },
      beforeWarp: leaveHomeCheck,
      async onStart() {
        await say("you", "Why am I so... tired. I slept nine hours.", "sad");
        await say("narr", "In this game, the **energy** bar drains faster today and **cravings** climb. Snacks help."); fact("temp");
        objective("Pack your bag (snacks!), then school. Helping Dee at Corner Mart at 3:30", { map: "home", x: 4, y: 2 });
      },
      async afterPack() { const g = G(); g.d.packed = true; if (g.time < H(9)) objective("School, then help Dee at Corner Mart (3:30)", { map: "town", x: 26, y: 4 }); },
      events: [schoolStart, lunch,
        { at: H(15), run: async () => objective("Help out at Corner Mart: talk to Dee", { npc: "dee" }) }],
      talk: {
        mom: async () => {
          const g = G();
          if (g.time >= H(15)) return eveningMom([["mom", "You look wiped. Long day?", "worried"], ["you", "I'm SO sleepy this week. And I want to eat everything.", "sad"], ["mom", "Lots of people feel that way in the days before a period. Sleep, real food, and be nice to yourself.", "smile"]])();
          return say("mom", "Snacks are in the fridge. Take two. Take three.", "smile");
        },
        dee: async () => {
          const g = G();
          if (g.time < H(15)) return DEFAULT_TALK.dee();
          if (g.d.shift) return say("dee", "Go home, kid. You earned it.", "smile");
          g.d.shift = true;
          await say("dee", "There's my favorite helper! Your mom said you two could help me restock today. I pay in pocket money.", "smile");
          await skip(120, "HELPING AT THE MART", "Restocking granola bars. Zach narrates every box like a sports announcer.");
          stat("money", 16); stat("energy", -10);
          await say("zach", "Hey, Dee asked if one of us can stay and help for another hour.", "neutral");
          const c = await ask("you", "...", ["I'll stay. Extra money.", "I can't today. I'm wiped.", "Can we split it? Half hour each?"]);
          if (c === 0) { await skip(60, "ONE MORE HOUR", "You almost restock the chips into the freezer."); stat("money", 8); stat("energy", -15); stat("mood", -4); await say("zach", "Go sit down for a sec. You look like you're sleepwalking.", "worried"); }
          else if (c === 1) { await say("zach", "All good, I got it. Go rest.", "smile"); stat("mood", 4); }
          else { await skip(30, "HALF AN HOUR MORE", "Thirty minutes. Very doable."); stat("money", 4); stat("energy", -6); await say("zach", "Teamwork!", "smile"); }
          objective("Head home", { map: "town", x: 5, y: 4 });
        }
      },
      dream: [
        ["progesterone", "Helloooo. After ovulation, it's my turn to take over. I keep the uterus lining cozy and ready."],
        ["progesterone", "I also raise your body temperature a tiny bit. And closer to a period, lots of people notice changes in appetite and feel more tired."],
        ["estrogen", "Fatigue and food cravings are both common before a period. Snacks and naps are self-care, not laziness."]
      ]
    },

    // ------------------------------------------------------------ DAY 26
    {
      day: 26, title: "Stormy",
      plan: [[420, "Pack your bag. Your period is due soon."], [480, "Health class with Dr. Flo, Room 104."], [670, "Lunch with Riyansh and Keshav."], [900, "School's out. Free time."], [null, "Home: log your day, sleep."]],
      recap: ["PMS symptoms show up in the 5 days before a period and end within 4 days after it starts.", "Tracking your cycle helps you predict your next period.", "Some signs mean it's time to talk to a doctor, like changing a pad every 1 to 2 hours, or a period longer than 7 days."],
      think: "Mood changes are real, and so are other people's feelings. How did Ruby handle hers? What would you do?", health: HEALTH.u5, sub: "Tuesday", school: true, bloat: true,
      startTime: H(7), start: ["home", 3, 3, "down"], curfew: H(21), cravingRate: 11,
      flow: () => "none", cramps: (t) => t < H(12, 30) ? 1 : 3,
      truth: { flow: ["none"], cramps: 3 },
      npcs: [MOM_WEEKDAY, ...SCHOOL_DAY, ...MART],
      canSleep: () => G().d.sleepOK || G().time >= H(20),
      morning() { const s = getG().stats; s.mood = Math.max(30, s.mood - 22); s.cravings = Math.max(s.cravings, 55); },
      beforeWarp: leaveHomeCheck,
      async onStart() {
        await say("you", "Everything is annoying. My jeans are annoying. The SUN is annoying.", "annoyed"); fact("pms");
        if (G().trackerUnlocked) { sfx.chime(); await say("phone", "Cycle Tracker: Your next period may start in about **2 days**. Cycles can vary, especially at first. Consider packing supplies."); }
        objective("Pack your bag (period's coming soon!), then school", { map: "home", x: 4, y: 2 });
      },
      async afterPack() {
        const g = G(); g.d.packed = true;
        if (g.time < H(9)) {
          if (bagCount("pad") + bagCount("tampon") + bagCount("liner") > 0) await say("you", "Pads, just in case. Look at me, planning ahead.", "smile");
          objective("Get to school by 8:00", { map: "town", x: 26, y: 4 });
        }
      },
      events: [schoolStart, lunch,
        { at: H(11, 15), run: async () => {
          await say("narr", "In the hallway, Riyansh is sitting with Keshav. He didn't save you a seat.");
          objective("Talk to Riyansh", { npc: "riyansh" });
        } }],
      talk: {
        mom: async () => {
          const g = G();
          if (g.time >= H(15)) return eveningMom([["mom", "Rough day?", "worried"], ["you", "I don't even know why I'm upset. I just am.", "sad"], ["mom", "Right before a period, hormones drop fast, and that can make feelings feel BIG. It's real, and it passes. Want tea?", "smile"], ["you", "...Yes.", "smile"]], async () => stat("mood", 10))();
          return say("mom", "Grumpy bear. Want a hug? Okay. Go to school.", "smile");
        },
        riyansh: async () => {
          const g = G();
          if (g.time < H(11, 10) || g.time > H(11, 50) || g.d.pms) return DEFAULT_TALK.riyansh();
          g.d.pms = true;
          await say("riyansh", "Oh, hey! Sorry, Keshav grabbed the last seat.", "neutral");
          const c = await ask("you", "...", ["Seriously? You ALWAYS forget me.", "Take a breath. Tell him later it bugged you.", "Eat the snack you packed first"]);
          if (c === 0) { stat("mood", -6); await say("riyansh", "Whoa. Okay. Sorry.", "sad"); await say("narr", "Later, you both apologize. Riyansh says: 'Day 26, right? I'm learning.'"); }
          else if (c === 1) { stat("mood", 6); await say("narr", "After school you tell him it bugged you. 'My bad,' he says, and saves your seat for the rest of the week."); }
          else if (bagCount("bar") + bagCount("choc") + bagCount("chips") > 0) {
            const id = bagCount("choc") ? "choc" : bagCount("bar") ? "bar" : "chips";
            bagTake(id); stat("cravings", -30); stat("mood", 8);
            await say("you", "Okay. I was just hungry. Hi. Sorry. Scoot over.", "smile");
            await say("riyansh", "Snack-based conflict resolution. Respect.", "happy");
          } else { stat("money", -2); stat("cravings", -15); await say("narr", "No snack packed. Vending machine Hot Cheetos it is. $2 gone, but you feel human again."); }
          await say("keshav", "Is this a PMS thing? Sorry. Was that rude? I'm trying to learn.", "worried");
          await say("you", "Kind of, yeah. In the days right before a period, lots of people get bloating, cravings, and big feelings. It's called PMS.", "neutral");
          await say("keshav", "Huh. That sounds hard. Want my pudding cup?", "smile");
          stat("mood", 4);
        }
      },
      dream: [
        ["progesterone", "No pregnancy this cycle, so Estrogen and I are dropping off now..."],
        ["estrogen", "...and in the days before a period, many people get **PMS**: bloating, cravings, mood changes, feeling tired."],
        ["progesterone", "When we hit bottom, the lining sheds. A new cycle begins."],
        ["estrogen", "So... see you very soon. Like, VERY soon. Pack your bag!"]
      ]
    },

    // ------------------------------------------------------------ DAY 1 AGAIN
    {
      day: 1, title: "Here We Go Again",
      plan: [[420, "Pack your bag. Your period could start today."], [480, "Health class: the unit test."], [670, "Lunch with friends."], [940, "Maple Park with Riyansh, Keshav and Zach."], [null, "Home: talk to Mom, log your day, sleep."]],
      recap: ["The menstrual cycle repeats, and tracking helps you see the next period coming.", "Doctors treat the menstrual cycle as a vital sign of health.", "If something seems off, tell a trusted adult. 'That's just how periods are' is not always true."],
      think: "What is one thing you know now that you didn't know before you played?", health: HEALTH.final, sub: "a new cycle", school: true, flowDay: true,
      startTime: H(7), start: ["home", 3, 3, "down"], curfew: H(21), cravingRate: 4,
      flow: (t) => t < H(10, 40) ? "none" : t < H(13) ? "light" : "medium",
      flowTonight: "medium",
      cramps: (t) => t < H(10) ? 2 : 3,
      truth: { flow: ["light", "medium"], cramps: 3 },
      npcs: [MOM_WEEKDAY, ...SCHOOL_DAY, ...MART,
        { id: "zach", look: "zach", at: [[H(15, 10), H(18), "town", 21, 11, "down", 2]] },
        { id: "riyansh", look: "riyansh", at: [[H(15, 40), H(18), "town", 19, 11, "right", 1]] },
        { id: "keshav", look: "keshav", at: [[H(15, 40), H(18), "town", 21, 12, "up", 1]] }],
      canSleep: () => G().d.sleepOK || G().time >= H(20),
      beforeWarp: leaveHomeCheck,
      async onStart() {
        await say("you", "Cramps again. My tracker said it'd be about now...", "neutral");
        objective("Pack your bag. Your period could start today", { map: "home", x: 4, y: 2 });
      },
      async afterPack() { const g = G(); g.d.packed = true; if (g.time < H(9)) objective("Get to school by 8:00", { map: "town", x: 26, y: 4 }); },
      events: [schoolStart,
        { at: H(10, 40), run: async () => {
          const g = G();
          const ready = bagCount("pad") + bagCount("tampon") + bagCount("liner") + (bagCount("cup") ? 1 : 0) > 0;
          g.d.ready = ready; fact("irregular");
          await say("narr", "There it is. That feeling. Day 1, right on time.");
          if (ready) { sfx.chime(); g.literacy += 10; await say("you", "And this time I packed for it. Ha. Easy.", "happy"); toast("+10 Body Literacy: prepared!", "phone"); }
          else await say("you", "And... I didn't pack anything. Seriously? The tracker LITERALLY told me.", "worried");
          objective("Change in the girls' restroom", { map: "school", x: 24, y: 6 });
        } },
        lunch,
        { at: H(15), run: async () => { await say("phone", "Riyansh: park after school? zach's coming. keshav has a NEW frisbee"); objective("Meet everyone at Maple Park, across the road from school (until 6:00 PM)", { npc: "riyansh" }); } }],
      async afterBath() { const g = G(); if (g.time > H(10, 40) && g.worn && !g.d.changed) { g.d.changed = true; objective("Back to your seat", { map: "school", x: 6, y: 3 }); } },
      talk: {
        mom: async () => {
          const g = G();
          if (g.time >= H(15)) return eveningMom([
            ["mom", "Day 1 again?", "smile"],
            ["you", () => g.d.ready ? "Yep. And I was READY. I knew it was coming." : "Yep. I forgot to pack, but I figured it out.", "happy"],
            ["mom", "One month ago you thought I was handing you a pencil case. Now look at you.", "happy"],
            ["mom", "Keep tracking, okay? And if anything ever feels off, too heavy, too long, too painful, you tell me and we see a doctor. Deal?", "neutral"],
            ["you", "Deal.", "smile"]
          ])();
          return say("mom", "Cramps? Heat patch is in the drawer. And pack a pad, kiddo. Just in case.", "smile");
        },
        riyansh: async () => {
          const g = G();
          if (g.time < H(15, 30)) return DEFAULT_TALK.riyansh();
          if (g.d.finale) return say("riyansh", "Same time next month?", "smile");
          g.d.finale = true;
          await say("riyansh", "You made it! Okay, important question for the group.", "smile");
          await say("riyansh", "One month ago, I didn't even know Dr. Flo had pads. Now I know about **LH**.", "happy");
          await say("keshav", "I know that ovulation is about 14 days before the next period, and that the egg only survives about a day.", "neutral");
          await say("zach", "I told my sisters about cycle tracking. They said 'duh.' But then they downloaded it.", "smile");
          const c = await ask("you", "...", ["Teach them one more thing", "Just enjoy the afternoon"]);
          if (c === 0) { await say("you", "Okay, last lesson. Doctors treat periods like a vital sign. If something changes, like it gets way heavier or lasts more than 7 days, that's worth telling a doctor.", "smile"); await say("keshav", "Vital sign. Writing that down.", "neutral"); g.literacy += 5; }
          await skip(40, "THE PARK", "Keshav's new frisbee also ends up in the pond. Some things never change.");
          stat("mood", 12);
          objective("Head home and talk to Mom", { npc: "mom" });
        }
      },
      night: async () => { await say("narr", "You set your phone down. Twenty-eight days. Four phases. One surprise. A lot of learning."); }
    }
  ];
})();
