/**
 * Shared category resolution rules — used by both the feed importer
 * (scripts/import-runner.ts, app/api/cron/import-feed/route.ts) AND
 * the recategorize runner (scripts/recategorize-runner.ts).
 *
 * Keep this file framework-agnostic (no Prisma, no Next) so it can be
 * imported from standalone tsx scripts as well as server code.
 */

// ═══════════════════════════════════════════════════════════════════
// CATEGORY_MAP — keyword → full category path (root → … → leaf).
// Order matters: more specific rules must come FIRST.
// ═══════════════════════════════════════════════════════════════════

export interface CategoryRule {
  pattern: string;
  path: string[];
  name: string;
}

export const CATEGORY_MAP: CategoryRule[] = [
  // ── Nischen- & Luxusparfums (matched BEFORE generic parfum block) ─
  // Brand-specific patterns have to win over the generic "fragrance"
  // / "eau de parfum" rules below, otherwise Tom Ford, Creed, Byredo &
  // co. would all fall into the flat `parfum` root. Recategorize relies
  // on this order: resolveCategoryForExisting returns on first hit.
  { pattern: "tom ford",                 path: ["parfum", "parfum-nische"], name: "Tom Ford" },
  { pattern: "creed ",                   path: ["parfum", "parfum-nische"], name: "Creed" },
  { pattern: "byredo",                   path: ["parfum", "parfum-nische"], name: "Byredo" },
  { pattern: "le labo",                  path: ["parfum", "parfum-nische"], name: "Le Labo" },
  { pattern: "diptyque",                 path: ["parfum", "parfum-nische"], name: "Diptyque" },
  { pattern: "maison francis kurkdjian", path: ["parfum", "parfum-nische"], name: "Maison Francis Kurkdjian" },
  { pattern: "memo paris",               path: ["parfum", "parfum-nische"], name: "Memo Paris" },
  { pattern: "penhaligon",               path: ["parfum", "parfum-nische"], name: "Penhaligon's" },
  { pattern: "serge lutens",             path: ["parfum", "parfum-nische"], name: "Serge Lutens" },
  { pattern: "frederic malle",           path: ["parfum", "parfum-nische"], name: "Frederic Malle" },
  { pattern: "roja parfums",             path: ["parfum", "parfum-nische"], name: "Roja" },
  { pattern: "amouage",                  path: ["parfum", "parfum-nische"], name: "Amouage" },
  { pattern: "parfums de marly",         path: ["parfum", "parfum-nische"], name: "Parfums de Marly" },
  { pattern: "clive christian",          path: ["parfum", "parfum-nische"], name: "Clive Christian" },
  { pattern: "xerjoff",                  path: ["parfum", "parfum-nische"], name: "Xerjoff" },
  { pattern: "nasomatto",                path: ["parfum", "parfum-nische"], name: "Nasomatto" },
  { pattern: "orto parisi",              path: ["parfum", "parfum-nische"], name: "Orto Parisi" },
  { pattern: "initio parfums",           path: ["parfum", "parfum-nische"], name: "Initio" },
  { pattern: "nishane",                  path: ["parfum", "parfum-nische"], name: "Nishane" },
  { pattern: "montale",                  path: ["parfum", "parfum-nische"], name: "Montale" },
  { pattern: "mancera",                  path: ["parfum", "parfum-nische"], name: "Mancera" },

  // ── Parfum (generic) ─────────────────────────────────────────
  { pattern: "men's fragrance",   path: ["parfum", "herrendufte"],   name: "Herrendüfte" },
  { pattern: "men's eau de",      path: ["parfum", "herrendufte"],   name: "Herrendüfte" },
  { pattern: "aftershave",        path: ["parfum", "herrendufte"],   name: "Herrendüfte" },
  { pattern: "cologne",           path: ["parfum", "herrendufte"],   name: "Herrendüfte" },
  { pattern: "women's fragrance", path: ["parfum", "damendufte"],    name: "Damendüfte" },
  { pattern: "women's eau de",    path: ["parfum", "damendufte"],    name: "Damendüfte" },
  { pattern: "unisex fragrance",  path: ["parfum", "unisex-dufte"],  name: "Unisex" },
  { pattern: "unisex eau de",     path: ["parfum", "unisex-dufte"],  name: "Unisex" },
  { pattern: "fragrance",         path: ["parfum"],                  name: "Parfum & Düfte" },
  { pattern: "perfume",           path: ["parfum"],                  name: "Parfum & Düfte" },
  { pattern: "eau de parfum",     path: ["parfum"],                  name: "Parfum & Düfte" },
  { pattern: "eau de toilette",   path: ["parfum"],                  name: "Parfum & Düfte" },
  { pattern: "skin care",         path: ["parfum", "pflege"],        name: "Pflege" },
  { pattern: "skincare",          path: ["parfum", "pflege"],        name: "Pflege" },
  { pattern: "face care",         path: ["parfum", "pflege"],        name: "Pflege" },
  { pattern: "body care",         path: ["parfum", "pflege"],        name: "Pflege" },
  { pattern: "moisturi",          path: ["parfum", "pflege"],        name: "Pflege" },
  { pattern: "serum",             path: ["parfum", "pflege"],        name: "Pflege" },
  { pattern: "cleanser",          path: ["parfum", "pflege"],        name: "Pflege" },
  { pattern: "make up",           path: ["parfum", "make-up"],       name: "Make-Up" },
  { pattern: "makeup",            path: ["parfum", "make-up"],       name: "Make-Up" },
  { pattern: "cosmetic",          path: ["parfum", "make-up"],       name: "Make-Up" },
  { pattern: "lipstick",          path: ["parfum", "make-up"],       name: "Make-Up" },
  { pattern: "mascara",           path: ["parfum", "make-up"],       name: "Make-Up" },
  { pattern: "foundation",        path: ["parfum", "make-up"],       name: "Make-Up" },
  { pattern: "hair care",         path: ["parfum", "haarpflege"],    name: "Haarpflege" },
  { pattern: "hair",              path: ["parfum", "haarpflege"],    name: "Haarpflege" },
  { pattern: "shampoo",           path: ["parfum", "haarpflege"],    name: "Haarpflege" },
  { pattern: "conditioner",       path: ["parfum", "haarpflege"],    name: "Haarpflege" },
  { pattern: "bath",              path: ["parfum", "koerperpflege"], name: "Körperpflege" },
  { pattern: "shower",            path: ["parfum", "koerperpflege"], name: "Körperpflege" },
  { pattern: "body",              path: ["parfum", "koerperpflege"], name: "Körperpflege" },
  { pattern: "deodorant",         path: ["parfum", "koerperpflege"], name: "Körperpflege" },
  { pattern: "gift set",          path: ["parfum", "geschenksets"],  name: "Geschenksets" },
  { pattern: "gift",              path: ["parfum", "geschenksets"],  name: "Geschenksets" },
  { pattern: "sun",               path: ["parfum", "sonnenpflege"],  name: "Sonnenpflege" },
  { pattern: "spf",               path: ["parfum", "sonnenpflege"],  name: "Sonnenpflege" },

  // ── Schuhe (with brand L3) ───────────────────────────────────
  { pattern: "nike air",      path: ["schuhe", "schuhe-sneakers", "sneakers-nike"],       name: "Nike Sneakers" },
  { pattern: "jordan",        path: ["schuhe", "schuhe-sneakers", "sneakers-nike"],       name: "Nike Jordan" },
  { pattern: "nike dunk",     path: ["schuhe", "schuhe-sneakers", "sneakers-nike"],       name: "Nike Sneakers" },
  { pattern: "nike pegasus",  path: ["schuhe", "schuhe-sneakers", "sneakers-nike"],       name: "Nike Pegasus" },
  { pattern: "nike ",         path: ["schuhe", "schuhe-sneakers", "sneakers-nike"],       name: "Nike" },
  { pattern: "adidas",        path: ["schuhe", "schuhe-sneakers", "sneakers-adidas"],     name: "Adidas" },
  { pattern: "new balance",   path: ["schuhe", "schuhe-sneakers", "sneakers-newbalance"], name: "New Balance" },
  { pattern: "on cloud",      path: ["schuhe", "schuhe-sneakers", "sneakers-onrunning"],  name: "On Running" },
  { pattern: "on running",    path: ["schuhe", "schuhe-sneakers", "sneakers-onrunning"],  name: "On Running" },
  { pattern: "puma ",         path: ["schuhe", "schuhe-sneakers", "sneakers-puma"],       name: "Puma" },
  { pattern: "asics",         path: ["schuhe", "schuhe-sneakers", "sneakers-asics"],      name: "Asics" },
  { pattern: "hoka ",         path: ["schuhe", "schuhe-sneakers", "sneakers-hoka"],       name: "Hoka" },
  { pattern: "salomon",       path: ["schuhe", "schuhe-sneakers", "sneakers-salomon"],    name: "Salomon" },
  { pattern: "reebok",        path: ["schuhe", "schuhe-sneakers"],                        name: "Sneakers" },
  { pattern: "converse",      path: ["schuhe", "schuhe-sneakers"],                        name: "Sneakers" },
  { pattern: "vans ",         path: ["schuhe", "schuhe-sneakers"],                        name: "Sneakers" },
  { pattern: "saucony",       path: ["schuhe", "schuhe-sneakers"],                        name: "Sneakers" },
  { pattern: "mizuno",        path: ["schuhe", "schuhe-sneakers"],                        name: "Sneakers" },
  { pattern: "brooks ",       path: ["schuhe", "schuhe-sneakers"],                        name: "Sneakers" },
  { pattern: "sneaker",       path: ["schuhe", "schuhe-sneakers"],                        name: "Sneakers" },
  { pattern: "trailrunning",  path: ["sport", "sport-running"],                           name: "Trailrunning" },
  { pattern: "running shoe",  path: ["schuhe", "schuhe-laufschuhe"],                      name: "Laufschuhe" },
  { pattern: "laufschuh",     path: ["schuhe", "schuhe-laufschuhe"],                      name: "Laufschuhe" },
  { pattern: "hiking shoe",   path: ["schuhe", "schuhe-wandern"],                         name: "Wanderschuhe" },
  { pattern: "trail shoe",    path: ["schuhe", "schuhe-wandern"],                         name: "Wanderschuhe" },
  { pattern: "training shoe", path: ["schuhe", "schuhe-laufschuhe"],                      name: "Laufschuhe" },
  { pattern: "wanderschuh",   path: ["schuhe", "schuhe-wandern"],                         name: "Wanderschuhe" },
  { pattern: "footwear",      path: ["schuhe"],                                           name: "Schuhe" },
  { pattern: "shoes",         path: ["schuhe"],                                           name: "Schuhe" },
  { pattern: "schuhe",        path: ["schuhe"],                                           name: "Schuhe" },
  { pattern: "stiefel",       path: ["schuhe"],                                           name: "Schuhe" },
  { pattern: "sandalen",      path: ["schuhe"],                                           name: "Schuhe" },
  { pattern: "sandals",       path: ["schuhe"],                                           name: "Schuhe" },
  { pattern: "boots",         path: ["schuhe"],                                           name: "Schuhe" },

  // ── Outdoor / Wandern / Klettern / Ski ──────────────────────
  // Bergfreunde-heavy block. Placed AFTER Schuhe so shoe-specific
  // keywords ("wanderschuh", "trail shoe") still win for outdoor
  // brands that also sell footwear, and BEFORE Mode so brand-specific
  // apparel (Mammut hoodie, Patagonia jacket) doesn't leak into the
  // generic `mode` bucket via "jacke" / "hoodie" / "pullover".
  //
  // Shoe-leaning brands → schuhe-wandern
  { pattern: "la sportiva",       path: ["schuhe", "schuhe-wandern"], name: "La Sportiva" },
  { pattern: "scarpa",            path: ["schuhe", "schuhe-wandern"], name: "Scarpa" },
  { pattern: "lowa ",             path: ["schuhe", "schuhe-wandern"], name: "Lowa" },
  { pattern: "meindl",            path: ["schuhe", "schuhe-wandern"], name: "Meindl" },
  { pattern: "hanwag",            path: ["schuhe", "schuhe-wandern"], name: "Hanwag" },
  { pattern: "merrell",           path: ["schuhe", "schuhe-wandern"], name: "Merrell" },
  { pattern: "keen ",             path: ["schuhe", "schuhe-wandern"], name: "Keen" },
  // Ski-touring specialists → sport-ski
  { pattern: "dynafit",           path: ["sport", "sport-ski"],      name: "Dynafit" },
  { pattern: "völkl",             path: ["sport", "sport-ski"],      name: "Völkl" },
  { pattern: "voelkl",            path: ["sport", "sport-ski"],      name: "Völkl" },
  { pattern: "k2 ski",            path: ["sport", "sport-ski"],      name: "K2" },
  // Camping-first brands → sport-camping
  { pattern: "msr ",              path: ["sport", "sport-camping"],  name: "MSR" },
  { pattern: "hilleberg",         path: ["sport", "sport-camping"],  name: "Hilleberg" },
  { pattern: "exped",             path: ["sport", "sport-camping"],  name: "Exped" },
  // Generic outdoor / trekking gear → sport-wandern
  { pattern: "mammut",            path: ["sport", "sport-wandern"],  name: "Mammut" },
  { pattern: "patagonia",         path: ["sport", "sport-wandern"],  name: "Patagonia" },
  { pattern: "the north face",    path: ["sport", "sport-wandern"],  name: "The North Face" },
  { pattern: "north face",        path: ["sport", "sport-wandern"],  name: "The North Face" },
  { pattern: "arc'teryx",         path: ["sport", "sport-wandern"],  name: "Arc'teryx" },
  { pattern: "arcteryx",          path: ["sport", "sport-wandern"],  name: "Arc'teryx" },
  { pattern: "fjällräven",        path: ["sport", "sport-wandern"],  name: "Fjällräven" },
  { pattern: "fjallraven",        path: ["sport", "sport-wandern"],  name: "Fjällräven" },
  { pattern: "deuter",            path: ["sport", "sport-wandern"],  name: "Deuter" },
  { pattern: "osprey",            path: ["sport", "sport-wandern"],  name: "Osprey" },
  { pattern: "haglöfs",           path: ["sport", "sport-wandern"],  name: "Haglöfs" },
  { pattern: "haglofs",           path: ["sport", "sport-wandern"],  name: "Haglöfs" },
  { pattern: "vaude",             path: ["sport", "sport-wandern"],  name: "Vaude" },
  { pattern: "jack wolfskin",     path: ["sport", "sport-wandern"],  name: "Jack Wolfskin" },
  { pattern: "marmot",            path: ["sport", "sport-wandern"],  name: "Marmot" },
  { pattern: "columbia",          path: ["sport", "sport-wandern"],  name: "Columbia" },
  { pattern: "rab ",              path: ["sport", "sport-wandern"],  name: "Rab" },
  { pattern: "mountain equipment",path: ["sport", "sport-wandern"],  name: "Mountain Equipment" },
  { pattern: "helly hansen",      path: ["sport", "sport-wandern"],  name: "Helly Hansen" },
  { pattern: "icebreaker",        path: ["sport", "sport-wandern"],  name: "Icebreaker" },
  { pattern: "ortovox",           path: ["sport", "sport-wandern"],  name: "Ortovox" },
  { pattern: "black diamond",     path: ["sport", "sport-klettern"], name: "Black Diamond" },
  { pattern: "petzl",             path: ["sport", "sport-klettern"], name: "Petzl" },
  { pattern: "edelrid",           path: ["sport", "sport-klettern"], name: "Edelrid" },
  { pattern: "leki ",             path: ["sport", "sport-wandern"],  name: "Leki" },
  { pattern: "thermarest",        path: ["sport", "sport-wandern"],  name: "Therm-a-Rest" },
  { pattern: "therm-a-rest",      path: ["sport", "sport-wandern"],  name: "Therm-a-Rest" },
  // Generic outdoor nouns — last-resort category hints
  { pattern: "kletterseil",       path: ["sport", "sport-klettern"], name: "Kletterausrüstung" },
  { pattern: "klettergurt",       path: ["sport", "sport-klettern"], name: "Kletterausrüstung" },
  { pattern: "karabiner",         path: ["sport", "sport-klettern"], name: "Kletterausrüstung" },
  { pattern: "steigeisen",        path: ["sport", "sport-klettern"], name: "Kletterausrüstung" },
  { pattern: "trekkingstock",     path: ["sport", "sport-wandern"],  name: "Trekkingstöcke" },
  { pattern: "wanderstock",       path: ["sport", "sport-wandern"],  name: "Trekkingstöcke" },
  { pattern: "schlafsack",        path: ["sport", "sport-wandern"],  name: "Schlafsack" },
  { pattern: "wanderrucksack",    path: ["sport", "sport-wandern"],  name: "Wanderrucksack" },
  { pattern: "trekkingrucksack",  path: ["sport", "sport-wandern"],  name: "Trekkingrucksack" },
  { pattern: "zelt",              path: ["sport", "sport-camping"],  name: "Zelt" },
  { pattern: "isomatte",          path: ["sport", "sport-camping"],  name: "Isomatte" },
  { pattern: "camping",           path: ["sport", "sport-camping"],  name: "Camping" },

  // ── Premium Fashion ─────────────────────────────────────────
  // Placed BEFORE the generic Mode block + AFTER the Parfum /
  // Outdoor blocks so brand-ambiguous fragrances ("Hugo Boss EDT",
  // "Calvin Klein Obsession") still match the parfum rules higher
  // up in the file. Brand-only hits land on `mode` root or a
  // gender-leaning sub when the catalogue skew is strong enough.
  { pattern: "hugo boss",         path: ["mode", "mode-herren"], name: "Hugo Boss" },
  { pattern: "boss orange",       path: ["mode", "mode-herren"], name: "Boss Orange" },
  { pattern: "boss hugo",         path: ["mode", "mode-herren"], name: "Hugo Boss" },
  { pattern: "boss ",             path: ["mode", "mode-herren"], name: "Boss" },
  { pattern: "polo ralph lauren", path: ["mode", "mode-herren"], name: "Polo Ralph Lauren" },
  { pattern: "ralph lauren",      path: ["mode"],                name: "Ralph Lauren" },
  { pattern: "gant ",             path: ["mode", "mode-herren"], name: "Gant" },
  { pattern: "tommy hilfiger",    path: ["mode"],                name: "Tommy Hilfiger" },
  { pattern: "tommy jeans",       path: ["mode"],                name: "Tommy Jeans" },
  { pattern: "lacoste",           path: ["mode"],                name: "Lacoste" },
  // Calvin Klein / Armani: fragrance rules higher up win for EDP/EDT
  // titles; these patterns only fire when the haystack carries fashion
  // context (jeans, underwear, knit, etc. — all un-matched by parfum).
  { pattern: "calvin klein jeans",path: ["mode"],                name: "Calvin Klein Jeans" },
  { pattern: "ck jeans",          path: ["mode"],                name: "Calvin Klein" },
  { pattern: "michael kors",      path: ["mode", "mode-damen"],  name: "Michael Kors" },
  { pattern: "giorgio armani",    path: ["mode"],                name: "Giorgio Armani" },
  { pattern: "emporio armani",    path: ["mode"],                name: "Emporio Armani" },
  { pattern: "armani jeans",      path: ["mode"],                name: "Armani Jeans" },
  { pattern: "armani exchange",   path: ["mode"],                name: "Armani Exchange" },
  { pattern: "bogner",            path: ["mode"],                name: "Bogner" },

  // ── Mode ────────────────────────────────────────────────────
  // Gendered product-type signals take precedence (e.g. "Damenkleid"
  // → mode-damen/damen-kleider), then neutral product types fall
  // back to the mode root. Sequence: feminine L3, masculine L3,
  // generic buckets.
  { pattern: "damenkleid",       path: ["mode", "mode-damen", "damen-kleider"],     name: "Damenkleider" },
  { pattern: "abendkleid",       path: ["mode", "mode-damen", "damen-kleider"],     name: "Abendkleider" },
  { pattern: "sommerkleid",      path: ["mode", "mode-damen", "damen-kleider"],     name: "Sommerkleider" },
  { pattern: "kleid",            path: ["mode", "mode-damen", "damen-kleider"],     name: "Kleider" },
  { pattern: "damenbluse",       path: ["mode", "mode-damen", "damen-oberteile"],   name: "Blusen" },
  { pattern: "bluse",            path: ["mode", "mode-damen", "damen-oberteile"],   name: "Blusen" },
  { pattern: "damenhose",        path: ["mode", "mode-damen", "damen-hosen"],       name: "Damenhosen" },
  { pattern: "rock ",            path: ["mode", "mode-damen", "damen-roecke"],      name: "Röcke" },
  { pattern: "minirock",         path: ["mode", "mode-damen", "damen-roecke"],      name: "Röcke" },
  { pattern: "damenjacke",       path: ["mode", "mode-damen", "damen-jacken"],      name: "Damenjacken" },
  { pattern: "damenmantel",      path: ["mode", "mode-damen", "damen-jacken"],      name: "Damenmäntel" },
  { pattern: "damenpullover",    path: ["mode", "mode-damen", "damen-strick"],      name: "Damenpullover" },
  { pattern: "strickjacke",      path: ["mode", "mode-damen", "damen-strick"],      name: "Strick" },
  { pattern: "bademode",         path: ["mode", "mode-damen", "damen-unterwaesche"],name: "Bademode" },
  { pattern: "bikini",           path: ["mode", "mode-damen", "damen-unterwaesche"],name: "Bikini" },
  { pattern: "damenmode",        path: ["mode", "mode-damen"],                      name: "Damenmode" },

  { pattern: "herrenhemd",       path: ["mode", "mode-herren", "herren-hemden"],    name: "Herrenhemden" },
  { pattern: "hemd ",            path: ["mode", "mode-herren", "herren-hemden"],    name: "Hemden" },
  { pattern: "polo shirt",       path: ["mode", "mode-herren", "herren-tshirts"],   name: "Polo Shirts" },
  { pattern: "herrenhose",       path: ["mode", "mode-herren", "herren-hosen"],     name: "Herrenhosen" },
  { pattern: "anzug",            path: ["mode", "mode-herren", "herren-anzuege"],   name: "Anzüge" },
  { pattern: "sakko",            path: ["mode", "mode-herren", "herren-anzuege"],   name: "Sakkos" },
  { pattern: "blazer",           path: ["mode", "mode-herren", "herren-anzuege"],   name: "Blazer" },
  { pattern: "herrenjacke",      path: ["mode", "mode-herren", "herren-jacken"],    name: "Herrenjacken" },
  { pattern: "herrenmantel",     path: ["mode", "mode-herren", "herren-jacken"],    name: "Herrenmäntel" },
  { pattern: "herrenpullover",   path: ["mode", "mode-herren", "herren-strick"],    name: "Herrenpullover" },
  { pattern: "krawatte",         path: ["mode", "mode-herren", "herren-unterwaesche"], name: "Krawatten" },
  { pattern: "herrenmode",       path: ["mode", "mode-herren"],                     name: "Herrenmode" },

  { pattern: "kindermode",       path: ["mode", "mode-kinder"],                     name: "Kindermode" },
  { pattern: "kinderkleid",      path: ["mode", "mode-kinder"],                     name: "Kindermode" },

  // Taschen / Accessoires
  { pattern: "handtasche",       path: ["mode", "mode-taschen", "taschen-handtaschen"], name: "Handtaschen" },
  { pattern: "schultertasche",   path: ["mode", "mode-taschen", "taschen-handtaschen"], name: "Handtaschen" },
  { pattern: "clutch",           path: ["mode", "mode-taschen", "taschen-handtaschen"], name: "Handtaschen" },
  { pattern: "rucksack",         path: ["mode", "mode-taschen", "taschen-rucksaecke"],  name: "Rucksäcke" },
  { pattern: "reisekoffer",      path: ["mode", "mode-taschen", "taschen-koffer"],      name: "Koffer" },
  { pattern: "koffer",           path: ["mode", "mode-taschen", "taschen-koffer"],      name: "Koffer" },
  { pattern: "trolley",          path: ["mode", "mode-taschen", "taschen-koffer"],      name: "Trolleys" },
  { pattern: "portemonnaie",     path: ["mode", "mode-taschen", "taschen-geldbeutel"],  name: "Portemonnaies" },
  { pattern: "geldbeutel",       path: ["mode", "mode-taschen", "taschen-geldbeutel"],  name: "Portemonnaies" },
  { pattern: "geldbörse",        path: ["mode", "mode-taschen", "taschen-geldbeutel"],  name: "Portemonnaies" },
  { pattern: "gürtel",           path: ["mode", "mode-taschen", "mode-guertel"],        name: "Gürtel" },
  { pattern: "schal ",           path: ["mode", "mode-taschen", "mode-schals"],         name: "Schals" },

  // Generic apparel fall-throughs — keep last in the Mode block.
  { pattern: "apparel",          path: ["mode"],                 name: "Mode & Bekleidung" },
  { pattern: "clothing",         path: ["mode"],                 name: "Mode & Bekleidung" },
  { pattern: "bekleidung",       path: ["mode"],                 name: "Mode & Bekleidung" },
  { pattern: "jacke",            path: ["mode"],                 name: "Mode & Bekleidung" },
  { pattern: "jacket",           path: ["mode"],                 name: "Mode & Bekleidung" },
  { pattern: "t-shirt",          path: ["mode"],                 name: "Mode & Bekleidung" },
  { pattern: "hose",             path: ["mode"],                 name: "Mode & Bekleidung" },
  { pattern: "pants",            path: ["mode"],                 name: "Mode & Bekleidung" },
  { pattern: "pullover",         path: ["mode"],                 name: "Mode & Bekleidung" },
  { pattern: "hoodie",           path: ["mode"],                 name: "Mode & Bekleidung" },

  // ── TV brands (disambiguated by product type) ───────────────
  // Placed BEFORE Smartphones so "Samsung Fernseher" / "Samsung OLED"
  // doesn't get swept into the generic `samsung` → smartphones bucket
  // further down. Each pattern pairs a brand with an unambiguous TV
  // keyword so it only matches home-entertainment SKUs.
  { pattern: "samsung tv",         path: ["tv-audio"],              name: "Samsung TV" },
  { pattern: "samsung fernseher",  path: ["tv-audio"],              name: "Samsung TV" },
  { pattern: "samsung oled",       path: ["tv-audio", "tv-oled"],   name: "Samsung OLED" },
  { pattern: "samsung qled",       path: ["tv-audio", "tv-qled"],   name: "Samsung QLED" },
  { pattern: "samsung neo qled",   path: ["tv-audio", "tv-qled"],   name: "Samsung Neo QLED" },
  { pattern: "sony bravia",        path: ["tv-audio"],              name: "Sony Bravia" },
  { pattern: "lg oled",            path: ["tv-audio", "tv-oled"],   name: "LG OLED" },
  { pattern: "lg qned",            path: ["tv-audio"],              name: "LG QNED" },
  { pattern: "lg nanocell",        path: ["tv-audio"],              name: "LG NanoCell" },
  { pattern: "philips oled",       path: ["tv-audio", "tv-oled"],   name: "Philips OLED" },
  { pattern: "philips ambilight",  path: ["tv-audio"],              name: "Philips Ambilight" },
  { pattern: "philips fernseher",  path: ["tv-audio"],              name: "Philips TV" },
  { pattern: "panasonic viera",    path: ["tv-audio"],              name: "Panasonic" },
  { pattern: "loewe",              path: ["tv-audio"],              name: "Loewe" },
  { pattern: "grundig",            path: ["tv-audio"],              name: "Grundig" },
  { pattern: "hisense",            path: ["tv-audio"],              name: "Hisense" },
  { pattern: "tcl ",               path: ["tv-audio"],              name: "TCL" },

  // ── Smartphones ─────────────────────────────────────────────
  { pattern: "iphone",    path: ["smartphones", "smartphones-apple", "iphone"],          name: "iPhone" },
  { pattern: "ipad",      path: ["smartphones", "smartphones-apple", "ipad"],            name: "iPad" },
  { pattern: "galaxy",    path: ["smartphones", "smartphones-samsung", "samsung-galaxy"],name: "Galaxy" },
  { pattern: "samsung",   path: ["smartphones", "smartphones-samsung"],                  name: "Samsung" },
  { pattern: "pixel",     path: ["smartphones", "smartphones-google"],                   name: "Google Pixel" },
  { pattern: "xiaomi",    path: ["smartphones", "smartphones-xiaomi"],                   name: "Xiaomi" },
  { pattern: "smartphone",path: ["smartphones"],                                         name: "Smartphones" },
  { pattern: "handy",     path: ["smartphones"],                                         name: "Smartphones" },
  { pattern: "tablet",    path: ["smartphones"],                                         name: "Smartphones" },

  // ── Laptops ────────────────────────────────────────────────
  { pattern: "macbook",       path: ["laptops", "laptops-macbook"],                       name: "MacBook" },
  { pattern: "mac mini",      path: ["laptops", "laptops-macbook"],                       name: "Mac Mini" },
  { pattern: "mac studio",    path: ["laptops", "laptops-macbook"],                       name: "Mac Studio" },
  { pattern: "imac",          path: ["laptops", "laptops-macbook"],                       name: "iMac" },
  { pattern: "gaming laptop", path: ["laptops", "laptops-windows", "laptops-gaming"],     name: "Gaming Laptops" },
  { pattern: "chromebook",    path: ["laptops", "laptops-chromebook"],                    name: "Chromebook" },
  { pattern: "notebook",      path: ["laptops", "laptops-windows"],                       name: "Windows Laptops" },
  { pattern: "laptop",        path: ["laptops"],                                          name: "Laptops & Computer" },
  { pattern: "monitor",       path: ["laptops", "laptops-monitors"],                      name: "Monitore" },

  // ── Kopfhörer / Audio (Apple accessories matched before generic over-ear) ─
  { pattern: "airpod",          path: ["kopfhoerer", "airpods"],                 name: "AirPods" },
  { pattern: "homepod",         path: ["kopfhoerer", "homepod"],                 name: "HomePod" },
  { pattern: "soundbar",        path: ["tv-audio", "tv-soundbar"],               name: "Soundbar" },
  // Hi-Fi + home-audio brands — matched before generic over-ear/in-ear rules
  // so a "Bose Soundbar 900" is correctly routed as TV-Audio (via soundbar
  // above) while "Bose QuietComfort" lands in Kopfhörer.
  { pattern: "sonos",           path: ["kopfhoerer", "kopfhoerer-lautsprecher"], name: "Sonos" },
  { pattern: "bose ",           path: ["kopfhoerer"],                            name: "Bose" },
  { pattern: "sennheiser",      path: ["kopfhoerer"],                            name: "Sennheiser" },
  { pattern: "marshall",        path: ["kopfhoerer", "kopfhoerer-lautsprecher"], name: "Marshall" },
  { pattern: "bang & olufsen",  path: ["kopfhoerer"],                            name: "Bang & Olufsen" },
  { pattern: "bang olufsen",    path: ["kopfhoerer"],                            name: "Bang & Olufsen" },
  { pattern: "b&o ",            path: ["kopfhoerer"],                            name: "Bang & Olufsen" },
  { pattern: "harman kardon",   path: ["kopfhoerer"],                            name: "Harman Kardon" },
  { pattern: "teufel",          path: ["kopfhoerer", "kopfhoerer-lautsprecher"], name: "Teufel" },
  { pattern: "denon",           path: ["kopfhoerer"],                            name: "Denon" },
  { pattern: "onkyo",           path: ["kopfhoerer"],                            name: "Onkyo" },
  { pattern: "yamaha aventage", path: ["kopfhoerer"],                            name: "Yamaha" },
  { pattern: "jbl ",            path: ["kopfhoerer", "kopfhoerer-lautsprecher"], name: "JBL" },
  { pattern: "kef ",            path: ["kopfhoerer"],                            name: "KEF" },
  { pattern: "bowers & wilkins",path: ["kopfhoerer"],                            name: "Bowers & Wilkins" },
  { pattern: "over-ear",        path: ["kopfhoerer", "kopfhoerer-over-ear"],     name: "Over-Ear" },
  { pattern: "in-ear",          path: ["kopfhoerer", "kopfhoerer-in-ear"],       name: "In-Ear" },
  { pattern: "earbud",          path: ["kopfhoerer", "kopfhoerer-in-ear"],       name: "In-Ear" },
  { pattern: "noise cancel",    path: ["kopfhoerer", "kopfhoerer-nc"],           name: "Noise Cancelling" },
  { pattern: "kopfhörer",       path: ["kopfhoerer"],                            name: "Kopfhörer & Audio" },
  { pattern: "kopfhoerer",      path: ["kopfhoerer"],                            name: "Kopfhörer & Audio" },
  { pattern: "headphone",       path: ["kopfhoerer"],                            name: "Kopfhörer & Audio" },
  { pattern: "lautsprecher",    path: ["kopfhoerer", "kopfhoerer-lautsprecher"], name: "Lautsprecher" },
  { pattern: "speaker",         path: ["kopfhoerer", "kopfhoerer-lautsprecher"], name: "Lautsprecher" },

  // ── TV / Audio ─────────────────────────────────────────────
  { pattern: "oled tv",   path: ["tv-audio", "tv-oled"],     name: "OLED TVs" },
  { pattern: "qled tv",   path: ["tv-audio", "tv-qled"],     name: "QLED TVs" },
  { pattern: "soundbar",  path: ["tv-audio", "tv-soundbar"], name: "Soundbars" },
  { pattern: "beamer",    path: ["tv-audio", "tv-beamer"],   name: "Beamer" },
  { pattern: "projector", path: ["tv-audio", "tv-beamer"],   name: "Beamer" },
  { pattern: "fernseher", path: ["tv-audio"],                name: "TV & Audio" },
  { pattern: "fernsehgerät",path: ["tv-audio"],              name: "TV & Audio" },
  { pattern: "television",path: ["tv-audio"],                name: "TV & Audio" },

  // ── Foto ───────────────────────────────────────────────────
  { pattern: "dslr",       path: ["foto", "foto-dslr"],       name: "Spiegelreflex" },
  { pattern: "mirrorless", path: ["foto", "foto-mirrorless"], name: "Systemkameras" },
  { pattern: "action cam", path: ["foto", "foto-action"],     name: "Action Cams" },
  { pattern: "drohne",     path: ["foto", "foto-drohnen"],    name: "Drohnen" },
  { pattern: "drone",      path: ["foto", "foto-drohnen"],    name: "Drohnen" },
  { pattern: "objektiv",   path: ["foto", "foto-objektive"],  name: "Objektive" },
  { pattern: "kamera",     path: ["foto"],                    name: "Foto & Video" },
  { pattern: "camera",     path: ["foto"],                    name: "Foto & Video" },

  // ── Gaming ─────────────────────────────────────────────────
  { pattern: "playstation", path: ["gaming", "gaming-ps5"],      name: "PlayStation" },
  { pattern: "xbox",        path: ["gaming", "gaming-xbox"],     name: "Xbox" },
  { pattern: "nintendo",    path: ["gaming", "gaming-nintendo"], name: "Nintendo" },
  { pattern: "konsole",     path: ["gaming", "gaming-konsolen"], name: "Konsolen" },
  { pattern: "vr headset",  path: ["gaming", "gaming-vr"],       name: "VR Headsets" },

  // ── Uhren ──────────────────────────────────────────────────
  { pattern: "smartwatch",      path: ["uhren", "uhren-smartwatch"], name: "Smartwatches" },
  { pattern: "fitness tracker", path: ["uhren", "uhren-smartwatch"], name: "Fitness Tracker" },
  { pattern: "apple watch",     path: ["uhren", "uhren-smartwatch"], name: "Apple Watch" },

  // ── Luxusuhren ─────────────────────────────────────────────
  { pattern: "rolex",               path: ["uhren", "uhren-luxus"], name: "Rolex" },
  { pattern: "omega ",              path: ["uhren", "uhren-luxus"], name: "Omega" },
  { pattern: "patek philippe",      path: ["uhren", "uhren-luxus"], name: "Patek Philippe" },
  { pattern: "audemars piguet",     path: ["uhren", "uhren-luxus"], name: "Audemars Piguet" },
  { pattern: "breitling",           path: ["uhren", "uhren-luxus"], name: "Breitling" },
  { pattern: "iwc schaffhausen",    path: ["uhren", "uhren-luxus"], name: "IWC" },
  { pattern: "tag heuer",           path: ["uhren", "uhren-luxus"], name: "TAG Heuer" },
  { pattern: "cartier",             path: ["uhren", "uhren-luxus"], name: "Cartier" },
  { pattern: "hublot",              path: ["uhren", "uhren-luxus"], name: "Hublot" },
  { pattern: "panerai",             path: ["uhren", "uhren-luxus"], name: "Panerai" },
  { pattern: "tudor ",              path: ["uhren", "uhren-luxus"], name: "Tudor" },
  { pattern: "grand seiko",         path: ["uhren", "uhren-luxus"], name: "Grand Seiko" },
  { pattern: "vacheron constantin", path: ["uhren", "uhren-luxus"], name: "Vacheron Constantin" },
  { pattern: "jaeger-lecoultre",    path: ["uhren", "uhren-luxus"], name: "Jaeger-LeCoultre" },
  { pattern: "luxusuhr",            path: ["uhren", "uhren-luxus"], name: "Luxusuhren" },
  { pattern: "luxury watch",        path: ["uhren", "uhren-luxus"], name: "Luxusuhren" },

  // ── Schmuck (Bijouteria & co.) ─────────────────────────────
  // Placed AFTER the Uhren + Luxusuhren blocks so "Apple Watch Armband"
  // or "Rolex Bracelet" still hit their watch-specific rules first; the
  // jewelry block catches everything else. Both the German nouns and the
  // material-grade signals ("925 Silber", "750 Gold", "Sterling Silver")
  // are covered — the importer now persists g:description so these
  // strings reach resolveCategoryForExisting via the combined haystack.
  // Jewelry now drill-downs to concrete L3 slugs (schmuck-ohrringe /
  // schmuck-halsketten / schmuck-ringe / schmuck-silber / …) so the
  // sidebar, breadcrumb and filter bar can all route straight to the
  // right bucket instead of grouping everything under the flat
  // `uhren-schmuck` node.
  { pattern: "silberschmuck",   path: ["uhren", "uhren-schmuck", "schmuck-silber"],    name: "Silberschmuck" },
  { pattern: "goldschmuck",     path: ["uhren", "uhren-schmuck", "schmuck-gold"],      name: "Goldschmuck" },
  { pattern: "titanschmuck",    path: ["uhren", "uhren-schmuck", "schmuck-titan"],     name: "Titanschmuck" },
  { pattern: "edelstahlschmuck",path: ["uhren", "uhren-schmuck"],                      name: "Edelstahlschmuck" },
  { pattern: "ohrringe",        path: ["uhren", "uhren-schmuck", "schmuck-ohrringe"],  name: "Ohrringe" },
  { pattern: "ohrstecker",      path: ["uhren", "uhren-schmuck", "schmuck-ohrringe"],  name: "Ohrstecker" },
  { pattern: "ohrhänger",       path: ["uhren", "uhren-schmuck", "schmuck-ohrringe"],  name: "Ohrhänger" },
  { pattern: "halskette",       path: ["uhren", "uhren-schmuck", "schmuck-halsketten"],name: "Halsketten" },
  { pattern: "collier",         path: ["uhren", "uhren-schmuck", "schmuck-halsketten"],name: "Colliers" },
  { pattern: "anhänger",        path: ["uhren", "uhren-schmuck", "schmuck-halsketten"],name: "Anhänger" },
  { pattern: "armband",         path: ["uhren", "uhren-schmuck", "schmuck-armbaender"],name: "Armbänder" },
  { pattern: "armreif",         path: ["uhren", "uhren-schmuck", "schmuck-armbaender"],name: "Armreifen" },
  { pattern: "armkette",        path: ["uhren", "uhren-schmuck", "schmuck-armbaender"],name: "Armketten" },
  { pattern: "ehering",         path: ["uhren", "uhren-schmuck", "schmuck-eheringe"],  name: "Eheringe" },
  { pattern: "trauring",        path: ["uhren", "uhren-schmuck", "schmuck-eheringe"],  name: "Trauringe" },
  { pattern: "verlobungsring",  path: ["uhren", "uhren-schmuck", "schmuck-eheringe"],  name: "Verlobungsringe" },
  { pattern: "damenring",       path: ["uhren", "uhren-schmuck", "schmuck-ringe"],     name: "Damenringe" },
  { pattern: "herrenring",      path: ["uhren", "uhren-schmuck", "schmuck-ringe"],     name: "Herrenringe" },
  { pattern: "ringe",           path: ["uhren", "uhren-schmuck", "schmuck-ringe"],     name: "Ringe" },
  { pattern: "piercing",        path: ["uhren", "uhren-schmuck", "schmuck-piercing"],  name: "Piercings" },
  { pattern: "manschettenknopf",path: ["uhren", "uhren-schmuck"],                      name: "Manschettenknöpfe" },
  // English equivalents — some feeds localise-en even for CH distribution.
  { pattern: "necklace",        path: ["uhren", "uhren-schmuck", "schmuck-halsketten"],name: "Halsketten" },
  { pattern: "earring",         path: ["uhren", "uhren-schmuck", "schmuck-ohrringe"],  name: "Ohrringe" },
  { pattern: "bracelet",        path: ["uhren", "uhren-schmuck", "schmuck-armbaender"],name: "Armbänder" },
  { pattern: "pendant",         path: ["uhren", "uhren-schmuck", "schmuck-halsketten"],name: "Anhänger" },
  // Material grade signals — hit the description scan. 925 silver +
  // 750 gold are canonical on jewelry feeds and almost never appear
  // outside the schmuck context, so they route to the concrete L3.
  { pattern: "925 silber",       path: ["uhren", "uhren-schmuck", "schmuck-silber"],   name: "Silberschmuck" },
  { pattern: "925er silber",     path: ["uhren", "uhren-schmuck", "schmuck-silber"],   name: "Silberschmuck" },
  { pattern: "sterlingsilber",   path: ["uhren", "uhren-schmuck", "schmuck-silber"],   name: "Silberschmuck" },
  { pattern: "sterling silver",  path: ["uhren", "uhren-schmuck", "schmuck-silber"],   name: "Silberschmuck" },
  { pattern: "750 gold",         path: ["uhren", "uhren-schmuck", "schmuck-gold"],     name: "Goldschmuck" },
  { pattern: "750er gold",       path: ["uhren", "uhren-schmuck", "schmuck-gold"],     name: "Goldschmuck" },
  { pattern: "585 gold",         path: ["uhren", "uhren-schmuck", "schmuck-gold"],     name: "Goldschmuck" },
  { pattern: "585er gold",       path: ["uhren", "uhren-schmuck", "schmuck-gold"],     name: "Goldschmuck" },
  { pattern: "375 gold",         path: ["uhren", "uhren-schmuck", "schmuck-gold"],     name: "Goldschmuck" },
  { pattern: "weissgold",        path: ["uhren", "uhren-schmuck", "schmuck-gold"],     name: "Weissgold" },
  { pattern: "weißgold",         path: ["uhren", "uhren-schmuck", "schmuck-gold"],     name: "Weissgold" },
  { pattern: "gelbgold",         path: ["uhren", "uhren-schmuck", "schmuck-gold"],     name: "Gelbgold" },
  { pattern: "rotgold",          path: ["uhren", "uhren-schmuck", "schmuck-gold"],     name: "Rotgold" },
  { pattern: "roségold",         path: ["uhren", "uhren-schmuck", "schmuck-gold"],     name: "Roségold" },
  { pattern: "rosegold",         path: ["uhren", "uhren-schmuck", "schmuck-gold"],     name: "Roségold" },
  // Generic fallback
  { pattern: "schmuck",          path: ["uhren", "uhren-schmuck"], name: "Schmuck" },

  // ── Haushalt / Küche ───────────────────────────────────────
  // Coffee-machine brands — route to the concrete L3 under
  // haushalt-kaffee so a "Jura E8" lands on `kaffee-jura` (sidebar
  // drill-down) rather than the flat generic `haushalt-kaffee` bucket.
  { pattern: "nespresso",       path: ["haushalt", "haushalt-kaffee", "kaffee-nespresso"],  name: "Nespresso" },
  { pattern: "jura ",           path: ["haushalt", "haushalt-kaffee", "kaffee-jura"],       name: "Jura" },
  { pattern: "de'longhi",       path: ["haushalt", "haushalt-kaffee", "kaffee-delonghi"],   name: "De'Longhi" },
  { pattern: "delonghi",        path: ["haushalt", "haushalt-kaffee", "kaffee-delonghi"],   name: "De'Longhi" },
  { pattern: "sage appliances", path: ["haushalt", "haushalt-kaffee", "kaffee-sage"],       name: "Sage" },
  { pattern: "melitta",         path: ["haushalt", "haushalt-kaffee", "kaffee-melitta"],    name: "Melitta" },
  { pattern: "kaffeemaschine",  path: ["haushalt", "haushalt-kaffee"],                      name: "Kaffeemaschinen" },
  { pattern: "espressomaschine",path: ["haushalt", "haushalt-kaffee"],                      name: "Kaffeemaschinen" },

  // Kitchen appliance / white-goods brands
  { pattern: "kitchenaid",     path: ["haushalt", "haushalt-kuechengeraete"], name: "KitchenAid" },
  { pattern: "kenwood",        path: ["haushalt", "haushalt-kuechengeraete"], name: "Kenwood" },
  { pattern: "krups",          path: ["haushalt", "haushalt-kuechengeraete"], name: "Krups" },
  { pattern: "wmf ",           path: ["haushalt", "haushalt-kuechengeraete"], name: "WMF" },
  { pattern: "tefal",          path: ["haushalt", "haushalt-kuechengeraete"], name: "Tefal" },
  { pattern: "moulinex",       path: ["haushalt", "haushalt-kuechengeraete"], name: "Moulinex" },
  { pattern: "smeg",           path: ["haushalt", "haushalt-kuechengeraete"], name: "Smeg" },
  { pattern: "bosch küche",    path: ["haushalt", "haushalt-kuechengeraete"], name: "Bosch" },
  { pattern: "miele ",         path: ["haushalt", "haushalt-kuechengeraete"], name: "Miele" },
  { pattern: "siemens küche",  path: ["haushalt", "haushalt-kuechengeraete"], name: "Siemens" },

  // Appliance categories — common Jelmoli SKUs
  { pattern: "airfryer",            path: ["haushalt", "haushalt-kuechengeraete"], name: "Airfryer" },
  { pattern: "heissluftfritteuse",  path: ["haushalt", "haushalt-kuechengeraete"], name: "Airfryer" },
  { pattern: "wasserkocher",        path: ["haushalt", "haushalt-kuechengeraete"], name: "Wasserkocher" },
  { pattern: "toaster",             path: ["haushalt", "haushalt-kuechengeraete"], name: "Toaster" },
  { pattern: "standmixer",          path: ["haushalt", "haushalt-kuechengeraete"], name: "Standmixer" },
  { pattern: "stabmixer",           path: ["haushalt", "haushalt-kuechengeraete"], name: "Stabmixer" },
  { pattern: "küchenmaschine",      path: ["haushalt", "haushalt-kuechengeraete"], name: "Küchenmaschine" },

  // Laundry / big white goods
  { pattern: "waschmaschine",  path: ["haushalt", "haushalt-waschen"],        name: "Waschmaschine" },
  { pattern: "wäschetrockner", path: ["haushalt", "haushalt-waschen"],        name: "Wäschetrockner" },
  { pattern: "trockner",       path: ["haushalt", "haushalt-waschen"],        name: "Wäschetrockner" },
  { pattern: "geschirrspüler", path: ["haushalt", "haushalt-waschen"],        name: "Geschirrspüler" },
  { pattern: "kühlschrank",    path: ["haushalt", "haushalt-waschen"],        name: "Kühlschrank" },

  // Generic fallbacks (last — so all brand-specific rules above win first)
  { pattern: "staubsauger",    path: ["haushalt", "haushalt-staubsauger"],    name: "Staubsauger" },
  { pattern: "vacuum",         path: ["haushalt", "haushalt-staubsauger"],    name: "Staubsauger" },
  { pattern: "küche",          path: ["haushalt", "haushalt-kuechengeraete"], name: "Küchengeräte" },
  { pattern: "kuechengerät",   path: ["haushalt", "haushalt-kuechengeraete"], name: "Küchengeräte" },
  { pattern: "luftreiniger",   path: ["haushalt", "haushalt-luftreiniger"],   name: "Luftreiniger" },
  { pattern: "mixer",          path: ["haushalt", "haushalt-kuechengeraete"], name: "Küchengeräte" },
  { pattern: "haushalt",       path: ["haushalt"],                            name: "Haushalt & Küche" },
];

