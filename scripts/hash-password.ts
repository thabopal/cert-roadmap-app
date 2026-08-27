// Usage: npm run hash-password -- "your chosen password"
// Prints a bcrypt hash to paste into ADMIN_PASSWORD_HASH in .env.local (or
// your Vercel project's environment variables). The plaintext password is
// never stored anywhere — only this hash is.
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run hash-password -- "your chosen password"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log(hash);
console.log(
  "\nHeads up: Next.js expands unescaped $ in .env files as variable references, which corrupts a bcrypt hash (it's full of $). In .env.local, escape every $ as \\$ — e.g. paste it as:\n" +
    `ADMIN_PASSWORD_HASH=${hash.replace(/\$/g, "\\$")}\n` +
    "(On Vercel's dashboard this doesn't apply — paste the hash there unescaped, exactly as printed above.)"
);
