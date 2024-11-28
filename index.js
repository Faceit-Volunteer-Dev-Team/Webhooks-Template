const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");
const dotenv = require("dotenv");
dotenv.config({ path: `${__dirname}/./config.env` });
const token = process.env.FACEIT_API_KEY;

// Security configuration - customize these values
const SECURITY_HEADER_NAME = "X-Security";
const SECURITY_HEADER_VALUE = "your-secure-header";
const SECURITY_QUERY_NAME = "auth";
const SECURITY_QUERY_VALUE = "your-secure-value";
const DISCORD_WEBHOOK_URL1 = process.env.DISCORD_WEBHOOK_URL;

// FACEIT level emojis
const EMOJI_IDS = {
  faceit1: "<:faceit1:1259604557453987942>",
  faceit2: "<:faceit2:1259604558737571923>",
  faceit3: "<:faceit3:1259604560029286560>",
  faceit4: "<:faceit4:1259604561367404544>",
  faceit5: "<:faceit5:1259604562805915697>",
  faceit6: "<:faceit6:1259604563871137904>",
  faceit7: "<:faceit7:1259604565544800357>",
  faceit8: "<:faceit8:1259604860383268905>",
  faceit9: "<:faceit9:1259604862111318108>",
  faceit10: "<:faceit10:1259604863864672286>",
};

const app = express();
const PORT = process.env.PORT || 3005;

app.use(bodyParser.json());

// Function to log incoming data
function logIncomingData(data) {
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  const logFile = path.join(logDir, `webhook_data_${new Date().toISOString().replace(/:/g, '-')}.json`);
  fs.writeFileSync(logFile, JSON.stringify(data, null, 2));
  console.log(`Incoming data logged to ${logFile}`);
}

app.post("/faceit-webhook", async (req, res) => {
  const event = req.body;

  // Log the incoming data
  console.log("Received event:", JSON.stringify(event, null, 2));
  logIncomingData(event);

  let discordMessage = {
    content: "",
    embeds: [],
  };

  try {
    if (event.payload && event.payload.id) {
      const matchId = event.payload.id;

      // Verify security headers
      const roplHeader = req.header(SECURITY_HEADER_NAME);
      const queryStringValue = req.query[SECURITY_QUERY_NAME];

      if (
        roplHeader !== SECURITY_HEADER_VALUE ||
        queryStringValue !== SECURITY_QUERY_VALUE
      ) {
        throw new Error("Unauthorized request");
      }

      // Fetch detailed match information from Faceit API
      const matchResponse = await axios.get(
        `https://open.faceit.com/data/v4/matches/${matchId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const matchData = matchResponse.data;

      // Simplify event data
      const simplifiedEvent = {
        event: event.event,
        entity_name: matchData.entity ? matchData.entity.name : "N/A",
        teams: [
          {
            name: matchData.teams.faction1.name,
            players: matchData.teams.faction1.roster.map((player) => ({
              nickname: player.nickname,
              skill_level: player.game_skill_level,
              guid: player.player_id,
            })),
          },
          {
            name: matchData.teams.faction2.name,
            players: matchData.teams.faction2.roster.map((player) => ({
              nickname: player.nickname,
              skill_level: player.game_skill_level,
              guid: player.player_id,
            })),
          },
        ],
        mapPick:
          matchData.voting && matchData.voting.map
            ? matchData.voting.map.pick[0]
            : "N/A",
      };

      // Create a URL link for the match
      const matchUrl = `https://www.faceit.com/en/cs2/room/${matchId}`;

      // Construct the embed message
      const embed = new EmbedBuilder()
        .setTitle(`Match ${simplifiedEvent.event.replace("match_status_", "")}`)
        .setDescription(`[Match Link](${matchUrl})`)
        .setColor(0xff0000)
        .addFields(
          {
            name: "**Entity**",
            value: `**__${simplifiedEvent.entity_name}__**`,
            inline: false,
          },
          {
            name: "**Team 1**",
            value: simplifiedEvent.teams[0].name,
            inline: true,
          },
          {
            name: "**Team 2**",
            value: simplifiedEvent.teams[1].name,
            inline: true,
          },
          {
            name: "\u200B",
            value: "\u200B",
            inline: true,
          }, // Blank field for spacing
          {
            name: "Players",
            value: simplifiedEvent.teams[0].players
              .map(
                (player) =>
                  `${player.nickname}  ${
                    EMOJI_IDS[`faceit${player.skill_level}`]
                  }`
              )
              .join("\n"),
            inline: true,
          },
          {
            name: "Players",
            value: simplifiedEvent.teams[1].players
              .map(
                (player) =>
                  `${player.nickname}  ${
                    EMOJI_IDS[`faceit${player.skill_level}`]
                  }`
              )
              .join("\n"),
            inline: true,
          },
          {
            name: "Map Picked",
            value: simplifiedEvent.mapPick,
            inline: false,
          }
        )
        .setTimestamp(new Date(event.timestamp));

      // Send the message to Discord
      discordMessage.embeds.push(embed);

      await axios.post(DISCORD_WEBHOOK_URL1, discordMessage);
      console.log("Message sent to Discord");

      res.status(200).send("Event received and processed");
    } else {
      discordMessage.content = `Received event: ${JSON.stringify(event)}`;
      console.log("Received event with missing match ID:", JSON.stringify(event, null, 2));
      res.status(400).send("Event payload is missing match ID");
    }
  } catch (error) {
    console.error(
      "Error processing event or sending message to Discord:",
      error
    );

    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    }

    res.status(500).send("Error processing event");
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});