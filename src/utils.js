import { unlink } from "fs/promises";

export async function removeFile(path) {
    try {
        unlink(path);
    } catch (err) {
        console.log(`Error while removing file`, err.message);
    }
}