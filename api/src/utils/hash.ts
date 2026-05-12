import crypto from "crypto"
import "dotenv/config"

export function HashPassword(password: string) {
    const salt = process.env.HASH_SALT as string
    const hash = crypto
        .pbkdf2Sync(password, salt, 1000, 64, "sha512")
        .toString("hex")

    return hash
}

export function VerifyPassword({
    password,
    hash,
}: {
    password: string
    hash: string
}) {
    const salt = process.env.HASH_SALT as string
    const newHash = crypto
        .pbkdf2Sync(password, salt, 1000, 64, "sha512")
        .toString("hex")

    return newHash == hash
}
