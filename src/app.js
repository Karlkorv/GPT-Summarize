const { App } = require('@slack/bolt');
const { OpenAI } = require("langchain/llms/openai");

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN,
    // Socket Mode doesn't listen on a port, but in case you want your app to respond to OAuth,
    // you still need to listen on some port!
    port: parseInt(process.env.PORT || '3000')
});

const llm = new OpenAI({
    openAIApiKey: process.env.OPENAI_SECRET,
});


app.command('/summarize', async ({ command, ack, say }) => {
    // Acknowledge command request
    await ack();

    const { channelId, date } = parseCommand(command);
    const messages = await getRawMessages(channelId, date);
    const responseText = await summarize(messages);

    await say(responseText);
});

async function getRawMessages(channelId, fromDate) {
    const messages = await app.client.conversations.history({
        token: process.env.SLACK_BOT_TOKEN,
        channel: channelId,
        oldest: fromDate.getTime() / 1000,
        limit: 1000
    });

    // Extract message text and user id:
    messages.messages = messages.messages.map(message => {
        return {
            text: message.text,
            user: message.user
        }
    });

    return messages.messages;
}


function parseCommand(command) {
    command.text = command.text.trim();
    splitStr = command.text.split(' ');

    if (splitStr.length != 3) {
        throw new Error('Invalid command parameters');
    }

    channelId = splitStr[0].match(/<#(C\w+)(\|[^>]+)?>/)[1]; // god forgive me
    timeAmt = parseInt(splitStr[1]);
    timeUnit = splitStr[2];

    // Convert timeAmt and timeUnit to date
    let date;
    switch (timeUnit.toLowerCase()) {
        case 'day':
            date = new Date(Date.now() - timeAmt * 24 * 60 * 60 * 1000);
            break;
        case 'week':
            date = new Date(Date.now() - timeAmt * 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            date = new Date(Date.now() - timeAmt * 30 * 24 * 60 * 60 * 1000);
            break;
        default:
            throw new Error('Invalid time unit');
    }
    return { channelId, date };
}

async function summarize(messages) {
    let text = 'Summarize the following messages, disregard messages you deem unimportant: \n';
    messages.forEach(message => {
        text += message.user + " sent: \n"
        text += message.text + '\n';
    });

    return await llm.predict(text);
}



(async () => {
    // Start your app
    await app.start();

    console.log('⚡️ Bolt app is running!');
})();