const { Command, util: { announcementCheck } } = require('../../index');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			requiredPermissions: ['MANAGE_ROLES'],
			cooldown: 15,
			description: msg => msg.language.get('COMMAND_UNSUBSCRIBE_DESCRIPTION'),
			extendedHelp: msg => msg.language.get('COMMAND_UNSUBSCRIBE_EXTENDED'),
			runIn: ['text']
		});
	}

	async run(msg) {
		const role = announcementCheck(msg);
		await msg.member.roles.remove(role);
		return msg.sendMessage(msg.language.get('COMMAND_UNSUBSCRIBE_SUCCESS', role.name));
	}

};