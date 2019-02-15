import { GuildMember, MessageEmbed, Role, User } from 'discord.js';
import { CommandStore, KlasaClient, KlasaMessage, KlasaUser, Language } from 'klasa';
import { SkyraCommand } from '../../lib/structures/SkyraCommand';

const sortRanks = (x: Role, y: Role) => +(y.position > x.position) || +(x.position === y.position) - 1;

export default class extends SkyraCommand {

	public constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			aliases: ['userinfo'],
			cooldown: 15,
			description: (language) => language.get('COMMAND_WHOIS_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_WHOIS_EXTENDED'),
			requiredPermissions: ['EMBED_LINKS'],
			runIn: ['text'],
			usage: '(user:username)'
		});

		this.createCustomResolver('username', (arg, possible, message) =>
			arg ? this.client.arguments.get('username').run(arg, possible, message) : message.author);
	}

	public async run(message: KlasaMessage, [user = message.author]: [User?]) {
		const member = await message.guild.members.fetch(user.id).catch(() => null);

		const embed = new MessageEmbed();
		if (member) this.member(member, embed, message.language);
		else this.user(user, embed, message.language);

		return message.sendMessage({ embed });
	}

	public member(member: GuildMember, embed: MessageEmbed, i18n: Language) {
		embed
			.setColor(member.displayColor || 0xDFDFDF)
			.setTitle(`${member.user.bot ? '🤖 ' : ''}${member.user.tag}`)
			.setURL(member.user.displayAvatarURL({ size: 1024 }))
			.setDescription(i18n.get('COMMAND_WHOIS_MEMBER', member))
			.setThumbnail(member.user.displayAvatarURL({ size: 256 }))
			.setFooter(`${this.client.user.username} ${this.client.version} | ${member.user.id}`, this.client.user.displayAvatarURL({ size: 128 }))
			.setTimestamp();

		if (member.roles.size > 1) {
			const roles = member.roles.sort(sortRanks);
			roles.delete(member.guild.id);
			embed.addField(i18n.get('COMMAND_WHOIS_MEMBER_ROLES'), [...roles.values()].map((role) => role.name).join(', '));
		}

		return embed;
	}

	public user(user: KlasaUser, embed: MessageEmbed, i18n: Language) {
		return embed
			.setColor(0xDFDFDF)
			.setTitle(`${user.bot ? '🤖 ' : ''}${user.tag}`)
			.setURL(user.displayAvatarURL({ size: 1024 }))
			.setDescription(i18n.get('COMMAND_WHOIS_USER', user))
			.setThumbnail(user.displayAvatarURL({ size: 256 }))
			.setFooter(`${this.client.user.username} ${this.client.version} | ES | ${user.id}`, this.client.user.displayAvatarURL({ size: 128 }))
			.setTimestamp();
	}

}