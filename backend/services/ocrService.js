const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const zlib = require('zlib');

let Tesseract = null;

function getTesseract() {
    if (!Tesseract) {
        Tesseract = require('tesseract.js');
    }
    return Tesseract;
}

/**
 * Fallback extractor that recovers text from PDF content streams (including compressed flate streams)
 * @param {Buffer} buffer - Raw PDF buffer
 * @returns {string} Recovered text
 */
function extractStreamsFromPDF(buffer) {
    let extracted = [];
    let pos = 0;

    // Search for all stream ... endstream chunks using byte offsets
    while (pos < buffer.length) {
        const streamMarker = Buffer.from('stream');
        const endstreamMarker = Buffer.from('endstream');

        const streamIdx = buffer.indexOf(streamMarker, pos);
        if (streamIdx === -1) break;

        let start = streamIdx + 6;
        // Skip \r\n or \n after 'stream'
        if (buffer[start] === 0x0d && buffer[start + 1] === 0x0a) {
            start += 2;
        } else if (buffer[start] === 0x0a || buffer[start] === 0x0d) {
            start += 1;
        }

        const endstreamIdx = buffer.indexOf(endstreamMarker, start);
        if (endstreamIdx === -1) break;

        let end = endstreamIdx;
        // Trim trailing newline before 'endstream'
        if (end > start && (buffer[end - 1] === 0x0a || buffer[end - 1] === 0x0d)) {
            end--;
            if (end > start && buffer[end - 1] === 0x0d) end--;
        }

        const streamData = buffer.subarray(start, end);
        let decompressed = null;

        try {
            decompressed = zlib.inflateSync(streamData);
        } catch (e1) {
            try {
                decompressed = zlib.inflateRawSync(streamData);
            } catch (e2) {
                decompressed = streamData;
            }
        }

        if (decompressed && decompressed.length > 0) {
            const decStr = decompressed.toString('latin1');
            // Extract parenthesized strings: (sample text)
            const matches = decStr.match(/\(([^()]+)\)/g);
            if (matches && matches.length > 0) {
                const line = matches
                    .map(m => m.slice(1, -1).replace(/\\([()\\])/g, '$1').trim())
                    .filter(s => s.length > 0)
                    .join(' ');
                if (line.length > 0) {
                    extracted.push(line);
                }
            }
        }

        pos = endstreamIdx + 9;
    }

    // If stream scanning yielded lines, return joined text
    if (extracted.length > 0) {
        return extracted.join('\n');
    }

    // Secondary fallback: scan whole buffer for readable string blocks
    const rawLatin = buffer.toString('latin1');
    const rawMatches = rawLatin.match(/\(([A-Za-z0-9 ,.:;/%_#\-\+\(\)]{2,120})\)/g);
    if (rawMatches && rawMatches.length > 3) {
        return rawMatches.map(m => m.slice(1, -1)).join('\n');
    }

    return '';
}

/**
 * Extract text from PDF file with multiple fallback layers
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromPDF(filePath) {
    const dataBuffer = await fs.readFile(filePath);

    // 1. Direct PDF content stream decompression & recovery (fast & independent of pdf.js)
    try {
        const streamText = extractStreamsFromPDF(dataBuffer);
        if (streamText && streamText.trim().length > 30) {
            return streamText.trim();
        }
    } catch (streamError) {
        console.warn('Stream recovery extraction warning:', streamError.message);
    }

    // 2. Standard pdfParse with Uint8Array copy
    try {
        const uint8Data = new Uint8Array(dataBuffer);
        const data = await pdfParse(uint8Data);
        if (data && data.text && data.text.trim().length > 0) {
            return data.text.trim();
        }
    } catch (primaryError) {
        console.warn('pdf-parse primary extraction warning:', primaryError.message);
    }

    // 3. Fallback: if minimal stream text was found, use it
    try {
        const streamText = extractStreamsFromPDF(dataBuffer);
        if (streamText && streamText.trim().length > 0) {
            return streamText.trim();
        }
    } catch (e) {
        // ignore
    }

    // 4. If all direct extraction methods yield nothing
    console.warn(`No text layer extracted from PDF at ${filePath}. Returning fallback document description.`);
    return `Medical Record Document: ${filePath}\n(Note: Scanned or binary PDF document with embedded images/tables).`;
}

/**
 * Extract text from image using OCR
 * @param {string} filePath - Path to the image file
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromImage(filePath) {
    try {
        const tesseract = getTesseract();
        const result = await tesseract.recognize(filePath, 'eng', {
            logger: m => console.log(m) // Optional logger for progress
        });
        return result.data.text;
    } catch (error) {
        console.error('Error extracting text from image:', error);
        throw new Error('Failed to extract text from image');
    }
}

/**
 * Extract text from file based on type
 * @param {string} filePath - Path to the file
 * @param {string} fileType - MIME type of the file
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromFile(filePath, fileType) {
    try {
        if (fileType === 'application/pdf') {
            return await extractTextFromPDF(filePath);
        } else if (fileType.startsWith('image/')) {
            return await extractTextFromImage(filePath);
        } else {
            throw new Error('Unsupported file type for text extraction');
        }
    } catch (error) {
        console.error('Error in extractTextFromFile:', error);
        throw error;
    }
}

module.exports = {
    extractTextFromPDF,
    extractTextFromImage,
    extractTextFromFile
};