import type { Language } from "@shared/schema";
import { versesEN } from "./verses-en";
import { versesFR } from "./verses-fr";
import { versesHT } from "./verses-ht";
import { getPassageId, type PassageVerse } from "./passageIdentity";

export const dailyVerses: Record<Language, PassageVerse[]> = {
  en: versesEN,
  fr: versesFR,
  ht: versesHT,
};

// English defines the existing rotation. Every translation must identify the
// same actual passage in each slot; never copy an English label onto other text.
export const canonicalPassageRotation = versesEN.map(verse => verse.passageId);

export function assertAlignedVerseCorpus(corpus: Record<Language, PassageVerse[]>): void {
  if (corpus.en.length === 0) throw new Error("Bible passage rotation must not be empty");
  for (const language of ["en", "fr", "ht"] as const) {
    if (corpus[language].length !== corpus.en.length) {
      throw new Error(`Bible passage rotation length mismatch (${language})`);
    }
    corpus[language].forEach((verse, index) => {
      if (verse.passageId !== getPassageId(verse.reference, language)
        || verse.passageId !== corpus.en[index].passageId) {
        throw new Error(`Bible passage mismatch (${language}, slot ${index + 1}): ${verse.reference}`);
      }
    });
  }
}

assertAlignedVerseCorpus(dailyVerses);

export function getVerseForDayIndex(dayIndex: number, language: Language): PassageVerse {
  if (!Number.isInteger(dayIndex) || dayIndex < 0) {
    throw new Error(`Invalid Bible passage day index: ${dayIndex}`);
  }
  // Modulo is shared, not independently calculated for different-sized pools.
  const index = dayIndex % canonicalPassageRotation.length;
  const verse = dailyVerses[language][index];
  if (verse?.passageId !== canonicalPassageRotation[index]) {
    throw new Error(`Missing Bible translation (${language}): ${canonicalPassageRotation[index]}`);
  }
  return verse;
}
