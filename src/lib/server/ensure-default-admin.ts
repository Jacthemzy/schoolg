import bcrypt from "bcrypt";
import { User } from "@/models/User";

const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || "admin@dms.com";
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";
const DEFAULT_ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME || "Default Admin";
const DEFAULT_ADMIN_FORCE = process.env.DEFAULT_ADMIN_FORCE === "true";

let defaultAdminPromise: Promise<void> | null = null;

export async function ensureDefaultAdmin() {
  if (!defaultAdminPromise) {
    defaultAdminPromise = (async () => {
      const email = DEFAULT_ADMIN_EMAIL.toLowerCase().trim();
      const password = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

      if (!email || !DEFAULT_ADMIN_PASSWORD) {
        return;
      }

      const update: Record<string, unknown> = {
        $setOnInsert: {
          email,
          fullName: DEFAULT_ADMIN_NAME,
          password,
          role: "admin",
        },
      };

      if (DEFAULT_ADMIN_FORCE) {
        update.$set = {
          fullName: DEFAULT_ADMIN_NAME,
          password,
          role: "admin",
        };
      }

      await User.updateOne({ email }, update, { upsert: true });
    })().catch((error) => {
      defaultAdminPromise = null;
      throw error;
    });
  }

  await defaultAdminPromise;
}
