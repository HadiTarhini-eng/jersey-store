import crypto from "crypto"
import "dotenv/config"

function getSalt(): string {
    const salt = process.env.HASH_SALT
    if (!salt) throw new Error("HASH_SALT env var is required for password hashing")
    return salt
}

export function HashPassword(password: string) {
    return crypto
        .pbkdf2Sync(password, getSalt(), 1000, 64, "sha512")
        .toString("hex")
}

export function VerifyPassword({
    password,
    hash,
}: {
    password: string
    hash: string
}) {
    const newHash = crypto
        .pbkdf2Sync(password, getSalt(), 1000, 64, "sha512")
        .toString("hex")

    // Constant-time comparison to avoid timing leaks.
    const a = Buffer.from(newHash, "hex")
    const b = Buffer.from(hash, "hex")
    return a.length === b.length && crypto.timingSafeEqual(a, b)
}
