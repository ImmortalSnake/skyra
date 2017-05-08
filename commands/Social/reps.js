exports.run = async (client, msg) => {
  try {
    const rep = msg.author.profile.reputation;
    msg.send(`Dear ${msg.author}, you have a total of ${rep} reputation point${rep ? "s" : ""}`);
  } catch (e) {
    msg.error(e);
  }
};


exports.conf = {
  enabled: true,
  runIn: ["text"],
  aliases: [],
  permLevel: 0,
  botPerms: [],
  requiredFuncs: [],
  spam: true,
  mode: 1,
  cooldown: 60,
};

exports.help = {
  name: "reps",
  description: "Check how many reputation points do you have.",
  usage: "",
  usageDelim: " ",
  extendedHelp: "",
};