/**
 * Central frame configuration for QR code generation.
 * All values are in absolute pixels within a 1000x1300 viewBox.
 *
 * - qr: position and size of the QR code area within the frame
 * - defaultTextColor: default text color for the frame (can be overridden by user)
 */
export interface FrameConfig {
  /** viewBox dimensions of the frame SVG */
  viewBox: { width: number; height: number };
  /** QR code placement within the frame (absolute coords) */
  qr: { x: number; y: number; size: number };
  /** Default text fill color for this frame */
  defaultTextColor: string;
}

export const FRAME_CONFIGS: Record<number, FrameConfig> = {
  1: {
    viewBox: { width: 1000, height: 1300 },
    qr: { x: 186, y: 221, size: 631 },
    defaultTextColor: '#000000',
  },
  2: {
    viewBox: { width: 1000, height: 1300 },
    qr: { x: 175, y: 361, size: 655 },
    defaultTextColor: '#FFFFFF',
  },
  3: {
    viewBox: { width: 1000, height: 1300 },
    qr: { x: 180, y: 319, size: 641 },
    defaultTextColor: '#000000',
  },
  4: {
    viewBox: { width: 1000, height: 1300 },
    qr: { x: 40, y: 40, size: 920 },
    defaultTextColor: '#FFFFFF',
  },
  5: {
    viewBox: { width: 1000, height: 1300 },
    qr: { x: 76, y: 75, size: 850 },
    defaultTextColor: '#FFFFFF',
  },
  6: {
    viewBox: { width: 1000, height: 1300 },
    qr: { x: 40, y: 40, size: 920 },
    defaultTextColor: '#FFFFFF',
  },
  7: {
    viewBox: { width: 1000, height: 1300 },
    qr: { x: 40, y: 40, size: 920 },
    defaultTextColor: '#000000',
  },
  8: {
    viewBox: { width: 1000, height: 1300 },
    qr: { x: 55, y: 72, size: 880 },
    defaultTextColor: '#FFFFFF',
  },
  9: {
    viewBox: { width: 1000, height: 1300 },
    qr: { x: 167, y: 198, size: 755 },
    defaultTextColor: '#FFFFFF',
  },
  10: {
    viewBox: { width: 1000, height: 1300 },
    qr: { x: 140, y: 91, size: 802 },
    defaultTextColor: '#000000',
  },
};