// ═══════════════════════════════════════════════════════════════════
// Feed-specific defaults — used when productType/keywords don't match.
// ═══════════════════════════════════════════════════════════════════

export const FEED_CATEGORY_DEFAULTS: Record<string, { path: string[]; name: string }> = {
  xxl_parfum:        { path: ["parfum"],   name: "Parfum & Düfte" },
  parfumsale:        { path: ["parfum"],   name: "Parfum & Düfte" },
  import_parfumerie: { path: ["parfum"],   name: "Parfum & Düfte" },
  coop_vitality:     { path: ["parfum"],   name: "Parfum & Düfte" },
  new_balance:       { path: ["schuhe", "schuhe-sneakers", "sneakers-newbalance"], name: "New Balance" },
  parfum_ch:         { path: ["parfum"],   name: "Parfum & Düfte" },
  ackermann_ch:      { path: ["haushalt"], name: "Haushalt & Küche" },
  // Ackermann Mode → fashion vertical. Shoe + outdoor-brand patterns
  // higher up in CATEGORY_MAP still win first; this default only kicks
  // in when nothing else matched (generic apparel with no brand hit).
  "ackermann-mode":  { path: ["mode"], name: "Mode & Bekleidung" },
  // Bergfreunde → default to Wandern & Trekking; explicit brand rules
  // above (Mammut, Patagonia, Dynafit, …) override whenever the title
  // or description names a known outdoor brand.
  bergfreunde:       { path: ["sport", "sport-wandern"], name: "Wandern & Trekking" },
  // Jelmoli Technik → electronics umbrella. Specific keyword rules
  // above (TV brands, home audio, kitchen appliances) override for
  // any item that names a known brand or product type; only truly
  // unmatched SKUs land on the haushalt root.
  jelmoli:           { path: ["haushalt"], name: "Haushalt & Küche" },
  // Jelmoli Mode → fashion umbrella. Premium-fashion brand rules
  // higher up (Hugo Boss, Ralph Lauren, Lacoste …) override first;
  // the default catches generic SKUs without a known brand signal.
  "jelmoli-mode":    { path: ["mode"], name: "Mode & Bekleidung" },
  // Bijouteria → every feed item is jewelry, so the default lands on
  // the Schmuck L2. Brand / material keywords higher up resolve to
  // the same leaf; the default only applies when neither title nor
  // description carried a recognisable signal.
  bijouteria:        { path: ["uhren", "uhren-schmuck"], name: "Schmuck" },
};

