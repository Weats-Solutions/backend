import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import { FRAME_CONFIGS } from './frame-configs';
import archiver from 'archiver';
import pLimit from 'p-limit';

export interface QrStyleConfig {
  dotColor: string;
  bgColor: string;
  errorLevel: 'L' | 'M' | 'Q' | 'H';
  frameId: number; // 0 = no frame
  frameColor: string;
  frameText: string;
  frameTextColor: string;
  /** Base64 data URI of the logo image, or empty string */
  logoBase64: string;
}

export interface ServicePointInput {
  id: string;
  name: string;
  zoneName: string;
  isMenuOnly?: boolean;
}

export interface ServicePointQrInput extends ServicePointInput {
  token: string;
  frameText?: string;
}

export interface GenerateBatchResult {
  zipBuffer: Buffer;
  totalGenerated: number;
}

/** Safe logo size ratios relative to QR size, per error correction level */
const LOGO_MAX_RATIO: Record<string, number> = {
  L: 0.07,
  M: 0.12,
  Q: 0.2,
  H: 0.25,
};

/** Blend a hex color towards white */
function blendWithWhite(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.round(r + (255 - r) * amount);
  const ng = Math.round(g + (255 - g) * amount);
  const nb = Math.round(b + (255 - b) * amount);
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

/** Escape text for safe XML embedding */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Extract inner content from an SVG string (everything between <svg> and </svg>) */
function extractSvgInnerContent(svg: string): string {
  const match = svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  return match ? match[1] : svg;
}

/** Slugify a string for safe filenames */
function slugify(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-zA-Z0-9\s-]/g, '') // remove special chars
    .trim()
    .replace(/\s+/g, '_');
}

/** Dynamically scale font size if text is too long */
function computeFontSize(
  text: string,
  baseFontSize: number,
  maxSafeChars = 9,
): number {
  if (text.length <= maxSafeChars) return baseFontSize;
  return Math.floor(baseFontSize * (maxSafeChars / text.length));
}

@Injectable()
export class QrGeneratorService {
  private readonly logger = new Logger(QrGeneratorService.name);
  // Use process.cwd() since webpack bundles __dirname to '/'
  private readonly framesDir = path.resolve(
    process.cwd(),
    'libs',
    'common',
    'src',
    'qr',
    'frames',
  );

  /**
   * Generate a single QR code as SVG string (no frame).
   */
  async generateQrSvg(url: string, config: QrStyleConfig): Promise<string> {
    const qrSvg = await QRCode.toString(url, {
      type: 'svg',
      margin: 4,
      errorCorrectionLevel: config.errorLevel,
      color: {
        dark: config.dotColor,
        light: config.bgColor,
      },
    });

    // If there's a logo, embed it centered inside the QR SVG
    if (config.logoBase64) {
      return this.embedLogoInQrSvg(qrSvg, config.logoBase64, config.errorLevel);
    }

    return qrSvg;
  }

  /**
   * Embed a logo <image> element centered inside the QR SVG.
   */
  private embedLogoInQrSvg(
    qrSvg: string,
    logoBase64: string,
    errorLevel: string,
  ): string {
    // Parse viewBox to get actual QR dimensions
    const viewBoxMatch = qrSvg.match(/viewBox="([^"]+)"/);
    if (!viewBoxMatch) return qrSvg;

    const parts = viewBoxMatch[1].split(/\s+/).map(Number);
    const qrViewSize = parts[2] || 100; // width from viewBox

    const ratio = LOGO_MAX_RATIO[errorLevel] || 0.2;
    const logoSize = Math.floor(qrViewSize * ratio);
    const logoX = Math.floor((qrViewSize - logoSize) / 2);
    const logoY = Math.floor((qrViewSize - logoSize) / 2);

    const logoElement = `<image x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" href="${logoBase64}" preserveAspectRatio="xMidYMid meet" />`;

