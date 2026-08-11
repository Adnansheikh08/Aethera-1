/**
 * Replaces `manage.py createsuperuser`.
 *
 * Django's version prompted interactively; this reads argv or env so it also
 * works unattended. TOTP is deliberately NOT enrolled here — the first login
 * walks the operator through /api/auth/totp/setup, which is the only path that
 * produces recovery codes.
 *
 *   npm run create-admin -- --username ops --email ops@aethera.dev --password '...'
 *   ADMIN_USERNAME=ops ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run create-admin
 */
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { User } from "../models/User.js";
import { logger } from "../utils/logger.js";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      out[key] = next;
      i += 1;
    } else {
      out[key] = "true";
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

const username = args.username || process.env.ADMIN_USERNAME;
const email = args.email || process.env.ADMIN_EMAIL || "";
const password = args.password || process.env.ADMIN_PASSWORD;
const force = args.force === "true";

if (!username || !password) {
  console.error(
    "Usage: npm run create-admin -- --username <name> --password <pass> [--email <addr>] [--force]",
  );
  process.exit(2);
}

if (password.length < 12) {
  console.error("Refusing to create an admin with a password under 12 characters.");
  process.exit(2);
}

await connectDatabase();

try {
  const existing = await User.findOne({ username });

  if (existing && !force) {
    console.error(
      `User "${username}" already exists. Pass --force to reset its password ` +
        "(this also revokes every active session and clears 2FA enrolment).",
    );
    process.exit(1);
  }

  if (existing) {
    await existing.setPassword(password);
    existing.email = email || existing.email;
    existing.is_superuser = true;
    existing.is_active = true;
    // A password reset must invalidate outstanding refresh tokens, and a
    // rotated credential should not inherit the old TOTP device.
    existing.token_version += 1;
    existing.totp_secret = "";
    existing.totp_confirmed = false;
    existing.recovery_code_hashes = [];
    await existing.save();

    logger.warn({ username }, "Admin password reset; sessions revoked and 2FA cleared");
    console.log(`Reset admin "${username}". Re-enrol 2FA on next login.`);
  } else {
    const user = new User({ username, email, is_superuser: true, is_active: true });
    await user.setPassword(password);
    await user.save();

    logger.info({ username }, "Admin user created");
    console.log(`Created admin "${username}". Enrol 2FA on first login.`);
  }
} finally {
  await disconnectDatabase();
}
