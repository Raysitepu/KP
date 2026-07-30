import { processFaqQuestion } from "@/utils/faq";

const suggestions = [
  "Apa itu prakiraan cuaca?",
  "Apa arti kelembapan?",
  "Seberapa sering data diperbarui?",
  "Dari mana sumber data aplikasi?",
];

const staticEntries = [
  {
    pattern: /\bapa (?:itu|arti) bmkg\b/i,
    answer:
      "BMKG adalah Badan Meteorologi, Klimatologi, dan Geofisika, lembaga pemerintah yang menyediakan informasi cuaca, iklim, kualitas udara, gempa bumi, dan tsunami di Indonesia.",
  },
  {
    pattern: /\bapa (?:itu|arti) prakiraan cuaca\b/i,
    answer:
      "Prakiraan cuaca adalah perkiraan kondisi atmosfer untuk waktu dan wilayah tertentu berdasarkan pengamatan serta pemodelan. Prakiraan bukan pengukuran langsung dan dapat diperbarui.",
  },
  {
    pattern: /\bapa (?:itu|arti) kelembapan\b/i,
    answer:
      "Kelembapan menunjukkan banyaknya uap air di udara dalam persen. Nilai yang lebih tinggi berarti udara mengandung lebih banyak uap air.",
  },
  {
    pattern: /\bapa (?:itu|arti) magnitudo\b/i,
    answer:
      "Magnitudo menunjukkan besarnya energi yang dilepaskan saat gempa. Semakin besar nilainya, semakin besar energi gempanya.",
  },
  {
    pattern: /\bapa (?:itu|arti) peringatan dini\b/i,
    answer:
      "Peringatan dini cuaca adalah informasi resmi mengenai potensi cuaca signifikan agar masyarakat dapat meningkatkan kewaspadaan.",
  },
  {
    pattern: /\b(seberapa sering|kapan) (?:data )?(?:diperbarui|update)\b/i,
    answer:
      "Data mengikuti jadwal pembaruan BMKG. Aplikasi menyimpan prakiraan sekitar 30 menit dan peringatan sekitar 5 menit untuk membatasi request berulang.",
  },
  {
    pattern: /\b(dari mana|sumber) (?:sumber )?data\b/i,
    answer:
      "Prakiraan cuaca, gempa, dan peringatan berasal dari layanan publik BMKG. Dataset wilayah Sumatera Utara berasal dari kode administrasi Kemendagri yang dapat diregenerasi.",
  },
];

export function isStaticFaqQuestion(question: string) {
  const isDefinition =
    /\b(apa itu|apa arti|pengertian|seberapa sering|dari mana sumber|sumber data)\b/i.test(
      question,
    );
  const needsLiveContext =
    /\b(hari ini|besok|lusa|sekarang|saat ini|pagi|siang|sore|malam|dini hari)\b|\b(?:di|untuk)\s+[\p{L}]/iu.test(
      question,
    );
  return isDefinition && !needsLiveContext;
}

export function answerStaticFaq(question: string) {
  const direct = staticEntries.find((entry) => entry.pattern.test(question));
  if (direct)
    return {
      answer: `${direct.answer} Sumber informasi: BMKG.`,
      suggestions,
    };
  const result = processFaqQuestion(question, {});
  if (result.matchedId && result.confidence >= 0.48)
    return {
      answer: `${result.answer} Sumber informasi: BMKG.`,
      suggestions: result.suggestions.length
        ? result.suggestions.slice(0, 4)
        : suggestions,
    };
  return {
    answer:
      "Saya belum memahami pertanyaan tersebut. Saya dapat membantu prakiraan cuaca dinamis berdasarkan lokasi atau menjelaskan istilah umum BMKG.",
    suggestions,
  };
}