// ═══════════════════════════════════════════════════════════════════
// Beauty keyword rules — title + description scan fallback.
// ═══════════════════════════════════════════════════════════════════

export interface KeywordRule {
  keywords: string[];
  path: string[];
  name: string;
}

export const BEAUTY_KEYWORD_RULES: KeywordRule[] = [
  { keywords: ["eau de parfum", "edp"],                                      path: ["parfum", "damendufte"],    name: "Damendüfte" },
  { keywords: ["eau de toilette", "edt"],                                    path: ["parfum", "damendufte"],    name: "Damendüfte" },
  { keywords: ["duftset", "geschenkset", "gift set"],                        path: ["parfum", "geschenksets"],  name: "Geschenksets" },
  { keywords: ["after shave", "aftershave"],                                 path: ["parfum", "herrendufte"],   name: "Herrendüfte" },
  { keywords: ["mascara", "lippenstift", "lipstick", "make-up", "makeup"],   path: ["parfum", "make-up"],       name: "Make-Up" },
  { keywords: ["gesichtspflege", "gesichtscreme", "serum"],                  path: ["parfum", "pflege"],        name: "Pflege" },
  { keywords: ["body lotion", "körperlotion", "koerperlotion", "body milk"], path: ["parfum", "koerperpflege"], name: "Körperpflege" },
  { keywords: ["shampoo", "conditioner", "haarpflege"],                      path: ["parfum", "haarpflege"],    name: "Haarpflege" },
  { keywords: ["parfum", "perfume", "duft", "fragrance"],                    path: ["parfum"],                  name: "Parfum & Düfte" },
];

