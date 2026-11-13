// Dynamic on-demand loader for canvas-confetti to prevent critical-path bundling
export const triggerConfetti = async (options?: {
  particleCount?: number;
  spread?: number;
  origin?: { x?: number; y?: number };
  colors?: string[];
}) => {
  try {
    const confettiModule: any = await import('canvas-confetti');
    const confettiFn = confettiModule.default || confettiModule;
    if (typeof confettiFn === 'function') {
      confettiFn(options);
    }
  } catch (err) {
    // Non-blocking graceful skip
  }
};
