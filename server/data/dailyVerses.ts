import type { DailyVerse, Language } from "@shared/schema";
import { versesEN } from "./verses-en";
import { versesFR } from "./verses-fr";
import { versesHT } from "./verses-ht";

export const dailyVerses: Record<Language, DailyVerse[]> = {
  en: versesEN,
  fr: versesFR,
  ht: versesHT,
};