export interface ResolvedCategory {
  path: string[];
  name: string;
}

export function matchBeautyKeywords(title: string, description: string): ResolvedCategory | null {
  const haystack = (title + " " + description).toLowerCase();
  for (const rule of BEAUTY_KEYWORD_RULES) {
    for (const kw of rule.keywords) {
      if (haystack.includes(kw)) return { path: rule.path, name: rule.name };
    }
  }
  return null;
}

function matchProductType(productType: string): ResolvedCategory | null {
  const lower = productType.toLowerCase();
  for (const entry of CATEGORY_MAP) {
    if (lower.includes(entry.pattern)) return { path: entry.path, name: entry.name };
  }
  return null;
}

/**
 * Resolve a category path for a feed import.
 *   1. productType → CATEGORY_MAP
 *   2. title + description → BEAUTY_KEYWORD_RULES
 *   3. feed-specific default
 */
export function resolveCategory(
  productType: string | undefined,
  title: string,
  description: string,
  feedId: string,
): ResolvedCategory {
  if (productType) {
    const m = matchProductType(productType);
    if (m) return m;
  }
  const kw = matchBeautyKeywords(title, description);
  if (kw) return kw;
  return FEED_CATEGORY_DEFAULTS[feedId] || { path: ["parfum"], name: "Parfum & Düfte" };
}

/**
 * Resolve a category path for an EXISTING product (no feedId available).
 *   1. title + brand + description + categoryName → CATEGORY_MAP scan
 *   2. title + description → BEAUTY_KEYWORD_RULES
 *   3. fall back to the current leaf slug (no change recommended)
 *
 * Used by the recategorize runner. Now includes `description` and the
 * legacy `categoryName` in the haystack so brand signals that live in
 * marketing copy (e.g. "Tom Ford — Noir Extreme for Men, Woody …")
 * finally reach the pattern scan even when the product title is
 * truncated.
 */
export function resolveCategoryForExisting(
  title: string,
  brand: string,
  description: string,
  currentSlug: string,
  currentName: string | null,
): ResolvedCategory {
  const haystack = `${title} ${brand} ${description} ${currentName ?? ""}`.toLowerCase();
  // Try CATEGORY_MAP patterns against the combined haystack
  for (const entry of CATEGORY_MAP) {
    if (haystack.includes(entry.pattern)) return { path: entry.path, name: entry.name };
  }
  // Fall back to beauty keywords
  const kw = matchBeautyKeywords(title, description);
  if (kw) return kw;
  // No match → keep current category (single-segment path)
  return { path: [currentSlug], name: currentName ?? currentSlug };
}
