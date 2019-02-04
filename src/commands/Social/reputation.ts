import { CommandStore, KlasaClient, KlasaMessage, KlasaUser } from 'klasa';
import { SkyraCommand } from '../../lib/structures/SkyraCommand';
import { UserSettings } from '../../lib/types/settings/UserSettings';
import { TIME } from '../../lib/util/constants';

export default class extends SkyraCommand {

	private readonly busy: Set<string> = new Set();

	public constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			aliases: ['rep'],
			bucket: 2,
			cooldown: 30,
			description: (language) => language.get('COMMAND_REPUTATION_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_REPUTATION_EXTENDED'),
			quotedStringSupport: true,
			runIn: ['text'],
			spam: true,
			usage: '[check] (user:username)',
			usageDelim: ' '
		});

		this.createCustomResolver('username', (arg, possible, msg, [check]) => {
			if (!arg) return check ? msg.author : undefined;
			return this.client.arguments.get('username').run(arg, possible, msg);
		});
	}

	public async run(message: KlasaMessage, [check, user]: ['check', KlasaUser]) {
		const now = Date.now();
		const selfSettings = await message.author.settings.sync();
		const extSettings = user ? await user.settings.sync() : null;

		if (check) {
			if (user.bot) throw message.language.get('COMMAND_REPUTATION_BOTS');
			return message.sendMessage(message.author === user
				? message.language.get('COMMAND_REPUTATIONS_SELF', selfSettings.get(UserSettings.Reputation) as UserSettings.Reputation)
				: message.language.get('COMMAND_REPUTATIONS', user.username, extSettings.get(UserSettings.Reputation) as UserSettings.Reputation));
		}

		const timeReputation = selfSettings.get(UserSettings.TimeReputation) as UserSettings.TimeReputation;
		if (this.busy.has(message.author.id) || timeReputation + TIME.DAY > now)
			return message.sendLocale('COMMAND_REPUTATION_TIME', [timeReputation + TIME.DAY - now]);

		if (!user) return message.sendLocale('COMMAND_REPUTATION_USABLE');
		if (user.bot) throw message.language.get('COMMAND_REPUTATION_BOTS');
		if (user === message.author) throw message.language.get('COMMAND_REPUTATION_SELF');
		this.busy.add(message.author.id);

		try {
			await extSettings.increase('reputation', 1);
			await selfSettings.update('timeReputation', now);
		} catch (err) {
			this.busy.delete(message.author.id);
			throw err;
		}

		this.busy.delete(message.author.id);
		return message.sendLocale('COMMAND_REPUTATION_GIVE', [user]);
	}

}
