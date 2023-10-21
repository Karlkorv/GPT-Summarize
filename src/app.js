const { App } = require('@slack/bolt');

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN,
    // Socket Mode doesn't listen on a port, but in case you want your app to respond to OAuth,
    // you still need to listen on some port!
    port: parseInt(process.env.PORT || '3000')
});

app.command('/summarize', async ({ command, ack, say }) => {
    // Acknowledge command request
    await ack();
    (channelId, timeSpan) = parseCommand(command);
    messageText = getMessageRaw(channelId, timeSpan);
    responseText = summarize(messageText);
});

function parseCommand(command) {
    command.text = command.text.trim();
    splitStr = command.text.split(' ');

    if (splitStr.length != 3) {
        throw new Error('Invalid command parameters');
    }

    channelId = splitStr[0];
    timeAmt = splitStr[1];
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
    return (channelId, date);
}



(async () => {
    // Start your app
    await app.start();

    console.log('⚡️ Bolt app is running!');
})();