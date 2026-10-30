// MathLive loads its fonts at runtime; serve them from /public instead of a CDN.
import { cpSync, existsSync } from "node:fs";

const src = "node_modules/mathlive/fonts";
if (existsSync(src)) cpSync(src, "public/mathlive/fonts", { recursive: true });
