import { SkyraCommand } from '@lib/structures/SkyraCommand';
import { assetsFolder } from '@utils/constants';
import { Canvas } from 'canvas-constructor';
import { readFile } from 'fs-nextra';
import { CommandStore, KlasaMessage } from 'klasa';
import { join } from 'path';

export default class extends SkyraCommand {

	private bodyImage: Buffer | null = null;
	private handsImage: Buffer | null = null;

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			bucket: 2,
			cooldown: 10,
			description: language => language.tget('COMMAND_PEEPOLOVE_DESCRIPTION'),
			extendedHelp: language => language.tget('COMMAND_PEEPOLOVE_EXTENDED'),
			requiredPermissions: ['ATTACH_FILES'],
			runIn: ['text', 'dm'],
			usage: '<image:image>'
		});
	}

	public async run(message: KlasaMessage, [imageBuffer]: [Buffer]) {
		const buffer = await new Canvas(512, 512)
			.addImage(this.bodyImage!, 0, 0, 512, 512)
			.rotate(-0.4)
			.addRoundImage(imageBuffer, -210, 512 - 241, 330, 330, 330 / 2)
			.rotate(0.4)
			.addImage(this.handsImage!, 0, 0, 512, 512)
			.toBufferAsync();

		return message.channel.sendFile(buffer, 'peepoLove.png');
	}

	public async init() {
		[this.bodyImage, this.handsImage] = await Promise.all([
			readFile(join(assetsFolder, '/images/generation/peepoBody.png')),
			readFile(join(assetsFolder, '/images/generation/peepoHands.png'))
		]);
	}


}
