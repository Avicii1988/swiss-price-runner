import {
  Smartphone,
  Headphones,
  Laptop,
  ShoppingBag,
  Home,
  Gamepad2,
  Shirt,
  Watch,
  Camera,
  Droplets,
  Tv,
  Baby,
  Dumbbell,
  Monitor,
  Wrench,
  Sofa,
  Dog,
  BookOpen,
  ShoppingCart,
  Briefcase,
  Heart,
  Puzzle,
  type LucideIcon,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════
// Category taxonomy — Galaxus-aligned deep tree (up to 6 levels).
//
// Root = "Gesamtsortiment" (virtual, represented by "/" in breadcrumbs).
// L1 = Galaxus sectors (IT + Multimedia, Haushalt, Mode, …).
// L2–L6 = progressively finer subcategories.
//
// Every node carries a unique slug that matches Product.category in the
// DB. Existing slugs from the old 3-level tree are preserved at their
// new depth so no product data breaks.
// ═══════════════════════════════════════════════════════════════════

export interface CategoryNode {
  slug: string;
  name: string;
  description?: string;
  icon?: LucideIcon;
  depth: number;
  parentSlug: string | null;
  children: CategoryNode[];
  productCount: number;
}

interface NodeSpec {
  slug: string;
  name: string;
  description?: string;
  icon?: LucideIcon;
  productCount?: number;
  children?: NodeSpec[];
}

function buildTree(specs: NodeSpec[], parentSlug: string | null = null, depth = 0): CategoryNode[] {
  return specs.map((s) => ({
    slug: s.slug,
    name: s.name,
    description: s.description,
    icon: s.icon,
    depth,
    parentSlug,
    productCount: s.productCount ?? 0,
    children: buildTree(s.children ?? [], s.slug, depth + 1),
  }));
}

// ───────────────────────────────────────────────────────────────────
// Deep tree definition — Galaxus-aligned sectors
// ───────────────────────────────────────────────────────────────────

const TREE_SPEC: NodeSpec[] = [
  // ═══════════════════════════════════════════════════════════════
  // 1. IT + Multimedia
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "it-multimedia",
    name: "IT + Multimedia",
    icon: Monitor,
    description: "Smartphones, Computer, Audio, TV, Foto und Gaming",
    children: [
      // ── Smartphones + Tablets ──
      {
        slug: "smartphones",
        name: "Smartphones + Tablets",
        icon: Smartphone,
        children: [
          {
            slug: "smartphone",
            name: "Smartphone",
            children: [
              {
                slug: "smartphones-apple",
                name: "Apple",
                children: [
                  { slug: "iphone", name: "iPhone" },
                  { slug: "iphone-zubehoer", name: "iPhone Zubehör" },
                ],
              },
              {
                slug: "smartphones-samsung",
                name: "Samsung",
                children: [
                  { slug: "samsung-galaxy", name: "Galaxy Serie" },
                  { slug: "samsung-galaxy-zubehoer", name: "Galaxy Zubehör" },
                ],
              },
              { slug: "smartphones-google", name: "Google Pixel" },
              { slug: "smartphones-xiaomi", name: "Xiaomi" },
              { slug: "smartphone-refurbished", name: "Smartphone Refurbished" },
              {
                slug: "smartphones-zubehoer",
                name: "Smartphone Zubehör",
                children: [
                  { slug: "smartphones-cases", name: "Hüllen + Schutzfolien" },
                  { slug: "smartphone-ladegeraete", name: "Ladegeräte + Kabel" },
                  { slug: "smartphone-halterungen", name: "Halterungen" },
                ],
              },
            ],
          },
          {
            slug: "tablets",
            name: "Tablet + eReader",
            children: [
              { slug: "ipad", name: "Apple iPad" },
              { slug: "smartphones-tablets", name: "Android Tablets" },
              { slug: "ereader", name: "eReader" },
              { slug: "tablet-zubehoer", name: "Tablet Zubehör" },
            ],
          },
          {
            slug: "smartphones-wearables",
            name: "Smartwatch + Wearable",
            children: [
              { slug: "uhren-smartwatch", name: "Smartwatches" },
              { slug: "sport-wearables", name: "Fitness Tracker" },
            ],
          },
          { slug: "walkie-talkie", name: "Walkie Talkie" },
        ],
      },
      // ── Audio ──
      {
        slug: "audio",
        name: "Audio",
        icon: Headphones,
        children: [
          {
            slug: "kopfhoerer",
            name: "Kopfhörer",
            children: [
              { slug: "kopfhoerer-over-ear", name: "Over-Ear" },
              { slug: "kopfhoerer-in-ear", name: "In-Ear + Earbuds" },
              { slug: "kopfhoerer-nc", name: "Noise Cancelling" },
              { slug: "kopfhoerer-sport", name: "Sport-Kopfhörer" },
              { slug: "airpods", name: "Apple AirPods" },
              { slug: "kopfhoerer-kinder", name: "Kinder-Kopfhörer" },
            ],
          },
          {
            slug: "lautsprecher",
            name: "Lautsprecher",
            children: [
              { slug: "kopfhoerer-lautsprecher", name: "Bluetooth Lautsprecher" },
              { slug: "homepod", name: "Apple HomePod" },
              { slug: "lautsprecher-hifi", name: "Hi-Fi Lautsprecher" },
              { slug: "lautsprecher-multiroom", name: "Multiroom" },
            ],
          },
          {
            slug: "audio-player",
            name: "Audio Player",
            children: [
              { slug: "audio-player-zubehoer", name: "Audio Player Zubehör",
                children: [
                  { slug: "audio-zubehoer", name: "Audio Zubehör" },
                  { slug: "audio-kabel", name: "Audio Kabel + Adapter" },
                  { slug: "plattenspieler-zubehoer", name: "Plattenspieler Zubehör" },
                ],
              },
            ],
          },
          { slug: "mikrofon", name: "Mikrofon + Recording" },
          { slug: "audio-zubehoer-allgemein", name: "Audio Zubehör allgemein" },
        ],
      },
      // ── Computer ──
      {
        slug: "computer",
        name: "Computer",
        icon: Laptop,
        children: [
          {
            slug: "laptops",
            name: "Laptop",
            children: [
              { slug: "laptops-macbook", name: "Apple MacBook" },
              {
                slug: "laptops-windows",
                name: "Windows Laptop",
                children: [{ slug: "laptops-gaming", name: "Gaming Laptop" }],
              },
              { slug: "laptops-chromebook", name: "Chromebook" },
              { slug: "laptop-zubehoer", name: "Laptop Zubehör" },
            ],
          },
          { slug: "desktop-pc", name: "Desktop PC" },
          { slug: "laptops-monitors", name: "Monitor" },
          {
            slug: "laptops-accessories",
            name: "Computer Zubehör",
            children: [
              { slug: "tastatur", name: "Tastatur" },
              { slug: "maus", name: "Maus" },
              { slug: "webcam", name: "Webcam" },
              { slug: "usb-hub", name: "USB Hub + Docking" },
            ],
          },
          {
            slug: "speicher-netzwerk",
            name: "Speicher + Netzwerk",
            children: [
              { slug: "externe-festplatte", name: "Externe Festplatte + SSD" },
              { slug: "usb-stick", name: "USB Stick" },
              { slug: "nas", name: "NAS" },
              { slug: "router", name: "Router + WLAN" },
            ],
          },
          { slug: "drucker-scanner", name: "Drucker + Scanner" },
        ],
      },
      // ── TV + Heimkino ──
      {
        slug: "tv-audio",
        name: "TV + Heimkino",
        icon: Tv,
        children: [
          {
            slug: "fernseher",
            name: "Fernseher",
            children: [
              { slug: "tv-oled", name: "OLED TV" },
              { slug: "tv-qled", name: "QLED TV" },
              { slug: "tv-led", name: "LED TV" },
              { slug: "tv-mini-led", name: "Mini-LED TV" },
            ],
          },
          { slug: "tv-soundbar", name: "Soundbar" },
          { slug: "tv-hifi", name: "Hi-Fi + AV-Receiver" },
          { slug: "tv-streaming", name: "Streaming Geräte" },
          { slug: "apple-tv", name: "Apple TV" },
          { slug: "tv-beamer", name: "Beamer + Projektor" },
          { slug: "tv-zubehoer", name: "TV Zubehör + Wandhalterung" },
        ],
      },
      // ── Foto + Video ──
      {
        slug: "foto",
        name: "Foto + Video",
        icon: Camera,
        children: [
          {
            slug: "kamera",
            name: "Kamera",
            children: [
              { slug: "foto-mirrorless", name: "Systemkamera" },
              { slug: "foto-dslr", name: "Spiegelreflex" },
              { slug: "kompaktkamera", name: "Kompaktkamera" },
              { slug: "sofortbildkamera", name: "Sofortbildkamera" },
            ],
          },
          { slug: "foto-objektive", name: "Objektive" },
          { slug: "foto-drohnen", name: "Drohnen" },
          { slug: "foto-action", name: "Action Cam" },
          { slug: "stativ", name: "Stativ + Stabilizer" },
          { slug: "foto-zubehoer", name: "Foto Zubehör" },
        ],
      },
      // ── Gaming ──
      {
        slug: "gaming",
        name: "Gaming + Entertainment",
        icon: Gamepad2,
        children: [
          {
            slug: "gaming-konsolen",
            name: "Konsolen",
            children: [
              { slug: "gaming-ps5", name: "PlayStation 5" },
              { slug: "gaming-xbox", name: "Xbox Series" },
              { slug: "gaming-nintendo", name: "Nintendo Switch" },
            ],
          },
          { slug: "gaming-pc", name: "PC Gaming" },
          { slug: "gaming-vr", name: "VR Headset" },
          { slug: "gaming-zubehoer", name: "Controller + Zubehör" },
          { slug: "gaming-spiele", name: "Games + Software" },
        ],
      },
      // ── Smart Home ──
      { slug: "haushalt-smart-home", name: "Smart Home" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 2. Beauty + Gesundheit
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "beauty-gesundheit",
    name: "Beauty + Gesundheit",
    icon: Heart,
    description: "Parfum, Pflege, Make-up, Haarpflege und Sonnenschutz",
    children: [
      {
        slug: "parfum",
        name: "Parfum + Düfte",
        icon: Droplets,
        children: [
          {
            slug: "damendufte",
            name: "Damendüfte",
            children: [
              { slug: "damendufte-floral", name: "Floral" },
              { slug: "damendufte-oriental", name: "Oriental" },
              { slug: "damendufte-zitrus", name: "Zitrus + Frisch" },
              { slug: "damendufte-gourmand", name: "Gourmand" },
            ],
          },
          {
            slug: "herrendufte",
            name: "Herrendüfte",
            children: [
              { slug: "herrendufte-woody", name: "Woody" },
              { slug: "herrendufte-fresh", name: "Frisch" },
              { slug: "herrendufte-oriental", name: "Oriental" },
              { slug: "herrendufte-aquatisch", name: "Aquatisch" },
            ],
          },
          { slug: "unisex-dufte", name: "Unisex" },
          { slug: "parfum-nische", name: "Nischen- + Luxusparfum" },
          { slug: "geschenksets", name: "Geschenksets" },
          { slug: "parfum-mini", name: "Miniatur + Travel Size" },
        ],
      },
      {
        slug: "pflege",
        name: "Gesichtspflege",
        children: [
          { slug: "pflege-creme", name: "Gesichtscreme" },
          { slug: "pflege-serum", name: "Serum + Öl" },
          { slug: "pflege-reinigung", name: "Reinigung" },
          { slug: "pflege-maske", name: "Gesichtsmaske" },
          { slug: "pflege-augenpflege", name: "Augenpflege" },
        ],
      },
      {
        slug: "koerperpflege",
        name: "Körperpflege",
        children: [
          { slug: "koerperpflege-lotion", name: "Body Lotion + Öl" },
          { slug: "koerperpflege-duschgel", name: "Duschgel + Seife" },
          { slug: "koerperpflege-deo", name: "Deodorant" },
          { slug: "koerperpflege-handpflege", name: "Handpflege" },
        ],
      },
      {
        slug: "haarpflege",
        name: "Haarpflege",
        children: [
          { slug: "haarpflege-shampoo", name: "Shampoo" },
          { slug: "haarpflege-conditioner", name: "Conditioner + Kur" },
          { slug: "haarpflege-styling", name: "Styling" },
          { slug: "haarpflege-coloration", name: "Coloration" },
        ],
      },
      {
        slug: "make-up",
        name: "Make-up",
        children: [
          { slug: "makeup-foundation", name: "Foundation + Concealer" },
          { slug: "makeup-lippenstift", name: "Lippenstift + Lipgloss" },
          { slug: "makeup-mascara", name: "Mascara + Eyeliner" },
          { slug: "makeup-puder", name: "Puder + Rouge" },
          { slug: "makeup-nagellack", name: "Nagellack" },
          { slug: "makeup-pinsel", name: "Pinsel + Tools" },
        ],
      },
      { slug: "sonnenpflege", name: "Sonnenpflege + SPF" },
      {
        slug: "gesundheit",
        name: "Gesundheit + Wohlbefinden",
        children: [
          { slug: "mundpflege", name: "Zahnpflege + Mundpflege" },
          { slug: "rasur", name: "Rasur + Bartpflege" },
          { slug: "nahrungsergaenzung", name: "Nahrungsergänzung" },
          { slug: "medizinprodukte", name: "Medizinprodukte" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 3. Mode
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "mode",
    name: "Mode",
    icon: Shirt,
    description: "Damen, Herren, Kinder, Schuhe, Uhren, Schmuck, Taschen",
    children: [
      // ── Damenmode ──
      {
        slug: "mode-damen",
        name: "Damenmode",
        children: [
          { slug: "damen-kleider", name: "Kleider" },
          { slug: "damen-oberteile", name: "Oberteile + Blusen" },
          { slug: "damen-hosen", name: "Hosen + Jeans" },
          { slug: "damen-roecke", name: "Röcke" },
          { slug: "damen-jacken", name: "Jacken + Mäntel" },
          { slug: "damen-strick", name: "Strick + Pullover" },
          { slug: "damen-unterwaesche", name: "Unterwäsche + Bademode" },
          { slug: "damen-sportbekleidung", name: "Sportbekleidung" },
        ],
      },
      // ── Herrenmode ──
      {
        slug: "mode-herren",
        name: "Herrenmode",
        children: [
          { slug: "herren-hemden", name: "Hemden" },
          { slug: "herren-tshirts", name: "T-Shirts + Polos" },
          { slug: "herren-hosen", name: "Hosen + Jeans" },
          { slug: "herren-anzuege", name: "Anzüge + Sakkos" },
          { slug: "herren-jacken", name: "Jacken + Mäntel" },
          { slug: "herren-strick", name: "Strick + Pullover" },
          { slug: "herren-unterwaesche", name: "Unterwäsche + Socken" },
          { slug: "herren-sportbekleidung", name: "Sportbekleidung" },
        ],
      },
      { slug: "mode-kinder", name: "Kindermode" },
      { slug: "mode-sport", name: "Sportbekleidung" },
      // ── Schuhe ──
      {
        slug: "schuhe",
        name: "Schuhe",
        icon: ShoppingBag,
        children: [
          {
            slug: "schuhe-sneakers",
            name: "Sneakers",
            children: [
              { slug: "sneakers-nike", name: "Nike" },
              { slug: "sneakers-adidas", name: "Adidas" },
              { slug: "sneakers-newbalance", name: "New Balance" },
              { slug: "sneakers-onrunning", name: "On Running" },
              { slug: "sneakers-puma", name: "Puma" },
              { slug: "sneakers-asics", name: "Asics" },
              { slug: "sneakers-hoka", name: "Hoka" },
              { slug: "sneakers-salomon", name: "Salomon" },
            ],
          },
          {
            slug: "schuhe-laufschuhe",
            name: "Laufschuhe",
            children: [
              { slug: "laufschuhe-nike", name: "Nike" },
              { slug: "laufschuhe-onrunning", name: "On Running" },
              { slug: "laufschuhe-asics", name: "Asics" },
            ],
          },
          { slug: "schuhe-wandern", name: "Wanderschuhe" },
          { slug: "schuhe-business", name: "Business- + Lederschuhe" },
          { slug: "schuhe-stiefel", name: "Stiefel" },
          { slug: "schuhe-sandalen", name: "Sandalen" },
          { slug: "schuhe-damen", name: "Damenschuhe" },
          { slug: "schuhe-herren", name: "Herrenschuhe" },
          { slug: "schuhe-kinder", name: "Kinderschuhe" },
        ],
      },
      // ── Uhren + Schmuck ──
      {
        slug: "uhren",
        name: "Uhren + Schmuck",
        icon: Watch,
        children: [
          { slug: "uhren-luxus", name: "Luxusuhren" },
          { slug: "uhren-sport", name: "Sportuhren" },
          {
            slug: "uhren-schmuck",
            name: "Schmuck",
            children: [
              { slug: "schmuck-ohrringe", name: "Ohrringe" },
              { slug: "schmuck-halsketten", name: "Halsketten + Anhänger" },
              { slug: "schmuck-armbaender", name: "Armbänder + Armreifen" },
              { slug: "schmuck-ringe", name: "Ringe" },
              { slug: "schmuck-eheringe", name: "Ehe- + Verlobungsringe" },
              { slug: "schmuck-piercing", name: "Piercings" },
              { slug: "schmuck-silber", name: "Silberschmuck" },
              { slug: "schmuck-gold", name: "Goldschmuck" },
              { slug: "schmuck-titan", name: "Titanschmuck" },
            ],
          },
        ],
      },
      // ── Taschen + Accessoires ──
      {
        slug: "mode-taschen",
        name: "Taschen + Accessoires",
        children: [
          { slug: "taschen-handtaschen", name: "Handtaschen" },
          { slug: "taschen-rucksaecke", name: "Rucksäcke" },
          { slug: "taschen-koffer", name: "Koffer + Reisegepäck" },
          { slug: "taschen-geldbeutel", name: "Portemonnaies" },
          { slug: "mode-guertel", name: "Gürtel" },
          { slug: "mode-schals", name: "Schals + Tücher" },
          { slug: "mode-sonnenbrillen", name: "Sonnenbrillen" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 4. Sport
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "sport",
    name: "Sport",
    icon: Dumbbell,
    description: "Outdoor, Wandern, Klettern, Ski, Fitness, Velo und Wassersport",
    children: [
      {
        slug: "sport-wandern",
        name: "Wandern + Trekking",
        children: [
          { slug: "wandern-schuhe", name: "Wanderschuhe" },
          { slug: "wandern-rucksack", name: "Wanderrucksäcke" },
          { slug: "wandern-bekleidung", name: "Wanderbekleidung" },
          { slug: "wandern-stoecke", name: "Trekkingstöcke" },
          { slug: "wandern-navigation", name: "GPS + Navigation" },
        ],
      },
      {
        slug: "sport-klettern",
        name: "Klettern + Bergsport",
        children: [
          { slug: "klettern-seile", name: "Seile + Gurte" },
          { slug: "klettern-karabiner", name: "Karabiner + Sicherung" },
          { slug: "klettern-schuhe", name: "Kletterschuhe" },
          { slug: "klettern-helm", name: "Kletterhelme" },
        ],
      },
      {
        slug: "sport-running",
        name: "Running + Trailrunning",
        children: [
          { slug: "running-schuhe", name: "Laufschuhe" },
          { slug: "running-bekleidung", name: "Laufbekleidung" },
          { slug: "running-uhren", name: "Laufuhren + GPS" },
        ],
      },
      {
        slug: "sport-ski",
        name: "Ski + Snowboard",
        children: [
          { slug: "ski-alpin", name: "Alpin Ski" },
          { slug: "ski-langlauf", name: "Langlauf" },
          { slug: "ski-tourenski", name: "Tourenski" },
          { slug: "snowboard", name: "Snowboard" },
          { slug: "ski-bekleidung", name: "Skibekleidung" },
          { slug: "ski-helm-brille", name: "Helm + Skibrille" },
        ],
      },
      {
        slug: "sport-camping",
        name: "Camping + Zelte",
        children: [
          { slug: "camping-zelt", name: "Zelte" },
          { slug: "camping-schlafsack", name: "Schlafsäcke" },
          { slug: "camping-isomatte", name: "Isomatten" },
          { slug: "camping-kocher", name: "Kocher + Geschirr" },
        ],
      },
      {
        slug: "sport-fitness",
        name: "Fitness + Yoga",
        children: [
          { slug: "fitness-geraete", name: "Fitnessgeräte" },
          { slug: "fitness-hanteln", name: "Hanteln + Gewichte" },
          { slug: "fitness-yoga", name: "Yoga + Pilates" },
          { slug: "fitness-bekleidung", name: "Fitnessbekleidung" },
        ],
      },
      {
        slug: "sport-velo",
        name: "Velo + E-Bike",
        children: [
          { slug: "velo-ebike", name: "E-Bike" },
          { slug: "velo-rennrad", name: "Rennrad" },
          { slug: "velo-mtb", name: "Mountainbike" },
          { slug: "velo-zubehoer", name: "Velozubehör" },
          { slug: "velo-helm", name: "Velohelm" },
        ],
      },
      { slug: "sport-wassersport", name: "Wassersport + Schwimmen" },
      { slug: "sport-tennis", name: "Tennis + Badminton" },
      { slug: "sport-fussball", name: "Fussball" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 5. Haushalt
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "haushalt",
    name: "Haushalt",
    icon: Home,
    description: "Kaffeemaschinen, Küchengeräte, Staubsauger, Waschen und Reinigen",
    children: [
      {
        slug: "haushalt-kaffee",
        name: "Kaffeemaschinen",
        children: [
          { slug: "kaffee-nespresso", name: "Nespresso" },
          { slug: "kaffee-jura", name: "Jura" },
          { slug: "kaffee-delonghi", name: "De'Longhi" },
          { slug: "kaffee-sage", name: "Sage" },
          { slug: "kaffee-melitta", name: "Melitta" },
          { slug: "kaffee-filter", name: "Filterkaffeemaschine" },
          { slug: "kaffee-espresso", name: "Espressomaschine" },
          { slug: "kaffee-zubehoer", name: "Kaffee-Zubehör" },
        ],
      },
      {
        slug: "haushalt-kuechengeraete",
        name: "Küchengeräte",
        children: [
          { slug: "kuechengeraete-mixer", name: "Mixer + Blender" },
          { slug: "kuechengeraete-kuechenmaschine", name: "Küchenmaschine" },
          { slug: "kuechengeraete-airfryer", name: "Airfryer" },
          { slug: "kuechengeraete-wasserkocher", name: "Wasserkocher" },
          { slug: "kuechengeraete-toaster", name: "Toaster" },
          { slug: "kuechengeraete-grill", name: "Grill + BBQ" },
          { slug: "kuechengeraete-mikrowelle", name: "Mikrowelle" },
          { slug: "kuechengeraete-backen", name: "Backen" },
        ],
      },
      {
        slug: "haushalt-staubsauger",
        name: "Staubsauger",
        children: [
          { slug: "staubsauger-roboter", name: "Saugroboter" },
          { slug: "staubsauger-akku", name: "Akku-Handstaubsauger" },
          { slug: "staubsauger-boden", name: "Bodenstaubsauger" },
        ],
      },
      {
        slug: "haushalt-waschen",
        name: "Waschen + Trocknen",
        children: [
          { slug: "waschen-waschmaschine", name: "Waschmaschine" },
          { slug: "waschen-trockner", name: "Tumbler" },
          { slug: "waschen-buegeln", name: "Bügeln" },
        ],
      },
      { slug: "haushalt-luftreiniger", name: "Luftreiniger + Klima" },
      { slug: "haushalt-wohnen", name: "Wohnen + Einrichten" },
      { slug: "haushalt-garten", name: "Garten + Balkon" },
      { slug: "haushalt-reinigen", name: "Reinigen + Putzen" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 6. Baumarkt + Garten
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "baumarkt-garten",
    name: "Baumarkt + Garten",
    icon: Wrench,
    description: "Werkzeug, Gartenpflege, Bewässerung, Grillieren",
    children: [
      { slug: "baumarkt-werkzeug", name: "Werkzeug" },
      { slug: "baumarkt-elektrowerkzeug", name: "Elektrowerkzeug" },
      { slug: "baumarkt-gartenpflege", name: "Gartenpflege" },
      { slug: "baumarkt-bewaesserung", name: "Bewässerung" },
      { slug: "baumarkt-grillen", name: "Grillieren" },
      { slug: "baumarkt-farben", name: "Farben + Lacke" },
      { slug: "baumarkt-sanitaer", name: "Sanitär + Bad" },
      { slug: "baumarkt-beleuchtung", name: "Aussenbeleuchtung" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 7. Wohnen
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "wohnen",
    name: "Wohnen",
    icon: Sofa,
    description: "Möbel, Lampen, Textilien und Dekoration",
    children: [
      { slug: "wohnen-moebel", name: "Möbel" },
      { slug: "wohnen-lampen", name: "Lampen + Licht" },
      { slug: "wohnen-textilien", name: "Textilien" },
      { slug: "wohnen-dekoration", name: "Dekoration" },
      { slug: "wohnen-aufbewahrung", name: "Aufbewahrung" },
      { slug: "wohnen-badezimmer", name: "Badezimmer" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 8. Spielzeug
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "spielzeug",
    name: "Spielzeug",
    icon: Puzzle,
    description: "LEGO, Gesellschaftsspiele, Puppen, Modelleisenbahn",
    children: [
      { slug: "spielzeug-lego", name: "LEGO" },
      { slug: "spielzeug-gesellschaftsspiele", name: "Gesellschaftsspiele" },
      { slug: "spielzeug-puppen", name: "Puppen + Figuren" },
      { slug: "spielzeug-playmobil", name: "Playmobil" },
      { slug: "spielzeug-outdoor", name: "Outdoor-Spielzeug" },
      { slug: "spielzeug-ferngesteuert", name: "Ferngesteuerte Fahrzeuge" },
      { slug: "spielzeug-baby", name: "Baby-Spielzeug" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 9. Baby + Eltern
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "baby-eltern",
    name: "Baby + Eltern",
    icon: Baby,
    description: "Kinderwagen, Babypflege, Kindermöbel, Autositze",
    children: [
      { slug: "baby-kinderwagen", name: "Kinderwagen + Buggys" },
      { slug: "baby-pflege", name: "Babypflege" },
      { slug: "baby-moebel", name: "Kindermöbel" },
      { slug: "baby-sicherheit", name: "Autositze + Sicherheit" },
      { slug: "baby-spielzeug", name: "Babyspielzeug" },
      { slug: "baby-stillen", name: "Stillen + Füttern" },
      { slug: "baby-kleidung", name: "Babykleidung" },
      { slug: "baby", name: "Baby Allgemein" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 10. Büro + Schreibwaren
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "buero",
    name: "Büro + Schreibwaren",
    icon: Briefcase,
    description: "Büromaterial, Schulbedarf, Taschenrechner",
    children: [
      { slug: "buero-material", name: "Büromaterial" },
      { slug: "buero-schulbedarf", name: "Schulbedarf" },
      { slug: "buero-ordnung", name: "Ordner + Ablage" },
      { slug: "buero-papier", name: "Papier + Druckzubehör" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 11. Supermarkt
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "supermarkt",
    name: "Supermarkt",
    icon: ShoppingCart,
    description: "Lebensmittel, Getränke, Nahrungsergänzung",
    children: [
      { slug: "supermarkt-getraenke", name: "Getränke" },
      { slug: "supermarkt-lebensmittel", name: "Lebensmittel" },
      { slug: "supermarkt-bio", name: "Bio + Vegan" },
      { slug: "supermarkt-suessigkeiten", name: "Süssigkeiten + Snacks" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 12. Tierbedarf
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "tierbedarf",
    name: "Tierbedarf",
    icon: Dog,
    description: "Hundefutter, Katzenfutter, Aquaristik",
    children: [
      { slug: "tierbedarf-hund", name: "Hund" },
      { slug: "tierbedarf-katze", name: "Katze" },
      { slug: "tierbedarf-vogel", name: "Vogel" },
      { slug: "tierbedarf-fisch", name: "Aquaristik" },
      { slug: "tierbedarf-nager", name: "Nager + Kleintiere" },
    ],
  },
];

/** Built tree — primary export for navigation, breadcrumbs, importer. */
export const CATEGORY_TREE: CategoryNode[] = buildTree(TREE_SPEC);

// ───────────────────────────────────────────────────────────────────
// Tree walkers (depth-agnostic — work for any nesting level)
// ───────────────────────────────────────────────────────────────────

export function findCategoryNode(slug: string): CategoryNode | undefined {
  const stack: CategoryNode[] = [...CATEGORY_TREE];
  while (stack.length > 0) {
    const n = stack.pop()!;
    if (n.slug === slug) return n;
    for (const c of n.children) stack.push(c);
  }
  return undefined;
}

export function getAncestors(slug: string): CategoryNode[] {
  const node = findCategoryNode(slug);
  if (!node) return [];
  const chain: CategoryNode[] = [node];
  let current = node;
  while (current.parentSlug) {
    const parent = findCategoryNode(current.parentSlug);
    if (!parent) break;
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}

export function getCategoryPath(slug: string): string[] {
  return getAncestors(slug).map((n) => n.slug);
}

export function getAllCategoryNodes(): CategoryNode[] {
  const out: CategoryNode[] = [];
  const walk = (nodes: CategoryNode[]) => {
    for (const n of nodes) { out.push(n); walk(n.children); }
  };
  walk(CATEGORY_TREE);
  return out;
}

// ═══════════════════════════════════════════════════════════════════
// Legacy-compatible exports
// ═══════════════════════════════════════════════════════════════════

export interface SubCategory {
  slug: string;
  name: string;
  productCount: number;
}

export interface Category {
  slug: string;
  name: string;
  icon: LucideIcon;
  description: string;
  subcategories: SubCategory[];
  productCount: number;
}

export const CATEGORIES: Category[] = CATEGORY_TREE.map((root) => ({
  slug: root.slug,
  name: root.name,
  icon: root.icon ?? ShoppingBag,
  description: root.description ?? "",
  productCount: root.productCount,
  subcategories: root.children.map((c) => ({
    slug: c.slug,
    name: c.name,
    productCount: c.productCount,
  })),
}));

export function getCategoryBySlug(slug: string): Category | undefined {
  if (slug === "beauty") slug = "parfum";
  // Search the whole tree for the slug, then return the L1 root category.
  const node = findCategoryNode(slug);
  if (!node) return undefined;
  const ancestors = getAncestors(slug);
  const root = ancestors[0] ?? node;
  return CATEGORIES.find((c) => c.slug === root.slug);
}

const SIDEBAR_ORDER = [
  "it-multimedia", "beauty-gesundheit", "mode", "sport",
  "haushalt", "baumarkt-garten", "wohnen", "spielzeug",
  "baby-eltern", "buero", "supermarkt", "tierbedarf",
];

export const SIDEBAR_CATEGORIES: Category[] = SIDEBAR_ORDER
  .map((slug) => CATEGORIES.find((c) => c.slug === slug))
  .filter((c): c is Category => c !== undefined);

export function getAllCategorySlugs(): string[] {
  return CATEGORIES.map((c) => c.slug);
}

export function getSubCategoryBySlug(
  subSlug: string,
): { parent: Category; sub: SubCategory } | undefined {
  for (const cat of CATEGORIES) {
    const sub = cat.subcategories.find((s) => s.slug === subSlug);
    if (sub) return { parent: cat, sub };
  }
  return undefined;
}

// ═══════════════════════════════════════════════════════════════════
// URL resolution — supports N-level paths (1 to 6+ segments)
// ═══════════════════════════════════════════════════════════════════

export interface CategoryResolution {
  parentCategory: Category | undefined;
  activeSubCategory: SubCategory | undefined;
  activeLeafNode: CategoryNode | undefined;
  breadcrumbs: { label: string; href: string }[];
}

export function parseCategorySlugs(slugs: string[]): CategoryResolution {
  const breadcrumbs: { label: string; href: string }[] = [
    { label: "Gesamtsortiment", href: "/" },
  ];

  if (slugs.length === 0) {
    return {
      parentCategory: undefined,
      activeSubCategory: undefined,
      activeLeafNode: undefined,
      breadcrumbs,
    };
  }

  const resolved: CategoryNode[] = [];
  let current: CategoryNode | undefined;
  for (const slug of slugs) {
    const next = current
      ? current.children.find((c) => c.slug === slug) ?? findCategoryNode(slug)
      : findCategoryNode(slug);
    if (!next) break;
    resolved.push(next);
    current = next;
  }

  if (resolved.length === 0) {
    return {
      parentCategory: undefined,
      activeSubCategory: undefined,
      activeLeafNode: undefined,
      breadcrumbs,
    };
  }

  const rootChain = getAncestors(resolved[0].slug);
  const fullChain: CategoryNode[] = [];
  const seen = new Set<string>();
  for (const n of [...rootChain, ...resolved]) {
    if (!seen.has(n.slug)) { fullChain.push(n); seen.add(n.slug); }
  }

  let href = "";
  for (const n of fullChain) {
    href += `/${n.slug}`;
    breadcrumbs.push({ label: n.name, href: `/category${href}` });
  }

  const parentNode = fullChain[0];
  const parentCategory = getCategoryBySlug(parentNode.slug);
  const last = fullChain[fullChain.length - 1];

  const activeSubCategory =
    last.depth >= 1
      ? { slug: last.slug, name: last.name, productCount: last.productCount }
      : undefined;

  // Any non-root node is a valid "leaf" for display purposes — no longer
  // hardcoded to depth === 2 so the 6-level tree works.
  const activeLeafNode = last.depth >= 1 ? last : undefined;

  return { parentCategory, activeSubCategory, activeLeafNode, breadcrumbs };
}
