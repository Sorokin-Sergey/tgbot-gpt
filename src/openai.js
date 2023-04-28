import { Configuration, OpenAIApi } from "openai";
import config from "config";
import { createReadStream } from "fs";

class OpenAI {
    roles = {
        ASSISTANT: 'assistant',
        USER: 'user',
        SYSTEM: 'system'
    }

    constructor(apiKey) {
        const configuration = new Configuration({
            apiKey: apiKey,
          });
          this.openai = new OpenAIApi(configuration);
    }

    async chat(messages) {
        try {
            const res = await this.openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages
            });
            return res.data.choices[0].message
        } catch (err) {
            console.log(`Error while chating`, err.message);
        }
    }

    async transcription(filepath) {
        try {
            const res = await this.openai.createTranscription(
                createReadStream(filepath),
                'whisper-1'
            );
            return res.data.text;
        } catch (err) {
            console.log(`Error while transcripting`, err.message);
        }
    }
}

export const openai = new OpenAI(config.get("OPENAI_KEY"));