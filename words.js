// Indraveer Typing Practice — word bank (static file)
// This file intentionally contains ONLY the word data + a tiny builder.
// It exposes the final list as: window.WORDS (>= 1000 words).

(() => {
  'use strict';

  // Base lists (lowercase). Words are separated by whitespace for compactness.
  const VERBS = `accept access achieve acquire act adapt add address admit advise affect agree allow announce answer apply approve arrange arrive ask assess assign assist assume attach attempt attend avoid balance base begin behave believe belong benefit break bring build buy calculate call capture carry change check choose clean clear close collect combine come compare complete compute consider contain continue control convert copy correct count create cross cut decide declare define deliver demand deny describe design develop differ direct discover discuss display distribute divide do draw earn edit enable encourage end enjoy ensure enter establish estimate evaluate examine exceed exchange explain extend face fail fall feed feel fill find finish fix follow form gain generate get give go govern grow handle happen have help hold identify ignore imagine improve include increase indicate inform initiate insert inspect instruct intend introduce issue join keep know learn leave limit listen live locate look lose make manage mark measure meet mention merge move need note obtain offer open operate organise organize overcome pass pay perform permit plan play prepare present prevent print proceed produce protect prove provide publish pull push put raise reach read realize receive record reduce refer reflect refuse register relate release remain remember remove replace reply report require resolve respond rest return review rise run save say schedule search see select send serve set share show simplify solve sort speak start stop study submit succeed suggest support take talk teach tell test think throw trace train transfer translate travel try turn type understand update use validate verify wait walk want watch win work write`.trim().split(/\s+/);
  const NOUNS = `ability access account action activity addition address advantage advice agency agreement aim allowance amount analysis answer application approval area argument arrangement aspect assessment assignment attention authority average balance bank base benefit block board body bonus budget business candidate capacity capital case category cause centre challenge change chapter choice citizen city class clause client code committee company comparison competition condition confidence constitution context contract control country court culture customer data date decision degree demand department detail development device difference difficulty direction discipline discovery discussion district document economy education effect effort election employee energy environment equipment error estimate ethics exam example exercise experience fact factor feature finance force form formula freedom function fund government grammar growth habit health history idea impact income index industry inflation information initiative input instruction instrument interest interview issue judge judgement knowledge language law leader level limit loan market meaning measure method minute model money month nation nature network number object office option order organisation organization output paper paragraph pattern people period plan policy population practice pressure price principle problem process product program programme progress project proof quality question rate reason record reform region regulation report request resource result revenue risk rule sample scheme science section sentence service society solution source speed standard state statement status strategy structure subject success summary system task tax teacher technology test time topic training transport truth union unit value view vote wage work worker year`.trim().split(/\s+/);
  const ADJECTIVES = `able absolute academic accurate active actual additional adequate administrative advanced adverse aware basic brief broad careful central certain civil clear common complete complex confident consistent constitutional correct current daily decisive deep direct different difficult digital domestic due economic effective efficient equal essential ethical exact external fair final financial formal frequent full general global good great high honest human important independent individual industrial internal international large legal limited local logical main major modern national natural necessary normal official open ordinary overall particular permanent personal physical political possible practical primary private professional public quick ready recent regular relevant reliable responsible right rural safe same scientific serious significant simple social special specific stable strong successful sufficient sure technical temporary theoretical timely true typical useful valid various visual wide willing written`.trim().split(/\s+/);

  const VOWELS = new Set(['a','e','i','o','u']);

  const thirdIrregular = {
    be: 'is',
    have: 'has',
    do: 'does',
    go: 'goes',
  };

  const pastIrregular = {
    be: 'was',
    begin: 'began',
    break: 'broke',
    bring: 'brought',
    build: 'built',
    buy: 'bought',
    choose: 'chose',
    come: 'came',
    do: 'did',
    draw: 'drew',
    fall: 'fell',
    feel: 'felt',
    find: 'found',
    get: 'got',
    give: 'gave',
    go: 'went',
    have: 'had',
    hold: 'held',
    keep: 'kept',
    know: 'knew',
    leave: 'left',
    lose: 'lost',
    make: 'made',
    meet: 'met',
    pay: 'paid',
    read: 'read',
    run: 'ran',
    say: 'said',
    see: 'saw',
    send: 'sent',
    speak: 'spoke',
    take: 'took',
    teach: 'taught',
    tell: 'told',
    think: 'thought',
    understand: 'understood',
    win: 'won',
    write: 'wrote',
  };

  const ingIrregular = {
    be: 'being',
    die: 'dying',
    lie: 'lying',
    tie: 'tying',
  };

  // Small, safe set for doubling final consonant (to avoid wrong forms like "openning").
  const DOUBLE_VERBS = new Set([
    'stop','plan','drop','slip','skip','grab','submit','permit','commit','prefer'
  ]);

  function pluralize(word) {
    if (word.length >= 2 && word.endsWith('y') && !VOWELS.has(word[word.length - 2])) {
      return word.slice(0, -1) + 'ies';
    }
    if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z') || word.endsWith('ch') || word.endsWith('sh')) {
      return word + 'es';
    }
    return word + 's';
  }

  function thirdPerson(verb) {
    return thirdIrregular[verb] || pluralize(verb);
  }

  function pastTense(verb) {
    if (pastIrregular[verb]) return pastIrregular[verb];

    if (DOUBLE_VERBS.has(verb)) {
      const last = verb[verb.length - 1];
      return verb + last + 'ed';
    }

    if (verb.endsWith('e')) return verb + 'd';

    if (verb.length >= 2 && verb.endsWith('y') && !VOWELS.has(verb[verb.length - 2])) {
      return verb.slice(0, -1) + 'ied';
    }

    return verb + 'ed';
  }

  function ingForm(verb) {
    if (ingIrregular[verb]) return ingIrregular[verb];

    if (DOUBLE_VERBS.has(verb)) {
      const last = verb[verb.length - 1];
      return verb + last + 'ing';
    }

    if (verb.endsWith('ie')) return verb.slice(0, -2) + 'ying';
    if (verb.endsWith('e') && !verb.endsWith('ee')) return verb.slice(0, -1) + 'ing';

    return verb + 'ing';
  }

  function buildWordBank() {
    const out = [];
    const seen = new Set();

    const push = (w) => {
      if (!w) return;
      const word = String(w).toLowerCase();
      if (!seen.has(word)) {
        seen.add(word);
        out.push(word);
      }
    };

    // Core words
    VERBS.forEach(push);
    NOUNS.forEach(push);
    ADJECTIVES.forEach(push);

    // Verb forms (gives a lot of extra variety)
    for (const v of VERBS) {
      push(thirdPerson(v));
      push(pastTense(v));
      push(ingForm(v));
    }

    // Plurals for nouns
    for (const n of NOUNS) {
      push(pluralize(n));
    }

    return out;
  }

  const WORDS = buildWordBank();

  // Safety: guarantee size (your requirement: at least 1000 words).
  if (WORDS.length < 1000) {
    console.warn('[Indraveer Typing Practice] WORDS size is below 1000:', WORDS.length);
  }

  // Expose globally for the HTML page (no bundler needed).
  window.WORDS = WORDS;
  window.INDRAVEER_WORDS_META = Object.freeze({
    count: WORDS.length,
    verbs: VERBS.length,
    nouns: NOUNS.length,
    adjectives: ADJECTIVES.length,
  });
})();
