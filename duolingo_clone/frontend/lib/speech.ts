"use client";

export function isSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string, lang: string = "es-ES"): void {
  if (!isSupported()) return;

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.85;

    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find((v) => v.lang.toLowerCase().startsWith("es"));
    if (esVoice) {
      utterance.voice = esVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error("Speech synthesis error:", err);
  }
}

export function cancel(): void {
  if (!isSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch (err) {
    console.error("Speech synthesis cancel error:", err);
  }
}
