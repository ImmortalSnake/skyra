import { CommandStore, KlasaClient } from 'klasa';
import { WeebCommand } from '../../lib/structures/WeebCommand';

export default class extends WeebCommand {

	public constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			description: (language) => language.get('COMMAND_WSLAP_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_WSLAP_EXTENDED'),
			queryType: 'slap',
			responseName: 'COMMAND_WSLAP',
			usage: '<user:username>'
		});
	}

}