    // Insert before closing </svg>
    return qrSvg.replace('</svg>', `${logoElement}\n</svg>`);
  }

  /**
   * Compose a QR SVG inside a frame SVG.
   * Returns a full SVG string with the frame wrapping the QR.
   */
  composeWithFrame(
    qrSvg: string,
    config: QrStyleConfig,
    pointName: string,
  ): string {
    const frameConfig = FRAME_CONFIGS[config.frameId];
    if (!frameConfig) {
      throw new Error(`Unknown frame ID: ${config.frameId}`);
    }

    // Read frame template
    const framePath = path.join(this.framesDir, `frame-${config.frameId}.svg`);
    if (!fs.existsSync(framePath)) {
      throw new Error(`Frame SVG not found: ${framePath}`);
    }
    let frameSvg = fs.readFileSync(framePath, 'utf-8');

    // Replace placeholders
    const accentColor = blendWithWhite(config.frameColor, 0.4);
    frameSvg = frameSvg
      .replaceAll('{{FRAME_COLOR}}', config.frameColor)
      .replaceAll('{{ACCENT_COLOR}}', accentColor)
      .replaceAll('{{TEXT_COLOR}}', config.frameTextColor)
      .replaceAll('{{FRAME_TEXT}}', escapeXml(config.frameText));

    // Compute font size for frame text
    const baseFontSize = 90;
    const fontSize = computeFontSize(config.frameText, baseFontSize);
    if (fontSize !== baseFontSize) {
      // Replace any font-size that matches the base (some frames use 95 etc.)
      frameSvg = frameSvg.replace(/font-size="\d+"/, `font-size="${fontSize}"`);
    }

    // Extract QR inner content
    const qrInner = extractSvgInnerContent(qrSvg);

    // Parse QR viewBox to compute scale
    const viewBoxMatch = qrSvg.match(/viewBox="([^"]+)"/);
    const qrOriginalSize = viewBoxMatch
      ? Number(viewBoxMatch[1].split(/\s+/)[2])
      : 100;

    const scale = frameConfig.qr.size / qrOriginalSize;

    // Build positioned QR group
    const qrGroup = `<g transform="translate(${frameConfig.qr.x}, ${frameConfig.qr.y}) scale(${scale.toFixed(4)})">
    ${qrInner}
  </g>`;

    // Add title for accessibility
    const title = `<title>${escapeXml(pointName)} - QR Code</title>`;

    // Inject QR group and title before closing </svg>
    return frameSvg.replace('</svg>', `${title}\n${qrGroup}\n</svg>`);
  }

  /**
   * Generate a single complete SVG (QR + optional frame).
   */
  async generateSingleSvg(
    url: string,
    config: QrStyleConfig,
    pointName: string,
  ): Promise<string> {
    const qrSvg = await this.generateQrSvg(url, config);

    if (config.frameId > 0) {
      return this.composeWithFrame(qrSvg, config, pointName);
    }

    // No frame — add title to the bare QR SVG
    const title = `<title>${escapeXml(pointName)} - QR Code</title>`;
    return qrSvg.replace('</svg>', `${title}\n</svg>`);
  }

  /**
   * Generate a batch of QR codes as a ZIP buffer.
   * Organized by zone folders: ZoneName/PointName.svg
   */
  async generateBatch(
    points: ServicePointQrInput[],
    config: QrStyleConfig,
    baseUrl: string,
  ): Promise<GenerateBatchResult> {
    const limit = pLimit(5);

    const results: { zoneName: string; fileName: string; svg: string }[] = [];

    await Promise.all(
      points.map((point) =>
        limit(async () => {
          const pointConfig = point.frameText
            ? { ...config, frameText: point.frameText }
            : config;
          const url = `${baseUrl}${point.token}`;
          const svg = await this.generateSingleSvg(
            url,
            pointConfig,
            point.name,
          );

          results.push({
            zoneName: slugify(point.zoneName),
            fileName: `${slugify(point.name)}.svg`,
            svg,
          });
        }),
      ),
    );

    // Build ZIP
    const zipBuffer = await this.buildZip(results);

    return {
      zipBuffer,
      totalGenerated: results.length,
    };
  }

  /**
   * Build a ZIP buffer from generated SVG results.
   */
  private buildZip(
    entries: { zoneName: string; fileName: string; svg: string }[],
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } });
      const chunks: Buffer[] = [];

      archive.on('data', (chunk: Buffer) => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', (err) => reject(err));

      for (const entry of entries) {
        const filePath = `${entry.zoneName}/${entry.fileName}`;
        archive.append(entry.svg, { name: filePath });
      }

      archive.finalize();
    });
  }
}
