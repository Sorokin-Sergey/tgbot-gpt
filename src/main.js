import { Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import { code } from "telegraf/format"
import config from "config";

import { ogg } from './ogg.js';
import { openai } from "./openai.js";

const INITIAL_SESSION = {
    messages: []
};

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

bot.use(session());

bot.command('start', async (ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply('Жду темы для беседы');
});

bot.command('new', async (ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply('Жду новой темы для беседы');
});

bot.on(message('voice'), async (ctx) => {
    ctx.session ??= INITIAL_SESSION;
    try {
        await ctx.reply(code('Сообщение принято. Жду ответ сервера...'));
        const userId = String(ctx.message.from.id);
        const linkVoice = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        const oggPath = await ogg.create(linkVoice.href, userId);
        const mp3Path = await ogg.toMp3(oggPath, userId);
        const text = await openai.transcription(mp3Path);
        await ctx.reply(code(`Ваш запрос: ${text}`));

        ctx.session.messages.push({
            role: openai.roles.USER,
            content: text
        })
        
        const res = await openai.chat(ctx.session.messages);

        ctx.session.messages.push({
            role: openai.roles.ASSISTANT,
            content: res.content
        })

        await ctx.reply(res.content);
    } catch (err) {
        console.log(`Error while voice message`, err.message);
    }
});

bot.on(message('text'), async (ctx) => {
    ctx.session ??= INITIAL_SESSION;
    try {
        await ctx.reply(code('Сообщение принято. Жду ответ сервера...'));
        await ctx.reply(code(`Ваш запрос: ${ctx.message.text}`));

        ctx.session.messages.push({
            role: openai.roles.USER,
            content: ctx.message.text
        })
        
        const res = await openai.chat(ctx.session.messages);

        ctx.session.messages.push({
            role: openai.roles.ASSISTANT,
            content: res.content
        })

        await ctx.reply(res.content);
    } catch (err) {
        console.log(`Error while voice message`, err.message);
    }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));