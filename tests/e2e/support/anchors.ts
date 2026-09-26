/**
 * Immutable on-chain anchors, mirrored from `src/constants.js`. Deterministic detail-page
 * journeys (future iterations) reference these so specs never hardcode chain data. The
 * navigation-smoke journey does not use them yet — they are established here for reuse.
 */
export const MAINNET_GENESIS_BLOCK = [
  '000006cb93385b8b87a545a1cbb6197e6caff600c12cc12fc54250d39c8088fc',
] as const;

export const MAINNET_GENESIS_TX = [
  '0002d4d2a15def7604688e1878ab681142a7b155cbe52a6b4e031250ae96db0a',
  '0002ad8d1519daaddc8e1a37b14aac0b045129c01832281fb1c02d873c7abbf9',
] as const;

export const TESTNET_GENESIS_BLOCK = [
  '0000033139d08176d1051fb3a272c3610457f0c7f686afbe0afe3d37f966db85',
] as const;

export const TESTNET_GENESIS_TX = [
  '00e161a6b0bee1781ea9300680913fb76fd0fac4acab527cd9626cc1514abdc9',
  '00975897028ceb037307327c953f5e7ad4d3f42402d71bd3d11ecb63ac39f01a',
] as const;

/** Native token (HTR) uid used across the explorer. */
export const HTR_UID = '00';
