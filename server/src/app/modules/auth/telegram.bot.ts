import { Telegraf } from "telegraf";
import https from "https";
import config from "../../config";
import { User } from "./auth.model";

let botUsername = "";

const agent = new https.Agent({ family: 4 });
const bot = new Telegraf(config.telegramBotToken, { telegram: { agent } });

bot.start(async (ctx) => {
  const token = ctx.payload;

  if (!token) {
    return ctx.reply(
      "Welcome to Vocabo Bot!\n\n" +
        "To connect your account, go to the Vocabo app profile page and click Connect Telegram."
    );
  }

  try {
    const user = await User.findOne({ telegramConnectToken: token });
    if (!user) {
      return ctx.reply("Invalid or expired token. Please generate a new one from the Vocabo app.");
    }

    user.telegramChatId = ctx.chat.id;
    user.telegramConnected = true;
    user.telegramConnectToken = null;
    user.telegramUsername = ctx.from.username || "";
    await user.save();

    ctx.reply(
      "✅ Telegram connected successfully.\n\n" +
      "You'll now receive task notifications."
    );
  } catch (error) {
    console.error("Telegram connect error:", error);
    ctx.reply("Something went wrong. Please try again.");
  }
});

export async function startBot() {
  try {
    const botInfo = await bot.telegram.getMe();
    botUsername = botInfo.username || "";
    console.log(`Telegram bot @${botUsername} started`);
    bot.launch();
  } catch (error) {
    console.error("Failed to start Telegram bot:", error);
  }
}

export function getBotUsername() {
  return botUsername;
}

export default bot;
