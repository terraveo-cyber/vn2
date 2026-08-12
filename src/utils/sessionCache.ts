import { EbookProject, TranslationOptions, BatchTranslationSummary } from '../types';

const BACKUP_POINTS_KEY = 'verba_nova_backup_points_v2';
const MAX_BACKUP_POINTS = 5;

export interface BackupPoint {
  id: string;
  label: string;
  savedAt: string; // ISO string
  project: EbookProject;
  activeTab: 'editor' | 'library' | 'ocr' | 'analytics' | 'annotations' | 'mancala';
  currentOptions?: TranslationOptions;
  batchSummary?: BatchTranslationSummary | null;
  chapterCount: number;
  translatedCount: number;
  totalWordCount: number;
  isAutoSave?: boolean;
}

const SAMPLE_COMPLETED_BOOKS_BACKUPS: BackupPoint[] = [
  {
    id: 'bp-sample-1',
    label: 'Completed Book — De Officiis (Cicero)',
    savedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    chapterCount: 2,
    translatedCount: 2,
    totalWordCount: 850,
    isAutoSave: false,
    activeTab: 'editor',
    project: {
      id: 'cicero-de-officiis-completed',
      title: 'De Officiis (On Duties)',
      author: 'Marcus Tullius Cicero',
      sourceLanguage: 'latin',
      era: '44 BCE (Classical Latin)',
      description: "Cicero's masterwork on moral obligation and public ethics.",
      cssContent: 'p { line-height: 1.6; }',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chapters: [
        {
          id: 'ch-de-officiis-1',
          title: 'Liber Primus: Caput I - De Morali Honestate',
          originalXhtml: '<p>Quamquam te, Marce fili, annum iam audientem Cratippum...</p>',
          translatedXhtml: '<p>Although, my son Marcus, you have been listening to Cratippus for a year now in Athens, you ought to abound in the precepts and teachings of philosophy...</p>',
          originalWordCount: 420,
          translatedWordCount: 450,
          sentenceCountOriginal: 12,
          sentenceCountTranslated: 12,
          status: 'completed',
        },
        {
          id: 'ch-de-officiis-2',
          title: 'Liber Primus: Caput II - De Fontibus Honestatis',
          originalXhtml: '<p>Sed omne quod est honestum id oritur ex aliquo quattuor partium...</p>',
          translatedXhtml: '<p>Now all that is honorable springs from one of four sources: either it consists in full perception and intelligent discovery of truth...</p>',
          originalWordCount: 380,
          translatedWordCount: 400,
          sentenceCountOriginal: 10,
          sentenceCountTranslated: 10,
          status: 'completed',
        }
      ]
    }
  },
  {
    id: 'bp-sample-2',
    label: 'Completed Book — Aeneis Book I (Virgil)',
    savedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    chapterCount: 2,
    translatedCount: 2,
    totalWordCount: 920,
    isAutoSave: false,
    activeTab: 'editor',
    project: {
      id: 'virgil-aeneid-completed',
      title: 'Aeneis (The Aeneid - Book I)',
      author: 'Publius Vergilius Maro',
      sourceLanguage: 'latin',
      era: '19 BCE (Augustan Rome)',
      description: 'The epic of Aeneas fleeing Troy to found the Roman nation.',
      cssContent: 'p { line-height: 1.6; }',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chapters: [
        {
          id: 'ch-aeneid-1',
          title: 'Canto I: Arma Virumque Cano',
          originalXhtml: '<p>Arma virumque cano, Troiae qui primus ab oris Italiam fato profugus Laviniaque venit litora...</p>',
          translatedXhtml: '<p>I sing of arms and the man who first from the coasts of Troy came to Italy, exiled by fate, to the Lavinian shores...</p>',
          originalWordCount: 460,
          translatedWordCount: 500,
          sentenceCountOriginal: 14,
          sentenceCountTranslated: 14,
          status: 'completed',
        },
        {
          id: 'ch-aeneid-2',
          title: 'Canto II: Urbs Antiqua Fuit',
          originalXhtml: '<p>Urbs antiqua fuit, Tyrii tenuere coloni, Carthago, Italiam contra Tiberinaque longe ostia...</p>',
          translatedXhtml: '<p>There was an ancient city held by Tyrian settlers, Carthage, facing Italy and the distant mouth of the Tiber...</p>',
          originalWordCount: 460,
          translatedWordCount: 480,
          sentenceCountOriginal: 12,
          sentenceCountTranslated: 12,
          status: 'completed',
        }
      ]
    }
  },
  {
    id: 'bp-sample-3',
    label: 'Completed Book — De Bello Gallico (Caesar)',
    savedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    chapterCount: 2,
    translatedCount: 2,
    totalWordCount: 780,
    isAutoSave: false,
    activeTab: 'editor',
    project: {
      id: 'caesar-gallic-war-completed',
      title: 'Commentarii de Bello Gallico (Book I)',
      author: 'Gaius Julius Caesar',
      sourceLanguage: 'latin',
      era: '58 BCE (Late Republic)',
      description: "Caesar's first-hand account of the Gallic campaign.",
      cssContent: 'p { line-height: 1.6; }',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chapters: [
        {
          id: 'ch-gallico-1',
          title: 'Liber I: Gallia Est Omnis Divisa',
          originalXhtml: '<p>Gallia est omnis divisa in partes tres, quarum unam incolunt Belgae, aliam Aquitani, tertiam...</p>',
          translatedXhtml: '<p>All Gaul is divided into three parts, one of which the Belgae inhabit, another the Aquitani, and the third...</p>',
          originalWordCount: 390,
          translatedWordCount: 410,
          sentenceCountOriginal: 11,
          sentenceCountTranslated: 11,
          status: 'completed',
        },
        {
          id: 'ch-gallico-2',
          title: 'Liber I: Apud Helvetios Nobilissimus',
          originalXhtml: '<p>Apud Helvetios longe nobilissimus fuit et ditissimus Orgetorix. Is M. Messala et M. Pisone consulibus...</p>',
          translatedXhtml: '<p>Among the Helvetii, Orgetorix was by far the most noble and wealthy. In the consulship of Marcus Messala and Marcus Piso...</p>',
          originalWordCount: 390,
          translatedWordCount: 410,
          sentenceCountOriginal: 10,
          sentenceCountTranslated: 10,
          status: 'completed',
        }
      ]
    }
  },
  {
    id: 'bp-sample-4',
    label: 'Completed Book — Metamorphoses I (Ovid)',
    savedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    chapterCount: 2,
    translatedCount: 2,
    totalWordCount: 810,
    isAutoSave: false,
    activeTab: 'editor',
    project: {
      id: 'ovid-metamorphoses-completed',
      title: 'Metamorphoses (Book I - Creation)',
      author: 'Publius Ovidius Naso',
      sourceLanguage: 'latin',
      era: '8 CE (Augustan Era)',
      description: 'Ovid’s mythological narrative on transformed bodies.',
      cssContent: 'p { line-height: 1.6; }',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chapters: [
        {
          id: 'ch-ovid-1',
          title: 'Liber I: In Nova Fert Animus',
          originalXhtml: '<p>In nova fert animus mutatas dicere formas corpora; di, coeptis nam vos mutastis et illas, adspirate mei...</p>',
          translatedXhtml: '<p>My spirit leads me to speak of forms changed into new bodies; O gods—for you have changed even those—breathe favorably upon my enterprise...</p>',
          originalWordCount: 400,
          translatedWordCount: 430,
          sentenceCountOriginal: 10,
          sentenceCountTranslated: 10,
          status: 'completed',
        },
        {
          id: 'ch-ovid-2',
          title: 'Liber I: Ante Mare et Terras',
          originalXhtml: '<p>Ante mare et terras et quod tegit omnia caelum unus erat toto naturae vultus in orbe, quem dixere chaos...</p>',
          translatedXhtml: '<p>Before the sea and lands and the sky that covers all things, nature throughout the entire universe possessed but a single aspect, which men called Chaos...</p>',
          originalWordCount: 410,
          translatedWordCount: 440,
          sentenceCountOriginal: 11,
          sentenceCountTranslated: 11,
          status: 'completed',
        }
      ]
    }
  },
  {
    id: 'bp-sample-5',
    label: 'Completed Book — In Catilinam I (Cicero)',
    savedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    chapterCount: 2,
    translatedCount: 2,
    totalWordCount: 880,
    isAutoSave: false,
    activeTab: 'editor',
    project: {
      id: 'cicero-catiline-completed',
      title: 'In Catilinam Oratio Prima',
      author: 'Marcus Tullius Cicero',
      sourceLanguage: 'latin',
      era: '63 BCE (Roman Senate)',
      description: 'The famous denunciation of Catiline in the Temple of Jupiter Stator.',
      cssContent: 'p { line-height: 1.6; }',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chapters: [
        {
          id: 'ch-catiline-1',
          title: 'Oratio I: Quo Usque Tandem',
          originalXhtml: '<p>Quo usque tandem abutere, Catilina, patientia nostra? Quam diu etiam furor iste tuus nos eludet?</p>',
          translatedXhtml: '<p>How much longer, Catiline, will you abuse our patience? How long will that madness of yours mock us?</p>',
          originalWordCount: 440,
          translatedWordCount: 470,
          sentenceCountOriginal: 13,
          sentenceCountTranslated: 13,
          status: 'completed',
        },
        {
          id: 'ch-catiline-2',
          title: 'Oratio I: Nihilne Te Nocturnum Praesidium',
          originalXhtml: '<p>Nihilne te nocturnum praesidium Palati, nihil urbis vigiliae, nihil timor populi, nihil concursus bonorum omnium...</p>',
          translatedXhtml: '<p>Does the night guard of the Palatine, do the city watches, does the fear of the people, does the assembly of all good men move you at all?</p>',
          originalWordCount: 440,
          translatedWordCount: 460,
          sentenceCountOriginal: 12,
          sentenceCountTranslated: 12,
          status: 'completed',
        }
      ]
    }
  }
];

