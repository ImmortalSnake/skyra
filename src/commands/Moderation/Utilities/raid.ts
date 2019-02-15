import { MessageEmbed } from 'discord.js';
import { CommandStore, KlasaClient, KlasaMessage } from 'klasa';
import { SkyraCommand } from '../../../lib/structures/SkyraCommand';
import { GuildSettings } from '../../../lib/types/settings/GuildSettings';

export default class extends SkyraCommand {

	public constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			cooldown: 5,
			description: 'Manage the Anti-RAID system.',
			permissionLevel: 6,
			requiredPermissions: ['EMBED_LINKS'],
			runIn: ['text'],
			usage: '<clear|cool|show:default>'
		});
	}

	public async run(message: KlasaMessage, [type]: [string]) {
		if (!message.guild.settings.get(GuildSettings.Selfmod.Raid)) throw message.language.get('COMMAND_RAID_DISABLED');
		if (!message.guild.me.permissions.has('KICK_MEMBERS')) throw message.language.get('COMMAND_RAID_MISSING_KICK');

		return this[type](message);
	}

	public show(message: KlasaMessage) {
		const { raid } = message.guild.security;
		const embed = new MessageEmbed()
			.setTitle(message.language.get('COMMAND_RAID_LIST'))
			.setDescription([...raid.keys()].map((user) => `<@${user}>`))
			.setFooter(`${raid.size}/${message.guild.settings.get(GuildSettings.Selfmod.Raidthreshold)} ${message.language.get('CONST_USERS')}`)
			.setTimestamp();

		return message.sendMessage({ embed });
	}

	public clear(message: KlasaMessage) {
		message.guild.security.raid.clear();
		return message.sendLocale('COMMAND_RAID_CLEAR');
	}

	public cool(message: KlasaMessage) {
		message.guild.security.raid.stop();
		return message.sendLocale('COMMAND_RAID_COOL');
	}

}