import { mkdir, readFile, rename, stat, writeFile } from 'fs/promises'
import { basename, dirname, resolve } from 'path'
import { HttpErr } from '../../app/index.js'

const MAX_TRAINING_TEXT_CHARACTERS = 20_000
const TRAINING_FILE_PATH = process.env.OPENAI_TRAINING_FILE_PATH
    ? resolve(process.env.OPENAI_TRAINING_FILE_PATH)
    : resolve(process.cwd(), 'storage/chat-ai/training.txt')
const TRAINING_FILE_NAME = basename(TRAINING_FILE_PATH) || 'training.txt'

type TrainingTextCache = {
    bytes: number
    content: string
    mtimeMs: number
    updatedAt: Date
}

let cache: TrainingTextCache | undefined

export async function uploadTrainingText(params: { content: string; fileName?: string }) {
    assertTxtFileName(params.fileName)

    const content = normalizeTrainingText(params.content)
    await mkdir(dirname(TRAINING_FILE_PATH), { recursive: true })

    const tempPath = `${TRAINING_FILE_PATH}.${process.pid}.${Date.now()}.tmp`
    await writeFile(tempPath, content, 'utf8')
    await rename(tempPath, TRAINING_FILE_PATH)

    const fileStat = await stat(TRAINING_FILE_PATH)
    cache = {
        bytes: fileStat.size,
        content,
        mtimeMs: fileStat.mtimeMs,
        updatedAt: fileStat.mtime,
    }

    return {
        message: 'Đã cập nhật training text cho chat AI.',
        fileName: TRAINING_FILE_NAME,
        characters: content.length,
        bytes: fileStat.size,
        updatedAt: fileStat.mtime,
    }
}

export async function getTrainingText() {
    const info = await readTrainingText()
    return info?.content ?? ''
}

export async function getTrainingTextStatus() {
    const info = await readTrainingText()

    if (!info) {
        return {
            exists: false,
            fileName: TRAINING_FILE_NAME,
            content: '',
            characters: 0,
            bytes: 0,
            updatedAt: null,
        }
    }

    return {
        exists: true,
        fileName: TRAINING_FILE_NAME,
        content: info.content,
        characters: info.content.length,
        bytes: info.bytes,
        updatedAt: info.updatedAt,
    }
}

async function readTrainingText() {
    try {
        const fileStat = await stat(TRAINING_FILE_PATH)

        if (!fileStat.isFile()) return undefined

        if (cache && cache.mtimeMs === fileStat.mtimeMs && cache.bytes === fileStat.size) {
            return cache
        }

        const content = normalizeTrainingText(await readFile(TRAINING_FILE_PATH, 'utf8'))
        cache = {
            bytes: fileStat.size,
            content,
            mtimeMs: fileStat.mtimeMs,
            updatedAt: fileStat.mtime,
        }

        return cache
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined
        throw err
    }
}

function normalizeTrainingText(content: string) {
    const normalized = content.replace(/\r\n?/g, '\n').trim()

    if (!normalized) {
        throw new HttpErr.UnprocessableEntity(
            'File training không được rỗng.',
            'AI_TRAINING_FILE_EMPTY'
        )
    }

    if (normalized.length > MAX_TRAINING_TEXT_CHARACTERS) {
        throw new HttpErr.UnprocessableEntity(
            `File training chỉ được tối đa ${MAX_TRAINING_TEXT_CHARACTERS} ký tự.`,
            'AI_TRAINING_FILE_TOO_LARGE',
            {
                characters: normalized.length,
                maxCharacters: MAX_TRAINING_TEXT_CHARACTERS,
            }
        )
    }

    return normalized
}

function assertTxtFileName(fileName?: string) {
    if (!fileName) return

    const normalizedFileName = fileName.trim()

    if (
        !normalizedFileName ||
        normalizedFileName.includes('/') ||
        normalizedFileName.includes('\\') ||
        !normalizedFileName.toLowerCase().endsWith('.txt')
    ) {
        throw new HttpErr.UnprocessableEntity(
            'Chỉ hỗ trợ upload file .txt.',
            'AI_TRAINING_FILE_INVALID_TYPE'
        )
    }
}
