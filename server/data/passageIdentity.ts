import type { DailyVerse, Language } from "@shared/schema";

export type PassageVerse = DailyVerse & { passageId: string };
export type VerseTranslation = Pick<DailyVerse, "reference" | "verse" | "devotional" | "prayer">;

// Identity includes the book AND the complete chapter/verse range. Numeric
// rotation IDs are not passage identities (the rotation contains repeats).
const books: readonly [string, string, string][] = [
  ["Genesis", "Genèse", "Jenèz"], ["Exodus", "Exode", "Egzòd"],
  ["Numbers", "Nombres", "Nonb"], ["Deuteronomy", "Deutéronome", "Detewonòm"],
  ["Joshua", "Josué", "Jozye"], ["Judges", "Juges", "Jij"],
  ["Ruth", "Ruth", "Rit"], ["1 Samuel", "1 Samuel", "1 Samyèl"],
  ["2 Chronicles", "2 Chroniques", "2 Kwonik"], ["Nehemiah", "Néhémie", "Neyemi"],
  ["Job", "Job", "Jòb"], ["Psalm", "Psaume", "Sòm"],
  ["Proverbs", "Proverbes", "Pwovèb"], ["Ecclesiastes", "Ecclésiaste", "Eklezyas"],
  ["Song of Solomon", "Cantique des cantiques", "Kantik Salomon"],
  ["Isaiah", "Ésaïe", "Ezayi"], ["Jeremiah", "Jérémie", "Jeremi"],
  ["Lamentations", "Lamentations", "Lamantasyon"], ["Ezekiel", "Ézéchiel", "Ezekyèl"],
  ["Daniel", "Daniel", "Danyèl"], ["Hosea", "Osée", "Oze"],
  ["Joel", "Joël", "Jowèl"], ["Amos", "Amos", "Amòs"],
  ["Micah", "Michée", "Miche"], ["Nahum", "Nahum", "Nawoum"],
  ["Habakkuk", "Habacuc", "Abakik"], ["Zephaniah", "Sophonie", "Sofoni"],
  ["Zechariah", "Zacharie", "Zakari"], ["Malachi", "Malachie", "Malaki"],
  ["Matthew", "Matthieu", "Matye"], ["Mark", "Marc", "Mak"],
  ["Luke", "Luc", "Lik"], ["John", "Jean", "Jan"], ["Acts", "Actes", "Travay"],
  ["Romans", "Romains", "Women"], ["1 Corinthians", "1 Corinthiens", "1 Korentyen"],
  ["2 Corinthians", "2 Corinthiens", "2 Korentyen"], ["Galatians", "Galates", "Galat"],
  ["Ephesians", "Éphésiens", "Efezyen"], ["Philippians", "Philippiens", "Filipyen"],
  ["Colossians", "Colossiens", "Kolosyen"],
  ["1 Thessalonians", "1 Thessaloniciens", "1 Tesalonik"],
  ["2 Thessalonians", "2 Thessaloniciens", "2 Tesalonik"],
  ["1 Timothy", "1 Timothée", "1 Timote"], ["2 Timothy", "2 Timothée", "2 Timote"],
  ["Titus", "Tite", "Tit"], ["Hebrews", "Hébreux", "Ebre"],
  ["James", "Jacques", "Jak"], ["1 Peter", "1 Pierre", "1 Pyè"],
  ["2 Peter", "2 Pierre", "2 Pyè"], ["1 John", "1 Jean", "1 Jan"],
  ["2 John", "2 Jean", "2 Jan"], ["Revelation", "Apocalypse", "Revelasyon"],
];

export function getPassageId(reference: string, language: Language): string {
  const match = /^(.+) (\d+:\d+(?:-\d+)?)$/.exec(reference);
  const column = { en: 0, fr: 1, ht: 2 }[language];
  const book = books.find(names => names[column] === match?.[1]);
  if (!match || !book) {
    throw new Error(`Unknown Bible passage (${language}): ${reference}`);
  }
  return `${book[0]} ${match[2]}`;
}

export function identifyVerses(verses: DailyVerse[], language: Language): PassageVerse[] {
  return verses.map(verse => ({
    ...verse,
    passageId: getPassageId(verse.reference, language),
  }));
}
