import type { FastifyInstance } from 'fastify'
import type { Attachment } from '../../../core/entities/attachment.js'
import type { IAttachmentService } from '../../../core/services/attachment.svc.js'

const REF_MAP = {
    imageId: 'image',
    bannerAttachmentId: 'banner',
    profileImageId: 'profileImage',
    attachmentId: 'attachment',
} as const

type RefKey = keyof typeof REF_MAP

const refKeys = new Set<string>(Object.keys(REF_MAP))

export interface AttachmentView {
    id: string
    url: string
    compressedUrl: string | null
    fileName: string
    mimeType: string
    fileSize: number
}

const toView = (a: Attachment): AttachmentView => ({
    id: a.id,
    url: a.fileUrl,
    compressedUrl: a.compressedFileUrl ?? null,
    fileName: a.fileName,
    mimeType: a.mimeType,
    fileSize: a.fileSize,
})

const collectIds = (payload: unknown, ids: Set<string>): void => {
    if (payload === null || payload === undefined) return
    if (Array.isArray(payload)) {
        for (const item of payload) collectIds(item, ids)
        return
    }
    if (typeof payload !== 'object') return
    if (payload instanceof Date || Buffer.isBuffer(payload)) return

    const obj = payload as Record<string, unknown>
    for (const key of Object.keys(obj)) {
        const value = obj[key]
        if (refKeys.has(key) && typeof value === 'string') {
            ids.add(value)
        } else if (value && typeof value === 'object') {
            collectIds(value, ids)
        }
    }
}

const inlineRefs = (payload: unknown, map: Map<string, AttachmentView>): unknown => {
    if (payload === null || payload === undefined) return payload
    if (Array.isArray(payload)) return payload.map((item) => inlineRefs(item, map))
    if (typeof payload !== 'object') return payload
    if (payload instanceof Date || Buffer.isBuffer(payload)) return payload

    const obj = payload as Record<string, unknown>
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
        if (key in REF_MAP) {
            const viewKey = REF_MAP[key as RefKey]
            result[viewKey] = typeof value === 'string' ? (map.get(value) ?? null) : null
        } else if (value && typeof value === 'object') {
            result[key] = inlineRefs(value, map)
        } else {
            result[key] = value
        }
    }
    return result
}

export const registerAttachmentResolution = (
    server: FastifyInstance,
    attachmentService: IAttachmentService,
): void => {
    server.addHook('preSerialization', async (_request, _reply, payload) => {
        if (payload === null || payload === undefined) return payload

        const ids = new Set<string>()
        collectIds(payload, ids)
        if (ids.size === 0) return payload

        const fetched = await Promise.all(
            [...ids].map((id) => attachmentService.getAttachmentById(id)),
        )
        const map = new Map<string, AttachmentView>()
        for (const a of fetched) {
            if (a) map.set(a.id, toView(a))
        }
        return inlineRefs(payload, map)
    })
}