/**
 * Loads all stored backup points (up to 5) from localStorage.
 * If fewer than 5 exist, supplements with sample completed classical books to guarantee 5 entries.
 */
export function getBackupPoints(): BackupPoint[] {
  try {
    const raw = localStorage.getItem(BACKUP_POINTS_KEY);
    let userPoints: BackupPoint[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        userPoints = parsed.filter(pt => pt && pt.project && Array.isArray(pt.project.chapters));
      }
    }

    if (userPoints.length >= MAX_BACKUP_POINTS) {
      return userPoints.slice(0, MAX_BACKUP_POINTS);
    }

    // Combine user points with sample completed books to guarantee 5 entries
    const userIds = new Set(userPoints.map(p => p.project.id));
    const needed = MAX_BACKUP_POINTS - userPoints.length;
    const fillers = SAMPLE_COMPLETED_BOOKS_BACKUPS.filter(s => !userIds.has(s.project.id)).slice(0, needed);

    return [...userPoints, ...fillers];
  } catch (err) {
    console.warn('[SessionCache] Error reading backup points from localStorage:', err);
    return SAMPLE_COMPLETED_BOOKS_BACKUPS.slice(0, MAX_BACKUP_POINTS);
  }
}

/**
 * Saves a new backup point into the rolling 5-point cache.
 * Keeps the 5 most recent backup points, discarding older ones beyond 5.
 */
