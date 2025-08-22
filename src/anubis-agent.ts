/**
 * Anubis Agent God Mode
 *
 * Complete agent configuration with unified service architecture
 */

import { Character } from "@elizaos/core";
import { anubisCharacter } from "./anubis-character";
import anubisPlugin from "./anubis-plugin";

// Export the character with the unified plugin registered
export const anubisAgent: Character & { customPlugins: any[] } = {
  ...anubisCharacter,
  customPlugins: [anubisPlugin],
};

// Export individual components for flexibility
export { anubisCharacter } from "./anubis-character";
export { AnubisService } from "./anubis-service";
export { default as anubisPlugin } from "./anubis-plugin";
export { anubisProviders } from "./providers";

// Main export
export default anubisAgent;
