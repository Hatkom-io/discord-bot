import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (message.channel.id !== process.env.DISCORD_CHANNEL_ID) return;

  const title = message.content.slice(0, 100).replace(/"/g, '\\"');
  const body = message.content.replace(/"/g, '\\"');

  const query = `
  mutation {
    addProjectV2DraftIssue(input: {
      projectId: "${process.env.PROJECT_ID}",
      title: "${title}",
      body: "${body}"
    }) {
      projectItem {
        id
      }
    }
  }
  `;

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
    const json = await res.json();
    if (json.errors) {
      console.error('GitHub API error:', json.errors);
    } else {
      console.log('Created draft:', json.data.addProjectV2DraftIssue.projectItem.id);
    }
  } catch (e) {
    console.error('Fetch error:', e);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);