export function pushBackupPoint(
  project: EbookProject,
  activeTab: 'editor' | 'library' | 'ocr' | 'analytics' | 'annotations' | 'mancala',
  label: string = 'Checkpoint',
  isAutoSave: boolean = false,
  currentOptions?: TranslationOptions,
  batchSummary?: BatchTranslationSummary | null
): BackupPoint[] {
  try {
    const existing = getBackupPoints();
    const nowIso = new Date().toISOString();
    const translatedChapters = project.chapters.filter(c => c.status === 'completed' || !!c.translatedXhtml).length;
    const totalWords = project.chapters.reduce((sum, c) => sum + (c.originalWordCount || 0), 0);

    const newPoint: BackupPoint = {
      id: `bp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      label,
      savedAt: nowIso,
      project,
      activeTab,
      currentOptions,
      batchSummary,
      chapterCount: project.chapters.length,
      translatedCount: translatedChapters,
      totalWordCount: totalWords,
      isAutoSave,
    };

    // Prevent spamming identical auto-saves within 5 seconds
    if (existing.length > 0 && isAutoSave) {
      const newest = existing[0];
      const ageMs = Date.now() - new Date(newest.savedAt).getTime();
      if (ageMs < 5000 && newest.project.id === project.id) {
        // Replace top point rather than adding duplicate
        existing[0] = newPoint;
        localStorage.setItem(BACKUP_POINTS_KEY, JSON.stringify(existing.slice(0, MAX_BACKUP_POINTS)));
        return existing.slice(0, MAX_BACKUP_POINTS);
      }
    }

    // Prepend new point and trim to 5 points max
    const updated = [newPoint, ...existing].slice(0, MAX_BACKUP_POINTS);
    localStorage.setItem(BACKUP_POINTS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('[SessionCache] Error pushing backup point:', err);
    return getBackupPoints();
  }
}

/**
 * Clears all backup points
 */
export function clearAllBackupPoints(): void {
  try {
    localStorage.removeItem(BACKUP_POINTS_KEY);
  } catch (err) {
    console.warn('[SessionCache] Failed to clear backup points:', err);
  }
}

