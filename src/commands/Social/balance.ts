import { CommandStore, KlasaClient, KlasaMessage, KlasaUser } from 'klasa';
import { SkyraCommand } from '../../lib/structures/SkyraCommand';
import { UserSettings } from '../../lib/types/settings/UserSettings';

export default class extends SkyraCommand {

	public constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			aliases: ['bal', 'credits'],
			bucket: 2,
			cooldown: 10,
			description: (language) => language.get('COMMAND_BALANCE_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_BALANCE_EXTENDED'),
			usage: '[user:username]'
		});
		this.spam = true;
	}

	public async run(message: KlasaMessage, [user = message.author]: [KlasaUser]) {
		if (user.bot) throw message.language.get('COMMAND_BALANCE_BOTS');

		await user.settings.sync();
		return message.author === user
			? message.sendLocale('COMMAND_BALANCE_SELF', [(user.settings.get(UserSettings.Money) as UserSettings.Money).toLocaleString()])
			: message.sendLocale('COMMAND_BALANCE', [user.username, (user.settings.get(UserSettings.Money) as UserSettings.Money).toLocaleString()]);
	}

}