exports.run = async (client, msg, [type, name]) => {
    switch (type) {
        case "inhibitor":
            if (name === "all") {
                await client.funcs.loadCommandInhibitors();
                await Promise.all(client.commandInhibitors.map((piece) => {
                    if (piece.init) return piece.init(client);
                    return true;
                }));
                return msg.send("✅ Reloaded all inhibitors.");
            }
            await msg.send(`Attempting to reload inhibitor ${name}`);
            return client.funcs.reloadInhibitor(name)
                .then(mes => msg.send(`✅ ${mes}`))
                .catch(err => msg.send(`❌ ${err}`));

        case "finalizer":
            if (name === "all") {
                await client.funcs.loadCommandFinalizers();
                await Promise.all(client.commandFinalizers.map((piece) => {
                    if (piece.init) return piece.init(client);
                    return true;
                }));
                return msg.send("✅ Reloaded all finalizers.");
            }
            await msg.send(`Attempting to reload finalizer ${name}`);
            return client.funcs.reloadFinalizer(name)
                .then(mes => msg.send(`✅ ${mes}`))
                .catch(err => msg.send(`❌ ${err}`));

        case "event":
            if (name === "all") {
                await client.funcs.loadEvents();
                return msg.send("✅ Reloaded all events.");
            }
            await msg.send(`Attempting to reload event: ${name}`);
            return client.funcs.reloadEvent(name)
                .then(mes => msg.send(`✅ ${mes}`))
                .catch(err => msg.send(`❌ ${err}`));

        case "monitor":
            if (name === "all") {
                await client.funcs.loadMessageMonitors();
                await Promise.all(client.messageMonitors.map((piece) => {
                    if (piece.init) return piece.init(client);
                    return true;
                }));
                return msg.send("✅ Reloaded all monitors.");
            }
            await msg.send(`Attempting to reload monitor: ${name}`);
            return client.funcs.reloadMessageMonitor(name)
                .then(mes => msg.send(`✅ ${mes}`))
                .catch(err => msg.send(`❌ ${err}`));

        case "command":
            if (name === "all") {
                await client.funcs.loadCommands();
                await Promise.all(client.commands.map((piece) => {
                    if (piece.init) return piece.init(client);
                    return true;
                }));
                return msg.send("✅ Reloaded all commands.");
            }
            await msg.send(`Attempting to reload command ${name}`);
            return client.funcs.reloadCommand(name)
                .then(mes => msg.send(`✅ ${mes}`))
                .catch(err => msg.send(`❌ ${err}`));

        default:
            return msg.send("How is this possible?");
    }
};

exports.conf = {
    enabled: true,
    runIn: ["text", "dm", "group"],
    aliases: ["r", "load"],
    permLevel: 10,
    botPerms: [],
    requiredFuncs: [],
    requiredSettings: [],
};

exports.help = {
    name: "reload",
    description: "Reloads the command file, if it's been updated or modified.",
    usage: "<inhibitor|finalizer|monitor|event|command> <name:str>",
    usageDelim: " ",
};