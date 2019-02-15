import { Collection } from 'discord.js';
import { CommandStore, KlasaClient, KlasaMessage } from 'klasa';
import { SkyraCommand } from '../../lib/structures/SkyraCommand';
import { LeaderboardUser } from '../../lib/util/Leaderboard';

const titles = {
	global: '🌐 Global Score Scoreboard',
	local: '🏡 Local Score Scoreboard'
};

export default class extends SkyraCommand {

	public constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			aliases: ['top', 'scoreboard'],
			bucket: 2,
			cooldown: 10,
			description: (language) => language.get('COMMAND_LEADERBOARD_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_LEADERBOARD_EXTENDED'),
			runIn: ['text'],
			usage: '[global|local] [index:integer]',
			usageDelim: ' '
		});
		this.spam = true;
	}

	public async run(message: KlasaMessage, [type = 'local', index = 1]: [string, number]) {
		const list = await this.client.leaderboard.fetch(type === 'local' ? message.guild.id : null);

		const { position } = list.get(message.author.id) || { position: list.size + 1 };
		const page = await this.generatePage(message, list, index - 1, position);
		return message.sendMessage(`${titles[type]}\n${page.join('\n')}`, { code: 'asciidoc' });
	}

	public async generatePage(message: KlasaMessage, list: Collection<string, LeaderboardUser>, index: number, position: number) {
		if (index > list.size / 10) index = 0;
		const retrievedPage = [], promises = [],
			page = [], listSize = list.size, pageCount = Math.ceil(listSize / 10),
			indexLength = ((index * 10) + 10).toString().length, positionOffset = index * 10;
		for (const [id, value] of list) {
			if (positionOffset > value.position) continue;
			if (positionOffset + 10 < value.position) break;
			retrievedPage.push(value);
			if (!value.name) promises.push(this.client.fetchUsername(id).then((username) => { value.name = username || `Unknown: ${id}`; }));
		}

		if (promises.length) {
			await message.sendLocale('SYSTEM_LOADING');
			await Promise.all(promises);
		}
		for (const value of retrievedPage)
			page.push(`• ${value.position.toString().padStart(indexLength, ' ')}: ${this.keyUser(value.name).padEnd(25, ' ')} :: ${value.points}`);

		page.push('');
		page.push(message.language.get('LISTIFY_PAGE', index + 1, pageCount, listSize.toLocaleString()));
		page.push(message.language.get('COMMAND_SCOREBOARD_POSITION', position));

		return page;
	}

	public keyUser(str: string) {
		const user = this.client.users.get(str);
		if (user) str = user.username;
		if (str.length < 25) return str;
		return `${str.substring(0, 22)}...`;
	}

}