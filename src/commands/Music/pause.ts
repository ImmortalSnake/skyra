import { MusicCommand } from '@lib/structures/MusicCommand';
import { CommandStore, KlasaMessage } from 'klasa';

export default class extends MusicCommand {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			description: language => language.tget('COMMAND_PAUSE_DESCRIPTION'),
			music: ['VOICE_PLAYING', 'SAME_VOICE_CHANNEL', 'DJ_MEMBER']
		});
	}

	public async run(message: KlasaMessage) {
		await message.guild!.music.pause(false, this.getContext(message));
	}

}
