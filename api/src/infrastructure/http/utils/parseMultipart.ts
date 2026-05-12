import { type FastifyRequest } from "fastify"

export interface ParsedMultipart {
    files: Map<string, Buffer>
    fields: Map<string, string>
}

export async function parseMultipart(req: FastifyRequest): Promise<ParsedMultipart> {
    const files = new Map<string, Buffer>()
    const fields = new Map<string, string>()

    for await (const part of req.parts()) {
        if (part.type === "file") {
            const buf = await part.toBuffer()
            if (files.has(part.fieldname)) {
                // Collect multiple files under the same field name into an array-like key
                const existing = files.get(part.fieldname)!
                files.set(`${part.fieldname}_${files.size}`, existing)
                files.set(part.fieldname, buf)
            } else {
                files.set(part.fieldname, buf)
            }
        } else {
            fields.set(part.fieldname, String(part.value))
        }
    }

    return { files, fields }
}

export async function parseMultipartFiles(req: FastifyRequest, fieldname: string): Promise<Buffer[]> {
    const buffers: Buffer[] = []
    const fieldValues = new Map<string, string>()

    for await (const part of req.parts()) {
        if (part.type === "file" && part.fieldname === fieldname) {
            buffers.push(await part.toBuffer())
        } else if (part.type === "field") {
            fieldValues.set(part.fieldname, String(part.value))
        }
    }

    return buffers
}
